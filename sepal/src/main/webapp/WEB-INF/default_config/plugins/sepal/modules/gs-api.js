define([ "jquery", "message-bus", "./utils" ], function($, bus, utils) {
	var WMS_URL = "http://localhost:8080/geoserver/wms";
	var BASE_URL = "http://admin:geoserver@localhost:8080/geoserver/rest";
	var WORKSPACE = "files";

	function call(request, method, data, success, error) {
		$.ajax({
			dataType : "json",
			method : method,
			data : data,
			contentType : "application/json",
			url : BASE_URL + "/workspaces/" + WORKSPACE + "/" + request,
			success : success,
			error : error
		});
	}

	function get(request, success, error) {
		call(request, "GET", undefined, success, error);
	}

	function post(request, data, success, error) {
		call(request, "POST", data, success, error);
	}

	function loadSHP(layer) {
		bus.send("add-layer", {
			"id" : layer,
			"group" : "admin",
			"label" : layer,
			"active" : "true",
			"wmsLayers" : [ {
				"baseUrl" : WMS_URL,
				"wmsName" : WORKSPACE + ":" + layer
			} ]
		});
	}

	function createSHPLayer(layer) {
		var layerData = {
			"featureType" : {
				"name" : layer
			}
		}

		post("datastores/" + layer + "/featuretypes.json", JSON.stringify(layerData), function(response) {
			loadSHP(layer);
		}, function(response) {
			if (response.status == 201) {
				loadSHP(layer);
			} else {
				// Handle error
				console.log(response);
				window.alert("Cannot add SHP layer to GeoServer!");
			}
		});
	}

	function createSHPDatastore(filename, layer) {
		var storeData = {
			"dataStore" : {
				"name" : layer,
				"type" : "Shapefile",
				"enabled" : true,
				"workspace" : {
					"name" : "files"
				},
				"connectionParameters" : {
					"entry" : [ {
						"@key" : "charset",
						"$" : "UTF-8"
					}, {
						"@key" : "url",
						"$" : "file:" + filename
					} ]
				}
			}
		};

		post("datastores.json", JSON.stringify(storeData), function(response) {
			createSHPLayer(layer);
		}, function(response) {
			if (response.status == 201) {
				createSHPLayer(layer);
			} else {
				// Handle error
				console.log(response);
				window.alert("Cannot add SHP datastore to GeoServer!");
			}
		});
	}

	function addSHP(filename) {
		var layer = utils.getLayerName(filename)
		get("datastores/" + layer + ".json", function() {
			// Exists
			loadSHP(layer);
		}, function() {
			// Does not exist
			createSHPDatastore(filename, layer);
		});
	}

	function getBands(filename, callback) {
		callback([ "b1", "b2", "b3" ]);
	}

	return {
		addSHP : addSHP,
		getBands : getBands
	}
});