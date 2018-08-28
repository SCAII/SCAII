function getSaliencyV2UIMap() {
    var uimap = {};

    uimap.normalizationFactor = undefined;


    uimap.saliencyMapPercentSize = 1.0;
    uimap.outlinesForSaliencyMap = {};
    uimap.currentlyHighlightedSaliencyMapKey = undefined;
	uimap.renderSaliencyMap = function(canvas, ctx, channel){
		renderState(canvas, masterEntities, gameScaleFactor, 0, 0,false);
		this.overlaySaliencyMapOntoGameReplica(ctx, channel, 0);
	}	

	uimap.overlaySaliencyMapOntoGameReplica = function(ctx, channel, gameboardFlag ) {
        for (var x= 0; x < Number(channel.width); x++){
            for (var y = 0; y < Number(channel.height); y++){
                var index = Number(channel.height) * Number(x) + Number(y);
                var cellValue = channel.cells[index];
                var normVal = lookupNormalizationValue(channel.normalizationKey);
                //console.log( "normalization Factor: " + normVal );
                ctx.fillStyle = getOverlayOpacityBySaliencyRGBAString(Number(cellValue) / Number(normVal), gameboardFlag);
                //console.log( "ctx.fillStyle: " + ctx.fillStyle );
                ctx.fillRect(x*gameScaleFactor, y*gameScaleFactor, gameScaleFactor, gameScaleFactor);
                ctx.fill();
            }
            var foo = 3;
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

    uimap.removeAllGameboardOverlays = function(){
        for (var i in this.gameboardOverlayLookupMap){
            var overlayCanvas = this.gameboardOverlayLookupMap[i];
            var overlayCanvasId = overlayCanvas.getAttribute("id");
            $("#" + overlayCanvasId).detach();
        }
    }

    uimap.addActiveGameboardOverlays = function() {
        for (var i in this.gameboardOverlayLookupMap){
            var overlayCanvas = this.gameboardOverlayLookupMap[i];
            var overlayCanvasId = overlayCanvas.getAttribute("id");
            var relevantDp = getDecisionPointPrefix();
            if (overlayCanvasId.includes(relevantDp)) {
                if (overlayCanvas.showingAsSaliencyOverlayOntoGameboard){
                    $("#scaii-gameboard").append( overlayCanvas );
                }
            }
        }
    }

    uimap.removeAllSaliencyMapOutlines = function() {
        for (var i in this.outlinesForSaliencyMap ){
            var outlineDiv = this.outlinesForSaliencyMap[i];
            var outlineDivId = outlineDiv.getAttribute("id");
            $("#" + outlineDivId).detach();
        }
    }

    uimap.addActiveSaliencyMapOutlines = function(){
        for (var i in this.outlinesForSaliencyMap ){
            var outlineDiv = this.outlinesForSaliencyMap[i];
            var mapHostDivId = outlineDiv.overlayedOntoMapHostDivId;
            if (undefined != mapHostDivId) {
                $("#" + mapHostDivId).append(outlineDiv);
            }
        }
    }

    // uimap.reviveAppropriateGameboardOverlays = function() {
    //     this.removeAllGameboardOverlays();
    //     this.addActiveGameboardOverlays();

    //     this.removeAllSaliencyMapOutlines();
    //     this.addActiveSaliencyMapOutlines();
    // }

    uimap.buildOverlayCanvas = function(channel){
        var canvas = document.createElement("canvas");
        canvas.setAttribute("id", channel.gameboardOverlayId);
        canvas.height = gameboard_canvas.height;
        canvas.width = gameboard_canvas.width;
        var ctx = canvas.getContext("2d");
        // canvas size should be same a gameboardHeight
        //this.renderSaliencyMap(canvas, ctx, channel);
        var gameboardOffset = $("#scaii-gameboard").offset( );
        var gameboardTop = gameboardOffset.top;
        var gameboardLeft = gameboardOffset.left;
        var styleString = "position:absolute; left:" + gameboardLeft + "px; top:" + gameboardTop + "px;background-color:transparent;border-style:solid"
        canvas.setAttribute("style", styleString);
        console.log("canvas style string" + canvas.getAttribute("style"));
        this.overlaySaliencyMapOntoGameReplica(ctx, channel, 0)
        return canvas;
    }

    uimap.buildOutlineDiv = function(channel, explCanvas){
        var w = explCanvas.width;
        var h = explCanvas.height;
        var outlineWidth = 6;
        var divW = w - 2 * outlineWidth;
        var divH = h - 2 * outlineWidth;
        var outlineDiv = document.createElement("div");
        outlineDiv.setAttribute("id", channel.outlineDivId);
        // take the outline into account for positioning
        var relativeTopValue = - Number(h) - Number(outlineWidth);
        outlineDiv.setAttribute("style","border-color:white;border-style:solid;border-width:6px;z-index:" + zIndexMap["saliencyHoverValue"] + "; position:relative; left:0px; top:" + relativeTopValue + "px;background-color:transparent;width:"+ divW + "px;height:"+ divH + "px;");
        return outlineDiv;
    }

    uimap.buildSaliencyCanvas = function(channel){
        var ch = channel;
		var saliencyCanvas = document.createElement("canvas");
        saliencyCanvas.setAttribute("class", "explanation-canvas");
        //the line below is how we're storing the cells. For naming, we wrap the saliencyMapId into the current DP
        this.cellsForSaliencyMapId[ ch.saliencyMapId ] = ch.cells;
        saliencyCanvas.setAttribute("id", ch.saliencyMapId);
        saliencyCanvas.onclick = function(e) {
            processSaliencyMapClick(e, ch);
        }
		var explCtx = saliencyCanvas.getContext("2d");
		// canvas size should be same a gameboardHeight
		saliencyCanvas.width  = gameboard_canvas.width * ch.scaleFactor;
		saliencyCanvas.height = gameboard_canvas.height * ch.scaleFactor;
        this.renderSaliencyMap(saliencyCanvas, explCtx, ch);

        saliencyCanvas.addEventListener('mouseenter', function(evt) {
			ch.valueSpan.setAttribute("style", 'visibility:hidden;');
			var logLine = templateMap["startMouseOverSaliencyMap"];
			logLine = logLine.replace("<REGION>", "saliencyMap");
			logLine = logLine.replace("<SLNCY_NAME>", ch.name);
			targetHoverHandler(evt, logLine);
        });
        
		saliencyCanvas.addEventListener('mouseleave', function(evt) {
            ch.valueSpan.setAttribute("style", 'visibility:hidden;');
			var logLine = templateMap["endMouseOverSaliencyMap"];
			logLine = logLine.replace("<REGION>", "saliencyMap");
			logLine = logLine.replace("<SLNCY_NAME>", ch.name);
			targetHoverHandler(evt, logLine);
        });

        if (!userStudyMode){
            saliencyCanvas.addEventListener('mousemove', function(evt) {
                displayCellValue(evt, ch.height, lookupNormalizationValue(ch.normalizationKey), ch.cells);
              }, false);
        }
        return saliencyCanvas;
    }

    uimap.buildTitledMapDiv = function(channel){
        var titledMapDiv = document.createElement("div");
        titledMapDiv.setAttribute("id", channel.titledMapDivId);
        return titledMapDiv;
    }

    uimap.buildTitleDiv = function(channel){
        var ch = channel;
        var titleDiv   = document.createElement("div");
        titleDiv.setAttribute("id", ch.titleId);
        titleDiv.innerHTML = ch.name;
        titleDiv.setAttribute("style", "font-family:Fira Sans;font-size:16px;padding-left:6px;padding-right:6px;padding-top:6px;padding-bottom:2px;text-align:center;height:30px;");
        return titleDiv;
    }
        
    // mapHostDiv (so we can attach outline to it)
    uimap.buildMapHostDiv = function(channel, saliencyCanvas) {
        var ch = channel;
        var mapHostDiv = document.createElement("div");
		mapHostDiv.setAttribute("id", ch.mapHostDivId);
		mapHostDiv.setAttribute("style", "width:" + saliencyCanvas.width + "px;height:" + saliencyCanvas.height + "px;background-color:#123456;");
		return mapHostDiv;
    }

    uimap.createValueSpan = function(channel) {
        var ch = channel;
        var valueSpan = document.createElement("span");
		valueSpan.setAttribute("class","value-div");
        valueSpan.setAttribute("style", 'visibility:hidden;font-family:Arial;');
        return valueSpan;
    }

    uimap.buildExplChannel = function(channel) {
        var ch = channel;
       
        ch.valueSpan    = this.createValueSpan(ch);
        ch.saliencyCanvas = this.buildSaliencyCanvas(ch);
        ch.overlayCanvas  = this.buildOverlayCanvas(ch);
        ch.outlineDiv     = this.buildOutlineDiv(ch, ch.saliencyCanvas);
        ch.titledMapDiv   = this.buildTitledMapDiv(ch);
        ch.titleDiv       = this.buildTitleDiv(ch);
        ch.mapHostDiv     = this.buildMapHostDiv(ch, ch.saliencyCanvas);
        ch.outlineDiv.onclick = function( ) {
            // remove outline from mapHost
            ch.mapHostDiv.removeChild( ch.outlineDiv );
            ch.outlineActive = false;
            console.log("CLICK_TO_REMOVE: " + ch.outlineDiv.getAttribute("id") +" from " + ch.mapHostDiv.getAttribute("id"));

            // remove overlay from gameboard
            var overlayCanvasId = ch.overlayCanvas.getAttribute("id");
            $("#" +  overlayCanvasId).detach( );
            ch.overlayActive = false;
            console.log("CLICK_TO_REMOVE: " + overlayCanvasId);
        }
        ch.titledMapDiv.appendChild(ch.titleDiv);
		ch.titledMapDiv.appendChild(ch.mapHostDiv);
        ch.mapHostDiv.appendChild(ch.saliencyCanvas);
        ch.mapHostDiv.appendChild(ch.valueSpan);
    }

    uimap.reviseStyleOverlayCanvasAtDisplayTime = function(channel, gridX){
        var gameboardOffset = $("#scaii-gameboard").offset( );
        var gameboardTop = gameboardOffset.top;
        var gameboardLeft = gameboardOffset.left;
        var zIndex = Number(zIndexMap["saliencyHoverValue"]) + Number(gridX);
        var styleString = "z-index:" + zIndex + "; position:absolute; left:" + gameboardLeft + "px; top:" + gameboardTop + "px;background-color:transparent;border-style:solid"
        console.log(styleString);
        channel.overlayCanvas.setAttribute("style",styleString);
    }

    uimap.styleTitledMapDivAtDisplayTime = function(channel, gridX, gridY){
        var titledMapDivHeight = Number(channel.saliencyCanvas.height) + Number(30);
        var gridPositionInfo = getGridPositionStyle(gridX, gridY);
        var constantStyle = "display:flex;flex-direction:column;border:1px solid #0063a6;";
        var widthStyle = "width:" + channel.saliencyCanvas.width +"px;";
        var heightStyle = "height: " + titledMapDivHeight+"px;";
        var styleString = constantStyle + widthStyle + heightStyle + gridPositionInfo;
		channel.titledMapDiv.setAttribute("style", styleString);
    }

	uimap.renderExplChannel = function(gridX, gridY, channel) {
        var ch = channel;

        this.styleTitledMapDivAtDisplayTime(ch, gridX, gridY);
        this.reviseStyleOverlayCanvasAtDisplayTime(ch, gridX);

		$("#saliency-maps").append(ch.titledMapDiv);
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


    uimap.mapHostDivIds = {};

    uimap.showOutlineOnSelectedSaliencyMap = function(channel) {
        console.log("SHOW_OUTLINE: " + channel.outlineDiv.getAttribute("id") + " onto " + channel.mapHostDiv.getAttribute("id"));
        channel.mapHostDiv.appendChild( channel.outlineDiv );
        channel.outlineActive = true;
    }

    uimap.overlaySelectedSaliencyMapOnGameboard = function(channel) {
        console.log("OVERLAY:  " + channel.overlayCanvas.getAttribute("id"));
        $("#scaii-gameboard").append( channel.overlayCanvas );
        channel.overlayActive = true;
	}

    return uimap;
}

    /*
    Must take into account current filename, current decision point, and saliencyMapId
    */
function prependDPNumber(val) {
    var result = getDecisionPointPrefix() + "-" + val;
    return result;
}

function getDecisionPointPrefix() {
    var currentStep = sessionIndexManager.getCurrentIndex();
    var dp = sessionIndexManager.getDPThatStartsEpochForStep(currentStep);
    console.log("dp: " + dp);
    return dp;
}

function getDecisionPointPrefixForActiveQuestions() {
    console.log("currentDP from squim: " + activeStudyQuestionManager.squim.getCurrentDecisionPointNumber());
    return 'DP-' + activeStudyQuestionManager.squim.getCurrentDecisionPointNumber();
}

function displayCellValue(evt, height, normalizationFactor, cells){
    var mousePos = getMousePos(explCanvas, evt);
    var xForValueLookup = Math.floor(mousePos.x / gameScaleFactor);
    var yForValueLookup = Math.floor(mousePos.y/gameScaleFactor);
    var index = height * xForValueLookup + yForValueLookup;
    var cellValue = cells[index];
    var normValue = Number(cellValue)/Number(normalizationFactor);
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
  

var getMaxValueForLayer = function(vals){
	var max = 0.0;
	for (var i in vals) {
		var value = vals[i];
		if (value > max) {
			max = value;
		}
    }
    //console.log("max for layer = " + max);
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

function processSaliencyMapClick(e, ch){
    var x = e.offsetX;
    var y = e.offsetY;
    var shapeId = getClosestInRangeShapeId(gameboard_ctx, x, y);
    var logLine = templateMap["clickSaliencyMap"];
    if (shapeId != undefined){
        //targetClickHandler(e, "clickEntity:" + shapeLogStrings[shapeId] + "_" + getQuadrantName(x,y));
        logLine = logLine.replace("<REGION>", "saliencyMap");
        logLine = logLine.replace("<CLCK_SALNCY_MAP>", ch.name);
        logLine = logLine.replace("<SHAPE_LOG>", shapeLogStrings[shapeId]);
        logLine = logLine.replace("<QUADRANT_NAME>", getQuadrantName(x,y));
        targetClickHandler(e, logLine);
        //targetClickHandler(e, "clickSaliencyMap:" + ch.name + "_(" + shapeLogStrings[shapeId] + "_" + getQuadrantName(x,y)+ ")");
    }
   else {
        //targetClickHandler(e, "clickGameQuadrant:" + getQuadrantName(x,y));
        logLine = logLine.replace("<REGION>", "saliencyMap");
        logLine = logLine.replace("<CLCK_SALNCY_MAP>", ch.name);
        logLine = logLine.replace("<SHAPE_LOG>", "NA");
        logLine = logLine.replace("<QUADRANT_NAME>", getQuadrantName(x,y));
        targetClickHandler(e, logLine);
        //targetClickHandler(e, "clickSaliencyMap:" + ch.name + "_(" + getQuadrantName(x,y) + ")");
    }
    if (userStudyMode){
        processOutlineAndOverlay(ch);
    }
}
function processOutlineAndOverlay(channel){
    var legalClickTargetRegions = activeStudyQuestionManager.getLegalInstrumentationTargetsForCurrentQuestion();
    if (activeStudyQuestionManager.renderer.isLegalRegionToClickOn("target:saliencyMap", legalClickTargetRegions)){
        if (activeStudyQuestionManager.renderer.controlsWaitingForClick.length == 0) {
            return;
        }
        if (tm.showAllSaliencyForTreatment1 || tm.showSaliencyAll){
            var activeQuestionDecisionPoint = activeStudyQuestionManager.squim.getCurrentDecisionPointNumber();
            if (activeQuestionDecisionPoint == showingDecisionNumber){
                var uimap = currentExplManager.saliencyUI.uimap;
                uimap.showOutlineOnSelectedSaliencyMap(channel);
                uimap.overlaySelectedSaliencyMapOnGameboard( channel);
            }
        }
    }
}
function lookupNormalizationValue(key){
    return 123;
}