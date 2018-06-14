const saliencyModeAggregate = "show combined saliency";
const saliencyModeDetailed = "show all saliencies";

const saliencyQuestionAggregate = "(Showing areas of greatest attention)";
const saliencyQuestionDetailed  = "(Showing areas of greatest attention by feature)";

function getSaliencyDisplayManager(selectionManager) {
    var sdm = {};
    sdm.saliencyMode = saliencyModeAggregate;
	sdm.saliencyMapPercentSize = 1.0;
	sdm.activeCheckBoxes = [];
	sdm.activeCheckBoxLabels = [];
	//A list of strings such as "attack bottom left *"  (for all bars) or "attack bottom left rewardX" 
	sdm.xaiSelectionManager = selectionManager;
	sdm.rowInfosByName = {};
	
	sdm.setActiveRowInfo = function(activeRowInfos) {
		this.rowInfosByName = {};
	}
	
	sdm.setSaliencyMode = function(mode){
		this.saliencyMode = mode;
	}
	
	sdm.registerRowInfoString = function(rowInfo, rowInfoString) {
		this.rowInfosByName[rowInfoString] = rowInfo;
	}
	
	sdm.getRowInfoForRowInfoString = function(rowInfoString) {
		return this.rowInfosByName[rowInfoString];
	}
	
	sdm.adjustCheckboxes = function(selectionsByName){
		for (var i in this.activeCheckBoxes){
			var checkBox = this.activeCheckBoxes[i];
			checkBox.checked = false;
		}
		for (var i in selectionsByName) {
			var selection = selectionsByName[i];
			var checkBoxName = getRowInfoString(selection);
			var checkBox = this.getCheckBoxWithName(checkBoxName);
			checkBox.checked = true;
		}
	}
	
	sdm.getCheckBoxWithName = function(name){
		for (var i in this.activeCheckBoxes){
			var cb = this.activeCheckBoxes[i];
			var curName = cb.getAttribute("name");
			if (curName == name) {
				return cb;
			}
		}
		alert("could not find checkbox with name " + name);
	}
	
	// use checkboxes (which may have changed) to adjust the selection

	sdm.renderExplanationSaliencyMaps = function() {
        this.xaiSelectionManager.setSelections([]);
		for (var i in this.activeCheckBoxes){
			var cb = this.activeCheckBoxes[i];
			var isChecked = cb.checked;
			if (isChecked){
				var name = cb.name;
				var rowInfo = this.getRowInfoForRowInfoString(name);
				this.xaiSelectionManager.addSelection(rowInfo);
			}
        }
        
        if (isStudyQuestionMode()) {  // show all the move's saliencies if treatment 1
            if (studyTreatment.showAllSaliencyForTreatment1){
                this.xaiSelectionManager.clearSelections();
                // select all the checkboxes
                for (var i in this.activeCheckBoxes){
                    var cb = this.activeCheckBoxes[i];
                    cb.checked = true;
                    var name = cb.name;
                    var rowInfo = this.getRowInfoForRowInfoString(name);
                    this.xaiSelectionManager.addSelection(rowInfo);
                }
            }
        } 
		if (this.saliencyMode == saliencyModeAggregate){
			this.renderCombinedExplanationSaliencyMaps();
		}
		else {
			this.renderAllExplanationSaliencyMaps();
        }
        if (isStudyQuestionMode()) {
            if (studyTreatment.showAllSaliencyForTreatment1){
                // don't try to interact with the chart
                return;
            }
        }
		var currentSelections = this.xaiSelectionManager.getSelections();
		var googleChartSelections = activeBarChartManager.convertSelectionsByNameToGoogleChartSelections(currentSelections);
		googleChart.setSelection(googleChartSelections);
	}

	sdm.isSelectedRow = function(rowInfo){
		var rowInfos = this.xaiSelectionManager.getSelections();
		for (var i in rowInfos){
			var curRowInfo = rowInfos[i];
			var curActionName = curRowInfo[0];
			var curBarName = curRowInfo[1];
			if (curActionName == rowInfo[0] && curBarName == rowInfo[1]){
				return true;
			}
		}
		return false;
	}

	sdm.hideCheckboxes = function() {
		$("#saliency-checkboxes").empty();
	}
	sdm.renderCheckboxes = function() {
		if (showCheckboxes) {
			$("#saliency-checkboxes").empty();
			for (var i in this.activeCheckBoxes){
				var checkBox = this.activeCheckBoxes[i];
				var checkBoxLabel = this.activeCheckBoxLabels[i];
				$("#saliency-checkboxes").append(checkBox);
				$("#saliency-checkboxes").append(checkBoxLabel);
			}
		}
	}
	sdm.populateActionCheckBoxes = function() {	
		var barGroups = activeBarChartManager.groupsList;
		for (var i in barGroups) {
			var barGroup = barGroups[i];
			var actionName = barGroup.getName();
			var rowInfo = [ actionName, '*' ];
			var checkBoxNameString = getRowInfoString(rowInfo);
			this.registerRowInfoString(rowInfo, checkBoxNameString);
			var checkBox = createCheckBox(checkBoxNameString);
			checkBox.onclick = renderExplanationSaliencyMaps_Bridge;
			if (this.isSelectedRow(rowInfo)) {
				checkBox.checked = true;
			}
			var checkBoxLabel = document.createElement("LABEL");
			
			var t = document.createTextNode(checkBoxNameString);
			checkBoxLabel.appendChild(t);
			
			var gridPositionInfoCheck = getGridPositionStyle(0,i);
			checkBox.setAttribute("style", gridPositionInfoCheck + '; margin-left:30px; margin-top:10px;');
			
			var gridPositionInfoName = getGridPositionStyle(1,i);
			checkBoxLabel.setAttribute("style", gridPositionInfoName + '; width:200px; margin-top:10px; font-family:Arial;');
			this.activeCheckBoxes.push(checkBox);
			this.activeCheckBoxLabels.push(checkBoxLabel);
		}
	}
		
	sdm.populateActionBarCheckBoxes = function(){
		var barGroups = activeBarChartManager.groupsList;
		for (var i in barGroups) {
			var barGroup = barGroups[i];
			var actionName = barGroup.getName();
			var barsList = barGroup.getBarsList();
			var barCount = barsList.length;
			for (var j in barsList){
				var bar = barsList[j];
				var barName = bar.getName();
				var rowInfo = [ actionName, barName ];
				var checkBoxNameString = getRowInfoString(rowInfo);
				this.registerRowInfoString(rowInfo, checkBoxNameString);
				var checkBox = createCheckBox(checkBoxNameString);
				checkBox.onclick = renderExplanationSaliencyMaps_Bridge;
				if (this.isSelectedRow(rowInfo)) {
					checkBox.checked = true;
				}
				var checkBoxLabel = document.createElement("LABEL");
				
				var t = document.createTextNode(checkBoxNameString);
				checkBoxLabel.appendChild(t);
				var rowIndex = Number(i * barCount) + Number(j);
				var gridPositionInfoCheck = getGridPositionStyle(0,rowIndex);
				checkBox.setAttribute("style", gridPositionInfoCheck + '; margin-left:30px; margin-top:10px; ');
				
				var gridPositionInfoName = getGridPositionStyle(1,rowIndex);
				checkBoxLabel.setAttribute("style", gridPositionInfoName + '; width:200px; margin-top:10px; font-family:Arial;');
				this.activeCheckBoxes.push(checkBox);
				this.activeCheckBoxLabels.push(checkBoxLabel);
			}
		}
	}
	
	
	sdm.renderAllExplanationSaliencyMaps = function() {
		$("#saliency-maps").empty();
		var rowInfos = this.xaiSelectionManager.getSelections();
		for (var i in rowInfos){
			var rowInfo = rowInfos[i];
			var saliencyId = activeBarChartManager.getSaliencyIdForActionNameAndBar(rowInfo[0], rowInfo[1]);
			//console.log("NON-COMBINED MAP saliencyID " + saliencyId);
			var layerMessage = saliencyLookupMap.get(saliencyId);
			if (layerMessage == undefined){
				console.log("ERROR - no Layer message for saliencyID " + saliencyId);
			}
			else {
				var expLayers = layerMessage.getLayersList();
				var nameContainerDiv = getNameDivForRow(i, rowInfo);
				$("#saliency-maps").append(nameContainerDiv);
				var rowInfoString = getRowInfoString(rowInfo);
				var normalizationFactor = getNormalizationFactor(expLayers);
				for (var j in expLayers) {
					expLayer = expLayers[j];
					//console.log('found layer ' + expLayer.getName());
					var name = expLayer.getName();
					var cells = expLayer.getCellsList();
					var width = expLayer.getWidth();
					var height = expLayer.getHeight();
					this.renderExplLayer(j + 1, i, name, rowInfoString + name, cells, width, height, normalizationFactor);
				} 
			}
		}
	}

	
	sdm.renderCombinedExplanationSaliencyMaps = function() {
		$("#saliency-maps").empty();
		var rowInfos = this.xaiSelectionManager.getSelections();
		for (var i in rowInfos){
			var rowInfo = rowInfos[i]; 
			var saliencyId = activeBarChartManager.getSaliencyIdForActionNameAndBar(rowInfo[0], rowInfo[1]);
			//console.log("COMBINED MAP saliencyID " + saliencyId);
			var layerMessage = saliencyLookupMap.get(saliencyId);
			if (layerMessage == undefined){
				console.log("ERROR - no Layer message for saliencyID " + saliencyId);
			}
			else {
				var expLayers = layerMessage.getLayersList();
				var nameContainerDiv = getNameDivForRow(i, rowInfo);
				$("#saliency-maps").append(nameContainerDiv);
				var rowInfoString = getRowInfoString(rowInfo);
				var aggregatedCells = getAggregatedCells(expLayers);
				var normalizationFactor = getNormalizationFactorFromCells(aggregatedCells);
				var width = expLayers[0].getWidth();
				var height = expLayers[0].getHeight();
				this.renderExplLayer(1, i, "all features cumulative", rowInfoString, aggregatedCells, width, height, normalizationFactor);
			}
		}
	}
	
	sdm.overlaySaliencyMapOntoGame = function(cells, width, height, normalizationFactor) {
		for (var x= 0; x < width; x++){
			for (var y = 0; y < height; y++){
				var index = height * x + y;
				var cellValue = cells[index];
				gameboard_ctx.fillStyle = getOverlayOpacityBySaliencyRGBAString(cellValue * normalizationFactor);
				gameboard_ctx.fillRect(x*gameScaleFactor, y*gameScaleFactor, gameScaleFactor, gameScaleFactor);
				gameboard_ctx.fill();
			}
		}
	}
	
	
	sdm.overlaySaliencyMapOntoGameReplica = function(ctx, cells, width, height, normalizationFactor) {
		for (var x= 0; x < width; x++){
			for (var y = 0; y < height; y++){
				var index = height * x + y;
				var cellValue = cells[index];
				ctx.fillStyle = getOverlayOpacityBySaliencyRGBAString(cellValue * normalizationFactor);
				ctx.fillRect(x*gameScaleFactor, y*gameScaleFactor, gameScaleFactor, gameScaleFactor);
				ctx.fill();
			}
		}
	}

	sdm.renderExplLayer = function(gridX, gridY, saliencyUIName, saliencyNameForId, cells, width, height, normalizationFactor) {
		var nameNoSpaces = saliencyNameForId.replace(/ /g,"");
		var nameForId = nameNoSpaces.replace(/,/g,"");
		var explCanvas = document.createElement("canvas");
        explCanvas.setAttribute("class", "explanation-canvas");
        explCanvas.setAttribute("id", "saliencyMap_" + nameForId);
        explCanvas.onclick = function(e) {
            var x = e.offsetX;
            var y = e.offsetY;
            var shapeId = getClosestInRangeShapeId(gameboard_ctx, x, y, shapePositionMapForContext['game']);
            if (shapeId != undefined){
                //targetClickHandler(e, "clickEntity:" + shapeLogStrings[shapeId] + "_" + getQuadrantName(x,y));
                targetClickHandler(e, "clickSaliencyMap:" + saliencyUIName + "_(" + shapeLogStrings[shapeId] + "_" + getQuadrantName(x,y)+ ")");
            }
            //targetClickHandler(e, "clickGameQuadrant:" + getQuadrantName(x,y));
            targetClickHandler(e, "clickSaliencyMap:" + saliencyUIName + "_(" + getQuadrantName(x,y) + ")");
        }
        
            
       
		// explCanvas.addEventListener("mouseenter", function() {
		// 	console.log("entered! " + saliencyUIName);
		// 	//clear and redraw gameboard
		// 	handleEntities(entitiesList);
		// 	saliencyDisplayManager.overlaySaliencyMapOntoGame(cells, width, height, normalizationFactor);
		// }
		// );
		// explCanvas.addEventListener("mouseleave", function() {
		// 	// clear and redraw gameboard
		// 	handleEntities(entitiesList);
		// 	console.log("left! " + saliencyUIName);
		// }
		// );
		var explCtx = explCanvas.getContext("2d");
		// canvas size should be same a gameboardHeight
		explCanvas.width  = gameboard_canvas.width * this.saliencyMapPercentSize;
		explCanvas.height = gameboard_canvas.height * this.saliencyMapPercentSize;
		this.renderSaliencyMap(explCanvas, explCtx, cells, width, height, normalizationFactor);
		// the div that will contain it should be a bit wider
		// and tall enough to contain title text
		var mapContainerDivHeight = explCanvas.height + 30;
		
		var mapContainerDiv = document.createElement("div");
		var gridPositionInfo = getGridPositionStyle(gridX, gridY);
		mapContainerDiv.setAttribute("style", gridPositionInfo);
		$("#saliency-maps").append(mapContainerDiv);
		var mapId = 'mapContainer_' + nameForId;
		mapContainerDiv.setAttribute("id", mapId);
		var mapContainerDivSelector = "#" + mapId;
		$(mapContainerDivSelector).css("display", "flex");
		$(mapContainerDivSelector).css("flex-direction", "column");
		$(mapContainerDivSelector).css("width", explCanvas.width+'px');
		$(mapContainerDivSelector).css("height", mapContainerDivHeight+'px');
		//$(mapContainerDivSelector).css("margin-right", '4px');
		$(mapContainerDivSelector).css("border", '1px solid #0063a6');
		
		var mapTitleId = 'title_' + nameForId;
		var mapTitleDiv   = document.createElement("div");
		$(mapContainerDivSelector).append(mapTitleDiv);
		mapTitleDiv.setAttribute("id", mapTitleId);
		var mapTitleDivSelector = "#" + mapTitleId;
		$(mapTitleDivSelector).html(saliencyUIName);
		configureMapTitle(mapTitleDivSelector);
		
		var mapId = 'map_' + nameForId;
		var mapDiv = document.createElement("div");
		$(mapContainerDivSelector).append(mapDiv);
		mapDiv.setAttribute("id", mapId);
		var mapDivSelector = "#" + mapId;
		$(mapDivSelector).css("width",explCanvas.width + 'px');
		$(mapDivSelector).css("height",explCanvas.height + 'px');
		$(mapDivSelector).css("background-color", "#123456");
		$(mapDivSelector).append(explCanvas);

		
		var valueSpan = document.createElement("span");
		valueSpan.setAttribute("class","value-div");
		valueSpan.setAttribute("style", 'visibility:hidden;font-family:Arial;');
		$(mapDivSelector).append(valueSpan);
		
		explCanvas.addEventListener('mouseenter', function(evt) {
            valueSpan.setAttribute("style", 'visibility:hidden;');
            targetHoverHandler(evt, "startMouseOverSaliencyMap:" + saliencyUIName);
		});
		explCanvas.addEventListener('mouseleave', function(evt) {
            valueSpan.setAttribute("style", 'visibility:hidden;');
            targetHoverHandler(evt, "endMouseOverSaliencyMap:" + saliencyUIName);
		});
		explCanvas.addEventListener('mousemove', function(evt) {
			var mousePos = getMousePos(explCanvas, evt);
			var xForValueLookup = Math.floor(mousePos.x / gameScaleFactor);
			var yForValueLookup = Math.floor(mousePos.y/gameScaleFactor);
			var index = height * xForValueLookup + yForValueLookup;
			var cellValue = cells[index];
			var normValue = cellValue*normalizationFactor;
			var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y + ' val: ' + normValue.toFixed(2);
			var top = (mousePos.y + 10 - (40 * gameScaleFactor)) + 'px'; // shift it to canvas above
			var left = (mousePos.x + 10) + 'px';
			valueSpan.setAttribute("style", 'z-index:' + zIndexMap["saliencyHoverValue"] + '; position:relative; left:' + left + '; top: ' + top + '; color:#D73F09;font-family:Arial;'); // OSU orange
			valueSpan.innerHTML = normValue.toFixed(2);
			//console.log(message);
		  }, false);
	}

		
	sdm.renderSaliencyMap = function(canvas, ctx, cells, width, height, normalizationFactor){
		renderState(ctx, canvas, masterEntities, gameScaleFactor, 0, 0, shapePositionMapForContext["game"],false);
		this.overlaySaliencyMapOntoGameReplica(ctx, cells, width, height, normalizationFactor);
	}	
	sdm.renderSaliencyMapOrig = function(canvas, ctx, cells, width, height, normalizationFactor){
		var scaleFactor = gameScaleFactor * this.saliencyMapPercentSize;
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
		//console.log('MAX cell value : ' + maxCellValue);
	}
	return sdm;
}

function getRowInfoString(rowInfo) {
	var result = undefined;
	if ('*' == rowInfo[1]) {
		var result = rowInfo[0];// action name only
	}
	else {
		var result = rowInfo[0] + ', ' + rowInfo[1];
	}
	return result;
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
	  x: evt.clientX - rect.left,
	  y: evt.clientY - rect.top
	};
  }
	
function getNameDivForRow(rowIndex, rowInfo, layerCount){
	var nameContainerDiv = document.createElement("div");
	nameContainerDiv.setAttribute("style", getGridPositionStyle(0,rowIndex) + '; width:200px;padding-top:125px; text-align:center; border-style: solid; border-width:1px;font-family:Arial;');
	nameContainerDiv.innerHTML = getRowInfoString(rowInfo);                              // had height:100%
//	var nameContainerContentDiv = document.createElement("div");
//	nameContainerContentDiv.innerHTML = getRowInfoString(rowInfo);
//	nameContainerContentDiv.setAttribute("style", 'margin:auto;font-family:Arial;');
	//nameContainerContentDiv.setAttribute("style", 'text-align:center; padding-top:80px;font-family:Arial;');
//	nameContainerDiv.append(nameContainerContentDiv);
	return nameContainerDiv;
}

function renderExplanationSaliencyMaps_Bridge(evt) {
	activeSaliencyDisplayManager.renderExplanationSaliencyMaps();
}

function createCheckBox(name) {
	var x = document.createElement("INPUT");
	x.setAttribute("type", "checkbox");
	x.setAttribute("name", name);
	return x;
}


function getAggregatedCells(expLayers){
	var result = [];
	var cellsCount = expLayers[0].getCellsList().length;
	for (i = 0; i < cellsCount; i++) {
		var totalForCell = 0;
		for (var j in expLayers){
			var expLayer = expLayers[j];
			totalForCell = totalForCell + expLayer.getCellsList()[i];
		}
		result[i] = totalForCell;
	}
	return result;
}

function getNormalizationFactorFromCells(cells) {
	var max = getMaxValueForLayer(cells);
	var factor = undefined;
	if (max == 0) {
		factor = 1;
	}
	else{
		factor = 1/ max;
	}
	 
	return factor;
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
    var factor = undefined;
	if (max == 0) {
		factor = 1;
	}
	else{
		factor = 1/ max;
	}
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
function getGridPositionStyle(gridX, gridY) {
	var columnStart = Number(gridX) + 1;
	var columnEnd = Number(gridX) + 2;
	var rowStart = Number(gridY) + 1;
	var rowEnd = Number(gridY) + 2;
	var columnInfo = 'grid-column-start: ' + columnStart + '; grid-column-end: ' + columnEnd;
	var rowInfo = '; grid-row-start: ' + rowStart + '; grid-row-end: ' + rowEnd + ';';
	var result =  columnInfo + rowInfo;
	return result;
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

// function showSaliencyAnswer() {
// 	saliencyDisplayManager.displayAnswerToSaliencyQuestion();
// }

function getOverlayOpacityBySaliencyRGBAString(saliencyValue) {
  var reverseSaliency = 1.0 - saliencyValue;
  var color = {};
  color['R'] = 0;
  color['G'] = 0;
  color['B'] = 0;
  color['A'] = reverseSaliency;
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
}

function getWhiteRGBAString(saliencyValue) {
  var color = {};
  color['R'] = 255;
  color['G'] = 255;
  color['B'] = 255;
  color['A'] = saliencyValue;
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
}