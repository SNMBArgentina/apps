define([ "jquery", "message-bus", "toolbar", "./utils", "./gs-api", "./parseGetCapabilities", "jquery-ui" ], function($, bus, toolbar, utils, gs, capabilities) {
	// Dialog
	var dialog = $("<div/>").attr("id", "sepal-add-file-dialog");
	dialog.dialog({
		title : "Add file",
		autoOpen : true,
		width : 300,
		zIndex : 2000,
		resizable : true,
		closeOnEscape : false
	});
	dialog.dialog("close");

	// File chooser
	var layerChooser = $("<div/>").attr("id", "sepal-add-layer-dialog-layerChooser").appendTo(dialog);
	var layerSelector = $("<select id='sepal-layer-selector' class='sepal-layer-selector'/>");
	var label = $("<div/>").attr("id", "sepal-add-file-label").text("Layer: ");
	layerChooser.append(label);
	layerChooser.append(layerSelector);

	// Band chooser
	var bandChooser = $("<div/>").attr("id", "sepal-add-file-dialog-bandChooser").appendTo(dialog);
	var radioDefaultStyle = $("<input id='sepal-add-tiff-radio-default-style' class='sepal-add-tiff-radio' type='radio' name='sepal-add-file-band-radio'>").appendTo(bandChooser);
	$("<label class='sepal-add-tiff-radio-label'>Default style</label>").appendTo(bandChooser);

	var radioGrayscale = $("<input id='sepal-add-tiff-radio-grayscale' class='sepal-add-tiff-radio' type='radio' name='sepal-add-file-band-radio'>Gr").appendTo(bandChooser);
	$("<label class='sepal-add-tiff-radio-label'>Grayscale</label>").appendTo(bandChooser);
	$("<label class='sepal-add-tiff-band-option-label'>Grayscale: </label>").appendTo(bandChooser);
	var grayscaleBandChooser = $("<select id='sepal-add-tiff-select-band-grayscale' class='sepal-add-tiff-band-chooser'/>").appendTo(bandChooser);

	var radioRGB = $("<input id='sepal-add-tiff-radio-rgb' class='sepal-add-tiff-radio' type='radio' name='sepal-add-file-band-radio'>").appendTo(bandChooser);
	$("<label class='sepal-add-tiff-radio-label'>RGB</label>").appendTo(bandChooser);
	$("<label class='sepal-add-tiff-band-option-label'>Red: </label>").appendTo(bandChooser);
	var redBandChooser = $("<select id='sepal-add-tiff-select-band-red' class='sepal-add-tiff-band-chooser'/>").appendTo(bandChooser);
	$("<label class='sepal-add-tiff-band-option-label'>Green: </label>").appendTo(bandChooser);
	var greenBandChooser = $("<select id='sepal-add-tiff-select-band-green' class='sepal-add-tiff-band-chooser'/>").appendTo(bandChooser);
	$("<label class='sepal-add-tiff-band-option-label'>Blue: </label>").appendTo(bandChooser);
	var blueBandChooser = $("<select id='sepal-add-tiff-select-band-blue' class='sepal-add-tiff-band-chooser'/>").appendTo(bandChooser);

	// Dialog ok button
	var okButton = $("<div/>").attr("id", "sepal-add-file-okbutton");
	dialog.append(okButton);

	// Toolbar button
	var button = $("<a/>").attr("id", "sepal-add-file-button");
	button.addClass("blue_button");
	button.text("Add file");
	toolbar.append(button);

	var vectorLayers, rasterLayers, bands;

	button.click(function() {
		capabilities.getLayers(function(v, r) {
			vectorLayers = v;
			rasterLayers = r;

			layerSelector.empty();
			for (var i = 0; i < vectorLayers.length; i++) {
				var name = vectorLayers[i];
				layerSelector.append($("<option value='" + name + "'>(Vector) " + name + "</option>"));
			}
			for (var i = 0; i < rasterLayers.length; i++) {
				var name = rasterLayers[i];
				layerSelector.append($("<option value='" + name + "'>(Raster) " + name + "</option>"));
			}

			layerChooser.show();
			bandChooser.hide();
			if (vectorLayers.length > 0) {
				okButton.text("Add");
				okButton.removeClass("disabled");
			} else if (rasterLayers.length > 0) {
				okButton.text("Next");
				okButton.removeClass("disabled");
			} else {
				okButton.addClass("disabled");
			}
			bands = undefined;
			dialog.dialog("open");
		});
	});

	layerSelector.change(function() {
		var layerName = layerSelector.children("option:selected").val();
		if (vectorLayers.indexOf(layerName) > 0) {
			okButton.text("Add");
		} else {
			okButton.text("Next");
		}
	});

	function showBandChooser(b) {
		bands = b;
		layerChooser.hide();
		bandChooser.show();
		okButton.text("Add");

		radioDefaultStyle.prop("checked", true);

		grayscaleBandChooser.empty();
		redBandChooser.empty();
		greenBandChooser.empty();
		blueBandChooser.empty();
		for (var i = 0; i < bands.length; i++) {
			var band = bands[i].name;
			grayscaleBandChooser.append($("<option value='" + i + "'>" + band + "</option>"));
			redBandChooser.append($("<option value='" + i + "'>" + band + "</option>"));
			greenBandChooser.append($("<option value='" + i + "'>" + band + "</option>"));
			blueBandChooser.append($("<option value='" + i + "'>" + band + "</option>"));
		}
	}

	okButton.click(function() {
		if (okButton.hasClass("disabled")) {
			return;
		}

		var layerName = layerSelector.children("option:selected").val();

		if (vectorLayers.indexOf(layerName) >= 0) {
			dialog.dialog("close");
			gs.addSHP(layerName);
		} else if (rasterLayers.indexOf(layerName) >= 0) {
			if (!bands) {
				gs.getBands(layerName, showBandChooser);
			} else {
				dialog.dialog("close");

				if (radioDefaultStyle.is(":checked")) {
					gs.addTIFF(layerName);
				} else if (radioGrayscale.is(":checked")) {
					// Band indexes are 1-based
					var gray = 1 + parseInt(grayscaleBandChooser.children("option:selected").val());
					gs.addTIFF(layerName, [ gray ]);
				} else if (radioRGB.is(":checked")) {
					// Band indexes are 1-based
					var r = 1 + parseInt(redBandChooser.children("option:selected").val());
					var g = 1 + parseInt(greenBandChooser.children("option:selected").val());
					var b = 1 + parseInt(blueBandChooser.children("option:selected").val());
					gs.addTIFF(layerName, [ r, g, b ]);
				}

				grayscaleBandChooser.empty();
				redBandChooser.empty();
				greenBandChooser.empty();
				blueBandChooser.empty();
				bands = undefined;
				vectorLayers = [];
				rasterLayers = [];
			}
		}
	});
});