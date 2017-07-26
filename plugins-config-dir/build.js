#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const fs = require('fs-extra');
const path = require('path');
const core = require('@geoladris/core');

const NODE_MODULES = 'node_modules';
const CONFIG_FILE = 'geoladris.json';
const LIB = 'jslib';
const PLUGINS_DIR = path.join('src', 'main', 'webapp', 'WEB-INF', 'default_config', 'plugins');

const MINIFIED_PLUGINS = ['@geoladris/core', '@csgeoladris/ui'];

var packageJson = JSON.parse(fs.readFileSync('package.json'));

var plugins = Object.keys(packageJson.dependencies);
plugins = plugins.filter(p => MINIFIED_PLUGINS.indexOf(p) < 0);
fs.ensureDirSync(PLUGINS_DIR);

plugins.forEach(function(plugin) {
	console.log('Processing plugin: ' + plugin);

	var pluginSrcDir = path.join(NODE_MODULES, plugin);
	var pluginName = path.basename(pluginSrcDir);
	var confFile = path.join(pluginSrcDir, CONFIG_FILE);
	var config = fs.existsSync(confFile) ? JSON.parse(fs.readFileSync(confFile)) : {};
	var pluginDestDir = path.join(PLUGINS_DIR, pluginName);

	// Copy plugin to PLUGINS_DIR
	fs.removeSync(pluginDestDir);
	fs.copySync(pluginSrcDir, pluginDestDir);

	if (!config.requirejs || !config.requirejs.paths) {
		return;
	}

	// If RequireJS paths, copy them to LIB subdirectory and update geoladris.json
	var libDir = path.join(pluginDestDir, LIB);
	fs.ensureDirSync(libDir);

	for (var libName in config.requirejs.paths) { // eslint-disable-line guard-for-in
		var libPath = config.requirejs.paths[libName];
		if (libPath.indexOf(NODE_MODULES) >= 0) {
			var libBaseName = path.basename(libPath);
			fs.copySync(libPath + '.js', path.join(libDir, libBaseName + '.js'));
			config.requirejs.paths[libName] = LIB + '/' + libBaseName;
		}
	}

	fs.writeFileSync(path.join(pluginDestDir, CONFIG_FILE), JSON.stringify(config));
});

core.buildApp(MINIFIED_PLUGINS);
