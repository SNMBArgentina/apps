define([ "jquery" ], function($) {
	var SHP = "shp";
	var TIFF = "geotiff";

	function getLayerName(filename) {
		if (filename.indexOf('.') < 0) {
			throw "Invalid filename: " + filename;
		}
		var name = filename.substring(0, filename.lastIndexOf('.'));
		return name.substring(name.lastIndexOf('/') + 1);
	}

	function getFileType(filename) {
		var ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
		if (ext == ".shp") {
			return SHP;
		} else if (ext == ".tif" || ext == ".tiff") {
			return TIFF;
		} else {
			throw "Unrecognized extension: " + filename
		}
	}

	function getStoreType(filename) {
		var filetype = getFileType(filename);
		if (filetype == SHP) {
			return "datastores";
		} else if (filetype == TIFF) {
			return "coveragestores";
		} else {
			throw "Unrecognized filetype: " + filename;
		}
	}

	return {
		getLayerName : getLayerName,
		getFileType : getFileType,
		getStoreType : getStoreType,
		SHP : SHP,
		TIFF : TIFF
	};
});