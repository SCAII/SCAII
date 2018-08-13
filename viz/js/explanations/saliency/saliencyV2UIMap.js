function getSaliencyV2UIMap() {
    var uimap = {};


    uimap.saliencyMapPercentSize = 1.0;
    uimap.outlinesForSaliencyMap = {};
    uimap.currentlyHighlightedSaliencyMapKey = undefined;
	uimap.renderSaliencyMap = function(canvas, ctx, cells, width, height, normalizationFactor){
		renderState(canvas, masterEntities, gameScaleFactor, 0, 0,false);
		this.overlaySaliencyMapOntoGameReplica(ctx, cells, width, height, normalizationFactor);
	}	
    
    /*
    Must take into account current filename, current decision point, and saliencyMapId
    */
    uimap.getDPSpecificSaliencyMapKey = function(saliencyMapId) {
        var result = 'DP-' + showingDecisionNumber + "-" + saliencyMapId;
        return result;
    }
	uimap.overlaySaliencyMapOntoGameReplica = function(ctx, cells, width, height, normalizationFactor) {
        if (userStudyMode){
            if (isTutorial()){
                //tutorial saliencies are randomized
                cells = getRandomCells(width * height);
                var max = getMaxValueForLayer(cells);
                if (max == 0) {
                    normalizationFactor = 1;
                }
                else{
                    normalizationFactor = 1/ max;
                }
            }
        }
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

	uimap.renderExplLayer = function(gridX, gridY, saliencyUIName, saliencyNameForId, cells, width, height, normalizationFactor, scaleFactor) {
		var nameNoSpaces = saliencyNameForId.replace(/ /g,"");
		var nameForId = nameNoSpaces.replace(/,/g,"");
		var explCanvas = document.createElement("canvas");
        explCanvas.setAttribute("class", "explanation-canvas");
        var saliencyMapId = "saliencyMap_" + nameForId;
        explCanvas.setAttribute("id", saliencyMapId);
        explCanvas.onclick = function(e) {
            var x = e.offsetX;
            var y = e.offsetY;
            var shapeId = getClosestInRangeShapeId(gameboard_ctx, x, y);
			var logLine = templateMap["clickSaliencyMap"];
            if (shapeId != undefined){
				//targetClickHandler(e, "clickEntity:" + shapeLogStrings[shapeId] + "_" + getQuadrantName(x,y));
				logLine = logLine.replace("<REGION>", "saliencyMap");
				logLine = logLine.replace("<CLCK_SALNCY_MAP>", saliencyUIName);
				logLine = logLine.replace("<SHAPE_LOG>", shapeLogStrings[shapeId]);
				logLine = logLine.replace("<QUADRANT_NAME>", getQuadrantName(x,y));
				targetClickHandler(e, logLine);
                //targetClickHandler(e, "clickSaliencyMap:" + saliencyUIName + "_(" + shapeLogStrings[shapeId] + "_" + getQuadrantName(x,y)+ ")");
            }
           else {
				//targetClickHandler(e, "clickGameQuadrant:" + getQuadrantName(x,y));
				logLine = logLine.replace("<REGION>", "saliencyMap");
				logLine = logLine.replace("<CLCK_SALNCY_MAP>", saliencyUIName);
				logLine = logLine.replace("<SHAPE_LOG>", "NA");
				logLine = logLine.replace("<QUADRANT_NAME>", getQuadrantName(x,y));
				targetClickHandler(e, logLine);
                //targetClickHandler(e, "clickSaliencyMap:" + saliencyUIName + "_(" + getQuadrantName(x,y) + ")");
            }
            if (userStudyMode){
                var legalClickTargetRegions = activeStudyQuestionManager.getLegalInstrumentationTargetsForCurrentQuestion();
                if (activeStudyQuestionManager.renderer.isLegalRegionToClickOn("target:saliencyMap", legalClickTargetRegions)){
                    if (activeStudyQuestionManager.renderer.controlsWaitingForClick.length == 0) {
                        return;
                    }
                    if (tm.showAllSaliencyForTreatment1 || tm.showSaliencyAll){
                        var uimap = currentExplManager.saliencyUI.uimap;
                        uimap.hideAllSaliencyMapOutlines();
                        var key = uimap.getDPSpecificSaliencyMapKey(saliencyMapId);
                        uimap.showSaliencyMapOutline(key);
                    }
                    clearHighlightedShapesOnGameboard();
                }
            }
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
		explCanvas.width  = gameboard_canvas.width * scaleFactor;
		explCanvas.height = gameboard_canvas.height * scaleFactor;
        this.renderSaliencyMap(explCanvas, explCtx, cells, width, height, normalizationFactor);
        
        var w = explCanvas.width;
        var h = explCanvas.height;
       
        var outlineWidth = 6;
        var divW = w - 2 * outlineWidth;
        var divH = h - 2 * outlineWidth;
        var outlineDiv = document.createElement("div");
        var outlineDivId =  "outline-div-DP" + showingDecisionNumber + "-" + nameForId;
        outlineDiv.setAttribute("id", outlineDivId);
        outlineDiv.setAttribute("style","visibility:hidden;border-color:white;border-style:solid;border-width:6px;z-index:" + zIndexMap["saliencyHoverValue"] + "; position:relative; left:0px; top:-" + h + "px;background-color:transparent;width:"+ divW + "px;height:"+ divH + "px;");
        this.outlinesForSaliencyMap[this.getDPSpecificSaliencyMapKey(saliencyMapId)] = outlineDivId;
        
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
        $(mapDivSelector).append(outlineDiv);

		
		var valueSpan = document.createElement("span");
		valueSpan.setAttribute("class","value-div");
		valueSpan.setAttribute("style", 'visibility:hidden;font-family:Arial;');
		$(mapDivSelector).append(valueSpan);
		
		explCanvas.addEventListener('mouseenter', function(evt) {
			valueSpan.setAttribute("style", 'visibility:hidden;');
			var logLine = templateMap["startMouseOverSaliencyMap"];
			logLine = logLine.replace("<REGION>", "saliencyMap");
			logLine = logLine.replace("<SLNCY_NAME>", saliencyUIName);
			targetHoverHandler(evt, logLine);
            //targetHoverHandler(evt, "startMouseOverSaliencyMap:" + saliencyUIName);
		});
		explCanvas.addEventListener('mouseleave', function(evt) {
            valueSpan.setAttribute("style", 'visibility:hidden;');
			var logLine = templateMap["endMouseOverSaliencyMap"];
			logLine = logLine.replace("<REGION>", "saliencyMap");
			logLine = logLine.replace("<SLNCY_NAME>", saliencyUIName);
			targetHoverHandler(evt, logLine);
            //targetHoverHandler(evt, "endMouseOverSaliencyMap:" + saliencyUIName);
        });
        if (!userStudyMode){
            //NEW_SAL regular mode mouse hover shows score on map
            explCanvas.addEventListener('mousemove', function(evt) {
                displayCellValue(evt, height);
              }, false);
        }
	}

    uimap.hideAllSaliencyMapOutlines = function() {
        //NEW_SAL user may highlight saliency map for a question
        var keys = Object.keys(this.outlinesForSaliencyMap);
        for (var i in keys){
            var key = keys[i];
            var outlineId = this.outlinesForSaliencyMap[key];
            $("#" + outlineId).css("visibility", "hidden");
        }
        this.currentlyHighlightedSaliencyMapKey = undefined;
    }

    uimap.showSaliencyMapOutline = function(saliencyMapKey) {
        this.currentlyHighlightedSaliencyMapKey = saliencyMapKey;
        var outlineId = this.outlinesForSaliencyMap[saliencyMapKey];
        $("#" + outlineId).css("visibility", "visible");
    }

    return uimap;
}

function displayCellValue(evt, height){
    var mousePos = getMousePos(explCanvas, evt);
    var xForValueLookup = Math.floor(mousePos.x / gameScaleFactor);
    var yForValueLookup = Math.floor(mousePos.y/gameScaleFactor);
    var index = height * xForValueLookup + yForValueLookup;
    var cellValue = cells[index];
    var normValue = cellValue*normalizationFactor;
    //var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y + ' val: ' + normValue.toFixed(2);
    var top = (mousePos.y + 10 - (40 * gameScaleFactor)) + 'px'; // shift it to canvas above
    var left = (mousePos.x + 10) + 'px';
    valueSpan.setAttribute("style", 'z-index:' + zIndexMap["saliencyHoverValue"] + '; position:relative; left:' + left + '; top: ' + top + '; color:#D73F09;font-family:Arial;'); // OSU orange
    valueSpan.innerHTML = normValue.toFixed(2);
    //console.log(message);
}
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

var getMaxValueForLayer = function(vals){
	var max = 0.0;
	for (var i in vals) {
		var value = vals[i];
		if (value > max) {
			max = value;
		}
    }
    console.log("max for layer = " + max);
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


function getRandomCells(count) {
    var result = [];
    for (var i = 0; i < count; i++){
        result.push(Math.random());
    }
    return result;
}

var getMaxValueForLayers = function(layers) {
    var max = 0.0;
    for (var i in layers) {
        var layer = layers[i];
        var value = getMaxValueForLayer(layer.getCellsList());
		if (value > max) {
			max = value;
		}
    }
	return max;
}