define([ "jquery", "message-bus", "./utils" ], function($, bus, utils) {
	var WMS_URL = "http://localhost:8080/geoserver/wms";
	var BASE_URL = "http://admin:geoserver@localhost:8080/geoserver/rest";
	var WORKSPACE = "files";

	var DEFAULT_STYLE = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
		<StyledLayerDescriptor xmlns=\"http://www.opengis.net/sld\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/sld\
		http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd\" version=\"1.0.0\">\
		  <UserLayer>\
		    <UserStyle>\
		      <Name>raster</Name>\
		      <FeatureTypeStyle>\
		        <FeatureTypeName>Feature</FeatureTypeName>\
		        <Rule>\
		          <RasterSymbolizer>\
		            <Opacity>1.0</Opacity>\
		          </RasterSymbolizer>\
		        </Rule>\
		      </FeatureTypeStyle>\
		    </UserStyle>\
		  </UserLayer>\
		</StyledLayerDescriptor>";

	function call(request, contentType, method, data, success, error) {
		$.ajax({
			method : method,
			data : data,
			contentType : contentType,
			url : BASE_URL + request,
			success : success,
			error : error
		});
	}

	function getJSON(request, success, error) {
		call(request, "application/json", "GET", undefined, success, error);
	}

	function postJSON(request, data, success, error) {
		call(request, "application/json", "POST", data, success, error);
	}

	function putSLD(request, data, success, error) {
		call(request, "application/vnd.ogc.sld+xml", "PUT", data, success, error);
	}

	function putXML(request, data, success, error) {
		call(request, "text/xml", "PUT", data, success, error);
	}

	var zIndex = 100;
	function loadLayer(layer) {
		bus.send("add-layer", {
			"id" : layer,
			"groupId" : "base",
			"label" : layer,
			"active" : "true",
			"mapLayers" : [ {
				"id" : layer,
				"baseUrl" : WMS_URL,
				"wmsName" : WORKSPACE + ":" + layer,
				"zIndex" : zIndex++,
				"queryType" : "wms",
				"queryUrl" : WMS_URL
			} ]
		});
		bus.send("layer-visibility", [ layer, true ]);
		bus.send("reload-info-control");
	}

	function createLayer(filename, layer, type, success) {
		var url = "/workspaces/" + WORKSPACE;
		if (type == utils.SHP) {
			url += "/datastores/";
		} else if (type == utils.TIFF) {
			url += "/coveragestores/";
		}
		url += layer + "/external." + type;
		call(url, "text/plain", "PUT", "file://" + filename, success, function(response) {
			console.log(response);
			window.alert("Cannot add " + type + " layer to GeoServer!");
		});
	}

	function createTIFFLayer(filename, layer, success) {
		var layerData = {
			"coverage" : {
				"name" : layer,
				"enabled" : true,
				"store" : {
					"name" : "files:" + filename,
				}
			}
		};

		var styleData = {
			"style" : {
				"name" : layer,
				"format" : "sld",
				"languageVersion" : {
					"version" : "1.0.0"
				},
				"filename" : layer + ".sld"
			}
		};

		var layerAdded = false;
		var styleAdded = false;
		var sldAdded = false;

		function added() {
			var xml = "<layer><defaultStyle><name>" + layer + "</name></defaultStyle></layer>";
			putXML("/layers/" + layer, xml, function() {
				success();
			}, function(response) {
				if (response.status == 201) {
					success();
				} else {
					window.alert("Cannot add TIFF layer to GeoServer!");
				}
			});
		}

		createLayer(filename, layer, utils.TIFF, function() {
			layerAdded = true;
			if (layerAdded && styleAdded && sldAdded) {
				added();
			}
		});

		postJSON("/styles.json", JSON.stringify(styleData), function(response) {
			styleAdded = true;
			if (layerAdded && styleAdded && sldAdded) {
				added();
			}
		}, function(response) {
			if (response.status == 201) {
				styleAdded = true;
				if (layerAdded && styleAdded && sldAdded) {
					added();
				}
			} else {
				window.alert("Cannot add TIFF layer to GeoServer!");
			}
		});

		putSLD("/styles/" + layer, DEFAULT_STYLE, function() {
			sldAdded = true;
			if (layerAdded && styleAdded && sldAdded) {
				added();
			}
		}, function(response) {
			if (response.status == 200) {
				sldAdded = true;
				if (layerAdded && styleAdded && sldAdded) {
					added();
				}
			} else {
				window.alert("Cannot add TIFF layer to GeoServer!");
			}
		});
	}

	function getTIFFBands(layer, callback) {
		getJSON("/workspaces/" + WORKSPACE + "/coveragestores/" + layer + "/coverages/" + layer + ".json", function(response) {
			callback(response.coverage.dimensions.coverageDimension);
		}, function(response) {
			// Handle error
			console.log(response);
			window.alert("Cannot obtain TIFF bands!");
		});
	}

	return {
		addSHP : function(filename) {
			var layer = utils.getLayerName(filename)
			function success() {
				loadLayer(layer);
			}
			getJSON("/workspaces/" + WORKSPACE + "/datastores/" + layer + ".json", success, function() {
				// Does not exist
				createLayer(filename, layer, utils.SHP, success);
			});
		},
		getBands : function(filename, callback) {
			var layer = utils.getLayerName(filename);

			function success() {
				getTIFFBands(layer, callback);
			}

			function error() {
				createTIFFLayer(filename, layer, success);
			}

			var url = "/workspaces/" + WORKSPACE + "/coveragestores/" + layer + ".json";
			getJSON(url, success, error);
		},
		addTIFF : function(filename, bands) {
			var layer = utils.getLayerName(filename)
			var sld;
			if (!bands || bands.length == 0) {
				// Default
				sld = DEFAULT_STYLE;
			} else if (bands.length == 1) {
				// Grayscale
				sld = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
<StyledLayerDescriptor xmlns=\"http://www.opengis.net/sld\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/sld\
http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd\" version=\"1.0.0\">\
  <UserLayer>\
    <UserStyle>\
      <Name>raster</Name>\
      <FeatureTypeStyle>\
        <FeatureTypeName>Feature</FeatureTypeName>\
        <Rule>\
          <RasterSymbolizer>\
            <Opacity>1.0</Opacity>\
            <ChannelSelection>\
            <GrayChannel>\
              <SourceChannelName>" + bands[0] + "</SourceChannelName>\
            </GrayChannel>\
            </ChannelSelection>\
          </RasterSymbolizer>\
        </Rule>\
      </FeatureTypeStyle>\
    </UserStyle>\
  </UserLayer>\
</StyledLayerDescriptor>"
			} else if (bands.length == 3) {
				// RGB
				sld = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
<StyledLayerDescriptor xmlns=\"http://www.opengis.net/sld\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/sld\
http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd\" version=\"1.0.0\">\
  <UserLayer>\
    <UserStyle>\
      <Name>raster</Name>\
      <FeatureTypeStyle>\
        <FeatureTypeName>Feature</FeatureTypeName>\
        <Rule>\
          <RasterSymbolizer>\
            <Opacity>1.0</Opacity>\
            <ChannelSelection>\
			  <RedChannel>\
			    <SourceChannelName>" + bands[0] + "</SourceChannelName>\
			  </RedChannel>\
			  <GreenChannel>\
			    <SourceChannelName>" + bands[1] + "</SourceChannelName>\
			  </GreenChannel>\
			  <BlueChannel>\
			    <SourceChannelName>" + bands[2]
						+ "</SourceChannelName>\
			  </BlueChannel>\
            </ChannelSelection>\
          </RasterSymbolizer>\
        </Rule>\
      </FeatureTypeStyle>\
    </UserStyle>\
  </UserLayer>\
</StyledLayerDescriptor>"
			}
			putSLD("/styles/" + layer, sld, function() {
				loadLayer(layer);
			}, function(response) {
				if (response.status == 200) {
					loadLayer(layer);
				} else {
					window.alert("Cannot set TIFF bands!");
				}
			});
		}
	}
});