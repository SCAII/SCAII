
var renderExplanationSaliencyMaps = function(saliencyId) {
	$("#saliency-maps").empty();
	var layerMessage = saliencyLookupMap.get(saliencyId);
	if (layerMessage == undefined){
		console.log("ERROR - no Layer message for saliencyID " + saliencyId);
	}
	else {
		var expLayers = layerMessage.getLayersList();
		var normalizationFactor = getNormalizationFactor(expLayers);
		for (var i in expLayers) {
			expLayer = expLayers[i];
			console.log('found layer ' + expLayer.getName());
			var name = expLayer.getName();
			var cells = expLayer.getCellsList();
			var width = expLayer.getWidth();
			var height = expLayer.getHeight();
			renderExplLayer(name, cells, width, height, normalizationFactor);
		} 
	}
}

var getNormalizationFactor = function(expLayers){
	var max = 0.0
	for (var i in expLayers) {
		expLayer = expLayers[i];
		var value = getMaxValueForLayer(expLayer.getCellsList());
		if (value > max) {
			max = value;
		}
	} 
    var factor = 1 / max;
	return factor;
}

var getMaxValueForLayer = function(vals){
	var max = 0.0;
	for (var i in vals) {
		var value = vals[i];
		if (value > max) {
			max = value;
		}
	}
	return max;
}

var renderExplLayer = function(name, cells, width, height, normalizationFactor) {
	var uiName = name;
	name = name.replace(" ","");
	console.log('render layer ' + name);
	var explCanvas = document.createElement("canvas");
	var explCtx = explCanvas.getContext("2d");
	// canvas size should be same a gameboardHeight
	explCanvas.width  = gameboard_canvas.width * saliencyMapPercentSize;
	explCanvas.height = gameboard_canvas.height * saliencyMapPercentSize;
	renderSaliencyMap(explCanvas, explCtx, cells, width, height, normalizationFactor);
	// the div that will contain it should be a bit wider
	// and tall enough to contain title text
	var mapContainerDivHeight = explCanvas.height + 30;
	
	var mapContainerDiv = document.createElement("div");
	$("#saliency-maps").append(mapContainerDiv);
	var mapId = 'mapContainer_' + name;
	mapContainerDiv.setAttribute("id", mapId);
	var mapContainerDivSelector = "#" + mapId;
	$(mapContainerDivSelector).css("display", "flex");
	$(mapContainerDivSelector).css("flex-direction", "column");
	$(mapContainerDivSelector).css("width", explCanvas.width+'px');
	$(mapContainerDivSelector).css("height", mapContainerDivHeight+'px');
	$(mapContainerDivSelector).css("margin-right", '4px');
	$(mapContainerDivSelector).css("border", '1px solid #0063a6');
	
	var mapTitleId = 'title_' + name;
	var mapTitleDiv   = document.createElement("div");
	$(mapContainerDivSelector).append(mapTitleDiv);
	mapTitleDiv.setAttribute("id", mapTitleId);
	var mapTitleDivSelector = "#" + mapTitleId;
	$(mapTitleDivSelector).html(uiName);
	configureMapTitle(mapTitleDivSelector);
	
	var mapId = 'map_' + name;
	var mapDiv = document.createElement("div");
	$(mapContainerDivSelector).append(mapDiv);
	mapDiv.setAttribute("id", mapId);
	var mapDivSelector = "#" + mapId;
	$(mapDivSelector).css("width",explCanvas.width + 'px');
	$(mapDivSelector).css("height",explCanvas.height + 'px');
	$(mapDivSelector).css("background-color", "#123456");
	$(mapDivSelector).append(explCanvas);
}

var configureMapTitle = function(mapTitleDivSelector){
	$(mapTitleDivSelector).css("font-family", "Fira Sans");
	$(mapTitleDivSelector).css("font-size", "16px");
	$(mapTitleDivSelector).css("padding-left", "6px");
	$(mapTitleDivSelector).css("padding-right", "6px");
	$(mapTitleDivSelector).css("padding-top", "6px");
	$(mapTitleDivSelector).css("padding-bottom", "2px");
	$(mapTitleDivSelector).css("text-align", "center");
	$(mapTitleDivSelector).css("height", "30px");

}

var renderSaliencyMap = function(canvas, ctx, cells, width, height, normalizationFactor){
	var scaleFactor = gameScaleFactor*saliencyMapPercentSize;
	var maxCellValue = 0.0;
	for (var x= 0; x < width; x++){
		for (var y = 0; y < height; y++){
			//var index = width * y + x; // assumes 
			var index = height * x + y;
			var cellValue = cells[index];
			if (cellValue != 0.0) {
				if (cellValue > maxCellValue) {
					maxCellValue = cellValue;
				}
				ctx.fillStyle = getWhiteRGBAString(cellValue * normalizationFactor);
				ctx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
				ctx.fill();
			}
		}
	}
	console.log('MAX cell value : ' + maxCellValue);
}


function getWhiteRGBAString(saliencyValue) {
  color = {};
  color['R'] = 255;
  color['G'] = 255;
  color['B'] = 255;
  color['A'] = saliencyValue;
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
}