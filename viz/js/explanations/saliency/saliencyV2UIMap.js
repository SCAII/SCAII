function getSaliencyV2UIMap() {
    var uimap = {};

    uimap.normalizationFactor = undefined;


    uimap.saliencyMapPercentSize = 1.0;
    uimap.outlinesForSaliencyMap = {};
    uimap.currentlyHighlightedSaliencyMapKey = undefined;
	uimap.renderSaliencyMap = function(canvas, ctx, cells, width, height, normalizationFactor){
		renderState(canvas, masterEntities, gameScaleFactor, 0, 0,false);
		this.overlaySaliencyMapOntoGameReplica(ctx, cells, width, height, normalizationFactor, 0);
	}	
    
    /*
    Must take into account current filename, current decision point, and saliencyMapId
    */
    uimap.getDPSpecificSaliencyMapKey = function(saliencyMapId) {
        var result = 'DP-' + showingDecisionNumber + "-" + saliencyMapId;
        return result;
    }
 

	uimap.overlaySaliencyMapOntoGameReplica = function(ctx, cells, width, height, normalizationFactor, gameboardFlag ) {
        for (var x= 0; x < width; x++){
            for (var y = 0; y < height; y++){
                var index = height * x + y;
                var cellValue = cells[index];
                //console.log( "normalization Factor: " + normalizationFactor );
                ctx.fillStyle = getOverlayOpacityBySaliencyRGBAString(cellValue * normalizationFactor, gameboardFlag);
                //console.log( "ctx.fillStyle: " + ctx.fillStyle );
                ctx.fillRect(x*gameScaleFactor, y*gameScaleFactor, gameScaleFactor, gameScaleFactor);
                ctx.fill();
            }
        }   
    }
    

    /**************************************************************************************
     * Author:      Andrew Anderson
     * Purpose:     Creating an object for a quick lookup of the cells for each saliency
     *              map.
     * Date Made:   8/17/2018
     * Date Mod:    8/17/2018
     **************************************************************************************/
    uimap.cellsForSaliencyMapId = {};
    uimap.gameboardOverlayLookupMap = {};

	uimap.renderExplLayer = function(saliencyId, gridX, gridY, saliencyUIName, saliencyNameForId, cells, width, height, normalizationFactor, scaleFactor) {
		var nameForId = convertNameToLegalId(saliencyNameForId);
		var explCanvas = document.createElement("canvas");
        explCanvas.setAttribute("class", "explanation-canvas");
        var saliencyMapId = "saliencyMap_" + nameForId;
        //the line below is how we're storing the cells. For naming, we wrap the saliencyMapId into the current DP
        this.cellsForSaliencyMapId[ this.getDPSpecificSaliencyMapKey(saliencyMapId) ] = cells;
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
                        //uimap.hideAllSaliencyMapOutlines();
                        var key = uimap.getDPSpecificSaliencyMapKey(saliencyMapId);
                        //uimap.showSaliencyMapOutline(key);
                        uimap.showOrHideSaliencyMapOutline( saliencyId, saliencyUIName, key );
                    }
                    //clearHighlightedShapesOnGameboard();
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



        var gameboardOverlayCanvas = document.createElement("canvas");
        gameboardOverlayCanvas.width  = gameboard_canvas.width * scaleFactor;
		gameboardOverlayCanvas.height = gameboard_canvas.height * scaleFactor;
        var zIndex = Number(zIndexMap["saliencyHoverValue"]) + Number(gridX);
        gameboardOverlayCanvas.setAttribute("id", "gameboardOverlay" + saliencyId + convertNameToLegalId( saliencyUIName ) );
        var gameboardOffset = $("#scaii-gameboard").offset( );
        var gameboardTop = gameboardOffset.top;
        var gameboardLeft = gameboardOffset.left;
        gameboardOverlayCanvas.setAttribute("style","z-index:" + zIndex + "; position:absolute; left:" + gameboardLeft + "px; top:" + gameboardTop + "px;background-color:transparent;width:"+ gameboardOverlayCanvas.width + "px;height:"+ gameboardOverlayCanvas.height + "px; border-style:solid");
        var gameboardOverlayContext = gameboardOverlayCanvas.getContext("2d");
		// canvas size should be same a gameboardHeight
        this.renderSaliencyMap(gameboardOverlayCanvas, gameboardOverlayContext, cells, width, height, normalizationFactor);
        this.gameboardOverlayLookupMap[ saliencyId + saliencyUIName ] = gameboardOverlayCanvas;
        
        var w = explCanvas.width;
        var h = explCanvas.height;
       
        var outlineWidth = 6;
        var divW = w - 2 * outlineWidth;
        var divH = h - 2 * outlineWidth;
        var outlineDiv = document.createElement("div");
        var outlineDivId =  "outline-div-DP" + showingDecisionNumber + "-" + nameForId;
        outlineDiv.setAttribute("id", outlineDivId);
        // take the outline into account for positioning
        var relativeTopValue = - Number(h) - Number(outlineWidth);
        outlineDiv.setAttribute("style","border-color:white;border-style:solid;border-width:6px;z-index:" + zIndexMap["saliencyHoverValue"] + "; position:relative; left:0px; top:" + relativeTopValue + "px;background-color:transparent;width:"+ divW + "px;height:"+ divH + "px;");
        this.outlinesForSaliencyMap[this.getDPSpecificSaliencyMapKey(saliencyMapId)] = outlineDiv;
        
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
        //$(mapDivSelector).append(outlineDiv);
        //mapDiv.append( outlineDiv );
        this.saliencyMapDivId[this.getDPSpecificSaliencyMapKey(saliencyMapId)] = mapId;
		
   
		outlineDiv.onclick = function( ) {
            mapDiv.removeChild( outlineDiv );
            // var canvas = gameboardOverlayLookupMap[ saliencyId ];
            $("#gameboardOverlay" + saliencyId + convertNameToLegalId( saliencyUIName ) ).detach(  );
            //this.subtractSaliencyMapFromGameReplica( gameboard_ctx, cells, gamePixelDimension, gamePixelDimension, this.normalizationFactor, 1  )
            //clearHighlightedShapesOnGameboard();
		}

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

    // uimap.hideAllSaliencyMapOutlines = function() {
    //     //NEW_SAL user may highlight saliency map for a question
    //     var keys = Object.keys(this.outlinesForSaliencyMap);
    //     for (var i in keys){
    //         var key = keys[i];
    //         var outlineId = this.outlinesForSaliencyMap[key];
    //         $("#" + outlineId).css("visibility", "hidden");
    //     }
    //     this.currentlyHighlightedSaliencyMapKey = undefined;
    // }

    // uimap.showSaliencyMapOutline = function(saliencyMapKey) {
    //     this.currentlyHighlightedSaliencyMapKey = saliencyMapKey;
    //     var outlineId = this.outlinesForSaliencyMap[saliencyMapKey];
    //     $("#" + outlineId).css("visibility", "visible");
    // }


    uimap.saliencyMapDivId = {};

    uimap.showOrHideSaliencyMapOutline = function(saliencyId, saliencyUIName, saliencyMapId) {
		//First 4 is finding the map that we want to put into and the div that we want to put it in
		console.log( "saliencyMapId: " + saliencyMapId );
		var saliencyMapDivId = this.saliencyMapDivId[ saliencyMapId ];
		console.log( "SaliencyMapDivId: " + saliencyMapDivId );	
		var outlineDiv = this.outlinesForSaliencyMap[ saliencyMapId ];
		console.log( "outlineId: " + outlineDiv );
        $("#" + saliencyMapDivId ).append( outlineDiv );
        var cells = getCellsForSingleLayerForSaliencyId(saliencyId, saliencyUIName);
        //play around with the 0.5 to find a value that will help.
        //this.overlaySaliencyMapOntoGameReplica( gameboard_ctx, cells, gamePixelDimension, gamePixelDimension, this.normalizationFactor, 1 );


        var canvas = this.gameboardOverlayLookupMap[ saliencyId + saliencyUIName ];
        $("#scaii-gameboard").append( canvas );


		//Append one, reevaluate which ones selected, and then you'll be able to get the cell values from the saliency maps
		//Just need to find the saliencyId 
 
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

function getOverlayOpacityBySaliencyRGBAStringOld(saliencyValue) {
    var reverseSaliency = 1.0 - saliencyValue;
    var color = {};
    color['R'] = 0;
    color['G'] = 0;
    color['B'] = 0;
    color['A'] = reverseSaliency;
    var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
    return result;
  }


var countsPerBin = {};
function getOverlayOpacityBySaliencyRGBAString(saliencyValue, gameboardFlag) {
    var reverseSaliency = 1.0 - saliencyValue;
    var color = {};
    //color['R'] = 0;
    //color['G'] = 0;
    //color['B'] = 0;
    /*******************************************************************
     * Author - Andrew Anderson
     * Purpose - Assigning different 'heat' values based on RGBA string
     * Blue - [0, 0.05]
     * Yellow - (0.05, 0.24]
     * Yellow/Orange - (0.24, 0.43]
     * Orange - (0.43, 0.62]
     * Orange/Red - (0.62, 0.81]
     * Red - (0.81, 1.00]
     ******************************************************************/
    if( saliencyValue <= 0.05 ){
      color['R'] = 59;
      color['G'] = 72;
      color['B'] = 241;
      if (countsPerBin["A"] == undefined){
          countsPerBin["A"] =1;
      }
      else {
          countsPerBin["A"] = Number(countsPerBin["A"]) + Number( 1 ); 
      }
  }
  //Yellow
  else if( saliencyValue > 0.05 && saliencyValue <= 0.24 ) {
      color['R'] = 250;
      color['G'] = 218;
      color['B'] = 94;
      if (countsPerBin["B"] == undefined){
        countsPerBin["B"] =1;
    }
    else {
        countsPerBin["B"] = Number(countsPerBin["B"]) + Number( 1 ); 
    }
  }
  
  //Yellow/Orange
  else if( saliencyValue > 0.24 && saliencyValue <= 0.43 ) {
      color['R'] = 255;
      color['G'] = 174;
      color['B'] = 66;
      if (countsPerBin["C"] == undefined){
        countsPerBin["C"] =1;
    }
    else {
        countsPerBin["C"] = Number(countsPerBin["C"]) + Number( 1 ); 
    }
  }
  
  //Orange
  else if( saliencyValue > 0.43 && saliencyValue <= 0.62 ) {
      color['R'] = 255;
      color['G'] = 102;
      color['B'] = 0;
      if (countsPerBin["D"] == undefined){
        countsPerBin["D"] =1;
    }
    else {
        countsPerBin["D"] = Number(countsPerBin["D"]) + Number( 1 ); 
    }
  }
  
  //Orange/Red
  else if( saliencyValue > 0.62 && saliencyValue <= 0.81 ) {
      color['R'] = 255;
      color['G'] = 69;
      color['B'] = 0;
      if (countsPerBin["E"] == undefined){
        countsPerBin["E"] =1;
    }
    else {
        countsPerBin["E"] = Number(countsPerBin["E"]) + Number( 1 ); 
    }
  }
  
  //Red
  else {
      color['R'] = 255;
      color['G'] = 0;
      color['R'] = 0;
      if (countsPerBin["F"] == undefined){
        countsPerBin["F"] =1;
    }
    else {
        countsPerBin["F"] = Number(countsPerBin["F"]) + Number( 1 ); 
    }
  }
    if( gameboardFlag == 0){
        color['A'] = reverseSaliency;
    }
    else{
        color['A'] = 0.5;
    }
    //color['A'] = 0.5;
    //color['A'] = saliencyValue;
    var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
    return result;
  }

