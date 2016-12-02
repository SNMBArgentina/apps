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

	function grayStyle(band) {
		return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
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
		              <SourceChannelName>" + band + "</SourceChannelName>\
		            </GrayChannel>\
		            </ChannelSelection>\
		          </RasterSymbolizer>\
		        </Rule>\
		      </FeatureTypeStyle>\
		    </UserStyle>\
		  </UserLayer>\
		</StyledLayerDescriptor>";
	}

	function rgbStyle(bands) {
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
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
		var layerId = layer.replace(":", "_");
		var layerName = layer.split(":")[1];
		bus.send("add-layer", {
			"id" : layerId,
			"groupId" : "base",
			"label" : layerName,
			"active" : "true",
			"mapLayers" : [ {
				"id" : layerId,
				"baseUrl" : WMS_URL,
				"wmsName" : layer,
				"zIndex" : zIndex++,
				"queryType" : "wms",
				"queryUrl" : WMS_URL
			} ]
		});
		bus.send("layer-visibility", [ layerId, true ]);
		bus.send("reload-info-control");
	}

	function getBands(layer, callback) {
		var workspace = layer.split(":")[0];
		var layerName = layer.split(":")[1];
		getJSON("/workspaces/" + workspace + "/coveragestores/" + layerName + "/coverages/" + layerName + ".json", function(response) {
			callback(response.coverage.dimensions.coverageDimension);
		}, function(response) {
			// Handle error
			console.log(response);
			window.alert("Cannot obtain TIFF bands!");
		});
	}

	function addTIFF(layer, bands) {
		var styleName = layer.replace(":", "_");
		var sld;
		if (!bands || bands.length == 0) {
			// Default
			sld = DEFAULT_STYLE;
		} else if (bands.length == 1) {
			// Grayscale
			sld = grayStyle(bands[0]);
		} else if (bands.length == 3) {
			// RGB
			sld = rgbStyle(bands);
		}
		putSLD("/styles/" + styleName, sld, function() {
			loadLayer(layer);
		}, function(response) {
			if (response.status == 200) {
				loadLayer(layer);
			} else {
				window.alert("Cannot set TIFF bands!");
			}
		});
	}

	return {
		addSHP : loadLayer,
		getBands : getBands,
		addTIFF : addTIFF
	}
});
