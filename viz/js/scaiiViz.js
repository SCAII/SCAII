

goog.require('proto.scaii.common.Action');
goog.require('proto.scaii.common.AgentCfg');
goog.require('proto.scaii.common.AgentEndpoint');
goog.require('proto.scaii.common.AgentSupported');
goog.require('proto.scaii.common.BackendCfg');
goog.require('proto.scaii.common.BackendEndpoint');
goog.require('proto.scaii.common.BackendInit');
goog.require('proto.scaii.common.BackendSupported');
goog.require('proto.scaii.common.BackendSupported.SerializationSupport');
goog.require('proto.scaii.common.Cfg');
goog.require('proto.scaii.common.Color');
goog.require('proto.scaii.common.CoreCfg');
goog.require('proto.scaii.common.CoreEndpoint');
goog.require('proto.scaii.common.Endpoint');
goog.require('proto.scaii.common.Entity');
goog.require('proto.scaii.common.Error');
goog.require('proto.scaii.common.InitAs');
goog.require('proto.scaii.common.ModuleCfg');
goog.require('proto.scaii.common.ModuleEndpoint');
goog.require('proto.scaii.common.ModuleInit');
goog.require('proto.scaii.common.ModuleSupported');
goog.require('proto.scaii.common.MultiMessage');
goog.require('proto.scaii.common.Other');
goog.require('proto.scaii.common.PluginType');
goog.require('proto.scaii.common.Pos');
goog.require('proto.scaii.common.Rect');
goog.require('proto.scaii.common.RustFFIConfig');
goog.require('proto.scaii.common.ScaiiPacket');
goog.require('proto.scaii.common.SerializationFormat');
goog.require('proto.scaii.common.SerializationRequest');
goog.require('proto.scaii.common.SerializationResponse');
goog.require('proto.scaii.common.Shape');
goog.require('proto.scaii.common.State');
goog.require('proto.scaii.common.SupportedBehavior');
goog.require('proto.scaii.common.Triangle');
goog.require('proto.scaii.common.Viz');
goog.require('proto.scaii.common.VizInit');




/**
* Copyright (c) 2017-present, Oregon State University, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
var userInputBlocked = false;
var systemTitle = "SCAII - Small Configurable AI Interface";
// VizInit defaults
var testingMode = false;
var maxStep = 0;
var explanations = [];
var userCommandScaiiPackets = [];
var sessionState = "pending";

var spacingFactor = 1;
var sizingFactor = 1;
var zoomFactor = 3;
var zoomBoxOriginX = 0;
var zoomBoxOriginY = 0;
var entitiesList = undefined;
var shapePositionMapForContext ={};
var primaryHighlightedShapeIds = [];
var secondaryHighlightedShapeIds = [];

// Create the gameboard canvas
var gameboard_canvas = document.createElement("canvas");
var gameboard_ctx = gameboard_canvas.getContext("2d");

var gameboard_zoom_canvas = document.createElement("canvas");
var gameboard_zoom_ctx = gameboard_zoom_canvas.getContext("2d");

gameboard_canvas.addEventListener('click', function(event) {
  if (event.shiftKey){
    adjustZoomBoxPosition(event.offsetX, event.offsetY);
	handleEntities(entitiesList);
  }
  else {
    shapeId = getClosestInRangeShapeId(gameboard_ctx,event.offsetX, event.offsetY, shapePositionMapForContext["game"]);
    primaryHighlightedShapeIds = [];
    if (shapeId != undefined){
      primaryHighlightedShapeIds.push(shapeId);
    }
    handleEntities(entitiesList);
  }
	
});
gameboard_zoom_canvas.addEventListener('click', function(event) {
  shapeId = getClosestInRangeShapeId(gameboard_zoom_ctx,event.offsetX, event.offsetY, shapePositionMapForContext["zoom"]);
  primaryHighlightedShapeIds = [];
  if (shapeId != undefined){
    primaryHighlightedShapeIds.push(shapeId);
  }
  handleEntities(entitiesList);

	
});
var gameboardWidth;
var gameboardHeight;
var timeline_canvas = document.createElement("canvas");
var timeline_ctx = timeline_canvas.getContext("2d");
var pauseResumeButton = document.createElement("BUTTON"); 
var rewindButton = document.createElement("BUTTON");
var speedSlider = document.createElement("input");
var zoomSlider = document.createElement("input");
rewindButton.disabled = true;	
rewindButton.setAttribute("id", "rewindButton");
pauseResumeButton.disabled = true;
pauseResumeButton.setAttribute("id", "pauseResumeButton");

var controlsManager = configureControlsManager(pauseResumeButton, rewindButton);
var shape_outline_color = '#202020';
var shape_outline_width = 2;
var use_shape_color_for_outline = false;

var dealer;
var masterEntities = {};


function adjustZoomBoxPosition(x,y){
  // they clicked at new target for center of box.
  var boxWidth = gameboard_canvas.width / zoomFactor;
  var boxHeight = gameboard_canvas.height / zoomFactor;
  zoomBoxOriginX = x - boxWidth / 2;
  zoomBoxOriginY = y - boxHeight / 2;
  if (zoomBoxOriginX < 0){
	  zoomBoxOriginX = 0;
  }
  else if (zoomBoxOriginX > gameboard_canvas.width - boxWidth){
	  zoomBoxOriginX = gameboard_canvas.width - boxWidth;
  }
  else {
	  // a-ok - they clicked in the middle somewhere
  }
  if (zoomBoxOriginY < 0){
	  zoomBoxOriginY = 0;
  }
  else if (zoomBoxOriginY > gameboard_canvas.height - boxHeight){
	  zoomBoxOriginY = gameboard_canvas.height - boxHeight;
  }
  else {
	  // a-ok - they clicked in the middle somewhere
  }
  
}

function handleVizInit(vizInit) {
  clearGameBoards();
  //gameboard_ctx.fillText("Received VizInit!", 10, 50);
  if (vizInit.hasTestMode()) {
    if (vizInit.getTestMode()) {
      testingMode = true;
    }
  }
  if (vizInit.hasStepCount()) {
    maxStep = vizInit.getStepCount() - 1;
  }
  if (vizInit.hasGameboardWidth()) {
    gameboardWidth = vizInit.getGameboardWidth();
	//console.log("gameboard width : " + gameboardWidth);
	$("#scaii-gameboard").css("width", gameboardWidth);
	gameboard_canvas.width = gameboardWidth;
  }
  gameboard_zoom_canvas.width = gameboard_canvas.width;
  
  if (vizInit.hasGameboardHeight()) {
    gameboardHeight = vizInit.getGameboardHeight();
	$("#scaii-gameboard").css("height", gameboardHeight);
	gameboard_canvas.height = gameboardHeight;
  }
  gameboard_zoom_canvas.height = gameboard_canvas.height;
  explanations = vizInit.getExplanationsList();
  //renderTimeline(maxStep);
}
function handleViz(vizData){
  //console.log('received Viz...');
  entitiesList = vizData.getEntitiesList();
  var step = vizData.getStep();
  //console.log("step in vizData was " + step+ "maxStep is " + maxStep);
  updateProgress(step, maxStep);
  
  handleEntities(entitiesList);
  if (step == maxStep){
	  controlsManager.reachedEndOfGame();
  }
  if (vizData.hasChart()){
	  var chartInfo = vizData.getChart();
	  renderChartInfo(chartInfo, gameboardHeight);
  }
}
function handleEntities(entitiesList) {
  
  //console.log('entities count :' + entitiesList.length);
  for (var i in entitiesList) {
    var entity = entitiesList[i];

    if (entity.hasId()) {
      var idString = '' + entity.getId();
      //if (idString == '8') {
      //  console.log('=========== UPDATING ENTITY ===================')
      //  logEntity(entity);
      //}
      //console.log('############## id string read as ' + idString + '###############');
      if (masterEntities[idString] == undefined) {
        if (entity.hasDelete() && entity.getDelete()) {
          // do not add new entity that is marked as delete
        }
        else {
          masterEntities[idString] = entity;
        }
      }
      else {
        if (entity.hasDelete() && entity.getDelete()) {
          delete masterEntities[idString];
        }
        else {
          var masterEntity = masterEntities[idString];
          updateMasterEntity(masterEntity, entity);
        }
      }
      //if (idString == '8') {
      //  console.log('=========== MASTER ENTITY AFTER UPDATE===================')
      //  logEntity(masterEntities[idString]);
      //}

    }
    else {
      console.log('-----ERROR----- no entity ID on entity');
    }

  }
  renderState(gameboard_ctx, gameboard_canvas, masterEntities, 1, 0, 0, shapePositionMapForContext["game"]);
  drawZoomBox(gameboard_ctx, gameboard_canvas, zoomBoxOriginX, zoomBoxOriginY, zoomFactor);
  renderState(gameboard_zoom_ctx, gameboard_zoom_canvas, masterEntities, zoomFactor, zoomBoxOriginX, zoomBoxOriginY, shapePositionMapForContext["zoom"]);
}

function drawZoomBox(ctx, canvas, originX, originY, zoom){
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'white';
  var width = canvas.width / zoom;
  var height = canvas.height / zoom;
  ctx.rect(originX,originY,width,height);
  ctx.stroke();
  //ctx.strokeRect(originX, originY, height, width);
}
function clearGameBoard(ctx, canvas, shapePositionMapKey) {
  ctx.clearRect(0,0, canvas.width, canvas.height);
  //gameboard_ctx.clearRect(0, 0, gameboard_canvas.width, gameboard_canvas.height);
  //gameboard_zoom_ctx.clearRect(0, 0, gameboard_zoom_canvas.width, gameboard_zoom_canvas.height);
  shapePositionMapForContext[shapePositionMapKey] = {};
}


var draw_example_shapes = function () {
  clearGameBoard(gameboard_ctx,gameboard_canvas, "game");
  colorRGBA = getBasicColorRGBA();
  drawRect(gameboard_ctx,100, 100, 80, 80, colorRGBA);
  drawTriangle(gameboard_ctx,200, 200, 80, 'red');
}
var main = function () {
  initUI();	
  
  //var redrawChartHiddenButton = document.createElement("BUTTON");
  //redrawChartHiddenButton.setAttribute("id", "chartRedrawTriggerButton");
  //redrawChartHiddenButton.appendChild(document.createTextNode("Refresh"));
  //$("#scaii-game-controls").append(redrawChartHiddenButton);
  var debug = true;
  if (debug){
	var connectButton = document.createElement("BUTTON");
	var connectText = document.createTextNode("Connect");
	connectButton.setAttribute("class", "connectButton");
	connectButton.setAttribute("id", "connectButton");	
	connectButton.appendChild(connectText);
	connectButton.onclick = function(){
		console.log("calling tryConnect");
		tryConnect('.',0);
	};
	$("#scaii-interface-title").append(connectButton);
	$("#connectButton").css("margin-left", "30px");
	$("#connectButton").css("font-family", "Fira Sans");
	$("#connectButton").css("font-size", "12px");
	
  }else {
	  tryConnect('.', 0);
  }
  
}
var configureSpeedSlider = function(){
	speedSlider.setAttribute("type", "range");
	speedSlider.setAttribute("min", "1");
	speedSlider.setAttribute("max", "100");
	speedSlider.setAttribute("value", "90");
	speedSlider.setAttribute("class", "slider");
	speedSlider.setAttribute("id", "speed-slider");
	speedSlider.oninput = function() {
		var speedString = "" + this.value;
		var args = [ speedString ];
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.SET_SPEED);
		userCommand.setArgsList(args);
		stageUserCommand(userCommand);
	}
	//<input type="range" min="1" max="100" value="50" class="slider" id="myRange">
}
var configureZoomSlider = function(){
	zoomSlider.setAttribute("type", "range");
	zoomSlider.setAttribute("min", "100");
	zoomSlider.setAttribute("max", "600");
	zoomSlider.setAttribute("value", "200");
	zoomSlider.setAttribute("class", "slider");
	zoomSlider.setAttribute("id", "zoom-slider");
	zoomSlider.oninput = function() {
		zoomFactor = "" + this.value / 100;
		console.log("zoom factor " + zoomFactor);
		handleEntities(entitiesList);
	}
}
var initUI = function(){
	configureSpeedSlider();
	configureZoomSlider();
	controlsManager.setControlsNotReady();
	gameboard_canvas.width = 400;
	gameboard_canvas.height = 400;
	gameboard_zoom_canvas.width = gameboard_canvas.width;
	gameboard_zoom_canvas.height = gameboard_canvas.height;
	$("#scaii-gameboard").append(gameboard_canvas);
	$("#scaii-gameboard").css("width", gameboard_canvas.width);
	$("#scaii-gameboard").css("height", gameboard_canvas.height);
	$("#scaii-gameboard").css("background-color", "#123456");
	
	$("#scaii-gameboard-zoom").append(gameboard_zoom_canvas);
	$("#scaii-gameboard-zoom").css("width", gameboard_zoom_canvas.width);
	$("#scaii-gameboard-zoom").css("height", gameboard_zoom_canvas.height);
	$("#scaii-gameboard-zoom").css("background-color", "#123456");
	
	$("#scaii-interface-title").css("font-family", "Fira Sans");
	$("#scaii-interface-title").css("font-size", "12px");
	$("#scaii-interface-title").css("padding-left", "6px");
	$("#scaii-interface-title").css("padding-top", "4px");
	//$("#scaii-interface-title").css("text-align", "center");
	$("#scaii-interface-title").html(systemTitle);
	
	$("#explanations-interface-title").css("font-family", "Fira Sans");
	$("#explanations-interface-title").css("font-size", "12px");
	//$("#explanations-interface-title").css("padding-left", "6px");
	$("#explanations-interface-title").css("padding-top", "4px");
	//$("#explanations-interface-title").css("padding-bottom", "6px");
	$("#explanations-interface-title").css("text-align", "center");
	$("#explanations-interface-title").html("- Explanations -");
	
	var speedSliderLabel = document.createElement("div");
	$("#scaii-game-controls").append(speedSliderLabel);  
	speedSliderLabel.setAttribute("id", "speed-slider-label");
	$("#speed-slider-label").html("replay speed");
	$("#speed-slider-label").css("font-family", "Fira Sans");
	$("#speed-slider-label").css("font-size", "12px");
	$("#speed-slider-label").css("padding-left", "6px");
	$("#speed-slider-label").css("padding-right", "4px");
	$("#speed-slider-label").css("padding-top", "2px");
	
	var blankSpacerLeft = document.createElement("div");
	blankSpacerLeft.setAttribute("id","controls-spacer-left");
	var blankSpacerRight = document.createElement("div");
	blankSpacerRight.setAttribute("id","controls-spacer-right");
	
	$("#scaii-game-controls").append(speedSlider); 
	$("#scaii-game-controls").append(blankSpacerLeft); 
	//$("#controls-spacer-left").html(" ");
	//$("#speed-slider").css("flex-grow","50");
    
	rewindButton.setAttribute("class", "controlButton");
	rewindButton.innerHTML = '<img src="imgs/rewind.png", height="8px" width="10px"/>'; 
    rewindButton.onclick = tryRewind;	
	$("#scaii-game-controls").append(rewindButton);
	
	$("#scaii-game-controls").css("text-align", "center");
	      
	pauseResumeButton.setAttribute("class", "controlButton");	
	pauseResumeButton.innerHTML = '<img src="imgs/pause.png", height="8px" width="10px"/>';  
	
	$("#scaii-game-controls").append(pauseResumeButton);
	pauseResumeButton.onclick = tryPause;
	
	$("#scaii-game-controls").append(blankSpacerRight); 
	
	$("#controls-spacer-left").css("flex-grow","1");
	$("#controls-spacer-right").css("flex-grow","1");
	
	
	//$(".controlButton").css("font-family", "Arial");
	//$(".controlButton").css("font-size", "10px");
	$(".controlButton").css("margin-right", "5px");
	$(".controlButton").css("margin-left", "5px");
	$(".controlButton").css("padding-left", "2px");
	$(".controlButton").css("padding-right", "2px");
	$(".controlButton").css("padding-bottom", "0px");
	$(".controlButton").css("padding-top", "0px");
	//$(".controlButton").css("border-top", "1px");
	//$(".controlButton").css("border-bottom", "1px");
	//$(".controlButton").css("border-left", "1px");
	//$(".controlButton").css("border-right", "1px");
	/*
	timeline_canvas.width = 400;
	timeline_canvas.height = 20;
	$("#scaii-timeline").append(timeline_canvas);
	timeline_ctx.lineWidth = 1;
	//timeline_ctx.strokeStyle = shape_outline_color;
	timeline_ctx.beginPath();
	timeline_ctx.moveTo(10, 10);
	timeline_ctx.lineTo(390, 10);
	timeline_ctx.stroke();
	
	var exp1 = {name:"attack knight", description:"attack the closest knight", step:5, type:"attack"};
	var exp2 = {name:"retreat west", description:"running from group", step:20, type:"retreat"};
	var exp3 = {name:"retreat north", description:"running from group", step:50, type:"retreat"};
	var exp4 = {name:"attack knight", description:"attack the closest knight", step:75, type:"attack"};
	var exp5 = {name:"attack dragon", description:"attack the closest dragon", step:80, type:"attack"};
	var exp6 = {name:"retreat", description:"running from dragon", step:85, type:"retreat"};
	var explanations = [exp1, exp2, exp3, exp4, exp5, exp6];
	for (var i = 0; i < explanations.length; i++){
		var exp = explanations[i];
		drawExplanationBox(exp.step, exp.type);
	}
	*/
	
	var zoomSliderLabel = document.createElement("div");
	$("#scaii-zoom-controls").append(zoomSliderLabel);  
	zoomSliderLabel.setAttribute("id", "zoom-slider-label");
	$("#zoom-slider-label").html("zoom");
	$("#zoom-slider-label").css("font-family", "Fira Sans");
	$("#zoom-slider-label").css("font-size", "12px");
	$("#zoom-slider-label").css("padding-left", "6px");
	$("#zoom-slider-label").css("padding-right", "4px");
	$("#zoom-slider-label").css("padding-top", "2px");
	$("#scaii-zoom-controls").append(zoomSlider); 
	
	$("#game-progress").click(processTimelineClick);
}
function clearGameBoards(){
  clearGameBoard(gameboard_ctx,gameboard_canvas, "game");
  clearGameBoard(gameboard_zoom_ctx,gameboard_zoom_canvas, "zoom");
}
function drawExplanationBox(step, type){
	var stepNumber = Number.parseInt(step);
	var startX = 10 + step*4;
	var startY = 10;
	timeline_ctx.moveTo(startX, startY);
	timeline_ctx.lineTo(startX-7, startY-7);
	timeline_ctx.lineTo(startX+7, startY-7);
	timeline_ctx.moveTo(startX, startY);
	timeline_ctx.stroke();
	//timeline_ctx.addHitRegion({id: step});
}
// calls connect and paints "working" dots.  If connect fails, it calls tryConnect again
function tryConnect(dots, attemptCount) {
  clearGameBoards();
  gameboard_ctx.font = "40px Georgia";
  if (dots == '.') {
    dots = '..';
  }
  else if (dots == '..') {
    dots = '...';
  }
  else {
    dots = '.';
  }
  attemptCount = attemptCount + 1;
  $("#scaii-interface-title").html(systemTitle + " (... connecting " + attemptCount + " " + dots + ")");
  //gameboard_ctx.fillText("connecting  " + attemptCount + " " + dots, 10, 50);
  connect(dots, attemptCount);
}
var drawExplanationBarChart = function(){
	
	
	var options = {
		//legend: { position: "none" },
        title: 'Population of Largest U.S. Cities',
        chartArea: {width: '50%'},
        hAxis: {
          title: 'Total Population',
          minValue: 0
        },
        vAxis: {
          title: 'City'
        },
		'width':600,
        'height':400
      };
	  var chartData = [
        ['Decision', 'r1', 'r2'],
        ['unit victorious', 0.77, 0.4],
        ['unit loses', -0.39, 0.6],
        ['adversary flees', 0.2, 0.3]
      ];
	  drawBarChart(chartData, options);
}


var connect = function (dots, attemptCount) {
  dealer = new WebSocket('ws://localhost:6112');

  dealer.binaryType = 'arraybuffer';
  dealer.onopen = function (event) {
	$("#scaii-interface-title").html(systemTitle);
    console.log("WS Opened.");
  };

  dealer.onmessage = function (message) {
	try {
	  sessionState = "inProgress";
      var s = message.data;
      var sPacket = proto.scaii.common.ScaiiPacket.deserializeBinary(s);
      if (sPacket.hasVizInit()) {
        var vizInit = sPacket.getVizInit();
        handleVizInit(vizInit);
		controlsManager.gameStarted();
	    var mm = new proto.scaii.common.MultiMessage;
	    dealer.send(mm.serializeBinary());
      }
      else if (sPacket.hasViz()) {
        var viz = sPacket.getViz();
        handleViz(viz);
		// we're moving forward so rewind should be enabled
		controlsManager.gameSteppingForward();
	    var mm;
        if (testingMode) {
          mm = buildReturnMultiMessageFromState(masterEntities);
	    }
	    else {
	  	  mm = new proto.scaii.common.MultiMessage;
	    }
        dealer.send(mm.serializeBinary());
      }
      else if (sPacket.hasErr()) {
        console.log(sPacket.getErr().getDescription())
        mm = new proto.scaii.common.MultiMessage;
        dealer.send(mm.serializeBinary());
      }
	  else if (sPacket.hasUserCommand()) {
	    var userCommand = sPacket.getUserCommand();
	    var commandType = userCommand.getCommandType();
	    if (commandType == proto.scaii.common.UserCommand.UserCommandType.POLL_FOR_COMMANDS){
		  var mm;
		  if (userCommandScaiiPackets.length > 0){
	        mm = buildResponseToReplay(userCommandScaiiPackets);
			dealer.send(mm.serializeBinary());
			controlsManager.userCommandSent();
		  }
		  else {
		    mm = new proto.scaii.common.MultiMessage;
			dealer.send(mm.serializeBinary());
		  }
		  
		  userCommandScaiiPackets = [];
        }
		else if (commandType == proto.scaii.common.UserCommand.UserCommandType.JUMP_COMPLETED) {
			controlsManager.jumpCompleted();
			mm = new proto.scaii.common.MultiMessage;
			dealer.send(mm.serializeBinary());
		}
	  }
      else {
        console.log(sPacket.toString())
        console.log('unexpected message from system!');
        mm = new proto.scaii.common.MultiMessage;
        dealer.send(mm.serializeBinary());
      }
	}
	catch (err) {
	  alert(err.message);
	}
  };
	
  dealer.onclose = function (closeEvent) {
    console.log("closefired " + attemptCount);
    if (sessionState == "pending") {
      // the closed connection was likely due to failed connection. try reconnecting
      setTimeout(function () { tryConnect(dots, attemptCount); }, 2000);
    }
  };

  dealer.onerror = function (err) {
    console.log("Error: " + err);
    alert("Error: " + err);
  };
  
};

var then = Date.now();
main();