define([ "jquery", "message-bus", "toolbar", "./utils", "./gs-api", "jquery-ui" ], function($, bus, toolbar, utils, gs) {
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
	var fileChooser = $("<div/>").attr("id", "sepal-add-file-dialog-fileChooser").appendTo(dialog);
	var fileInput = $("<input/>").attr("id", "sepal-add-file-input");
	var label = $("<div/>").attr("id", "sepal-add-file-label").text("Path: ");
	fileChooser.append(label);
	fileChooser.append(fileInput);

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
	var okButton = $("<div/>").attr("id", "sepal-add-file-okbutton").addClass("disabled");
	dialog.append(okButton);

	// Toolbar button
	var button = $("<a/>").attr("id", "sepal-add-file-button");
	button.addClass("blue_button");
	button.text("Add file");
	toolbar.append(button);

	button.click(function() {
		fileChooser.show();
		bandChooser.hide();
		okButton.text("Add");
		bands = undefined;
		okButton.addClass("disabled");
		fileInput.val("");
		dialog.dialog("open");
	});

	fileInput.on("change paste keyup", function() {
		try {
			var type = utils.getFileType(fileInput.val());
			if (type == utils.SHP) {
				okButton.text("Add");
			} else if (type == utils.TIFF) {
				okButton.text("Next");
			}
			okButton.removeClass("disabled");
		} catch (e) {
			okButton.addClass("disabled");
		}
	});

	var bands;

	function showBandChooser(b) {
		bands = b;
		fileChooser.hide();
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

		var filename = fileInput.val();

		if (filename.charAt(0) != "/") {
			window.alert("Only absolute paths allowed");
			return;
		}

		var fileType = utils.getFileType(filename);
		if (fileType == utils.SHP) {
			dialog.dialog("close");
			gs.addSHP(filename);
		} else if (fileType == utils.TIFF) {
			if (!bands) {
				gs.getBands(filename, showBandChooser);
			} else {
				dialog.dialog("close");

				if (radioDefaultStyle.is(":checked")) {
					gs.addTIFF(filename);
				} else if (radioGrayscale.is(":checked")) {
					// Band indexes are 1-based
					var gray = 1 + parseInt(grayscaleBandChooser.children("option:selected").val());
					gs.addTIFF(filename, [ gray ]);
				} else if (radioRGB.is(":checked")) {
					// Band indexes are 1-based
					var r = 1 + parseInt(redBandChooser.children("option:selected").val());
					var g = 1 + parseInt(greenBandChooser.children("option:selected").val());
					var b = 1 + parseInt(blueBandChooser.children("option:selected").val());
					gs.addTIFF(filename, [ r, g, b ]);
				}

				grayscaleBandChooser.empty();
				redBandChooser.empty();
				greenBandChooser.empty();
				blueBandChooser.empty();
				bands = undefined;
			}
		}
	});
});