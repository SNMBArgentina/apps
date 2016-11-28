define([ "jquery", "message-bus", "module" ], function($, bus, module) {
	var config = module.config();
	// Just for testing purposes
	config.url = "http://localhost:8080/geoserver/ows?SERVICE=wms&VERSION=1.1.1";

	var vectorLayers = [];
	var rasterLayers = [];
	var pending = 0;
	var callback;

	function processPending() {
		pending--;
		if (pending == 0) {
			callback(vectorLayers, rasterLayers);
			callback = undefined;
			vectorLayers = [];
			rasterLayers = [];
		}
	}

	function processDescribeLayer(response) {
		var node = response.getElementsByTagName("WMS_DescribeLayerResponse")[0];
		node = node.getElementsByTagName("LayerDescription")[0];

		var type = node.getAttribute("owsType").toUpperCase();
		var name = node.getAttribute("name");
		if (type == "WCS") {
			rasterLayers.push(name);
		} else if (type = "WFS") {
			vectorLayers.push(name);
		} else {
			console.warn("Unrecognized layer owsType: " + type);
		}

		processPending();
	}

	function getLayers(c) {
		callback = c;
		pending = 0;
		vectorLayers = [];
		rasterLayers = [];

		var url = config.url + "&REQUEST=GetCapabilities";
		$.ajax(url).success(function(response) {
			var iterator = response.evaluate("//Capability/Layer/Layer", response, null, 0, null);
			var layer = iterator.iterateNext();

			var names = [];
			while (layer) {
				try {
					var name = layer.getElementsByTagName("Name")[0].textContent;
					if (name) {
						var describeUrl = config.url + "&REQUEST=DescribeLayer&LAYERS=" + encodeURIComponent(name);
						pending++;
						$.ajax(describeUrl).success(processDescribeLayer).error(function(response) {
							console.warn("Cannot get layer metadata. Ignoring: " + name);
							processPending();
						});
					}
				} catch (e) {
					console.warn(layer);
					console.warn("Cannot process layer. Ignoring");
				}
				layer = iterator.iterateNext();
			}
		}).error(function() {
			callback(null);
		});
	}

	return {
		getLayers : getLayers
	};
});