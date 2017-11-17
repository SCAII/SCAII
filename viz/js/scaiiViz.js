

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
var systemTitle = "SCAII - Small Configurable AI Interface";
// VizInit defaults
var testingMode = false;
var stepCount = 0;
var explanations = [];
var userCommandScaiiPackets = [];
var sessionState = "pending";

var spacingFactor = 1;
var sizingFactor = 1;
// Create the gameboard canvas
var gameboard_canvas = document.createElement("canvas");
var gameboard_ctx = gameboard_canvas.getContext("2d");
var gameboardWidth;
var gameboardHeight;
var timeline_canvas = document.createElement("canvas");
var timeline_ctx = timeline_canvas.getContext("2d");



var shape_outline_color = '#202020';
var shape_outline_width = 2;
var use_shape_color_for_outline = false;

var dealer;
var masterEntities = {};



function handleVizInit(vizInit) {
  clearGameBoard();
  //gameboard_ctx.fillText("Received VizInit!", 10, 50);
  if (vizInit.hasTestMode()) {
    if (vizInit.getTestMode()) {
      testingMode = true;
    }
  }
  if (vizInit.hasStepCount()) {
    stepCount = vizInit.getStepCount();
  }
  if (vizInit.hasGameboardWidth()) {
    gameboardWidth = vizInit.getGameboardWidth();
	console.log("gameboard width : " + gameboardWidth);
	$("#scaii-gameboard").css("width", gameboardWidth);
	gameboard_canvas.width = gameboardWidth;
	
  }
  if (vizInit.hasGameboardHeight()) {
    gameboardHeight = vizInit.getGameboardHeight();
	$("#scaii-gameboard").css("height", gameboardHeight);
	gameboard_canvas.height = gameboardHeight;
  }
  explanations = vizInit.getExplanationsList();
  //renderTimeline(stepCount);
}
function handleViz(vizData){
  console.log('received Viz...');
  var entitiesList = vizData.getEntitiesList();
  var step = vizData.getStep();
  console.log("step in vizData was " + step);
  updateProgress(step + 1, stepCount);
  handleEntities(entitiesList);
  if (vizData.hasChart()){
	  var chartInfo = vizData.getChart();
	  renderChartInfo(chartInfo, gameboardHeight);
  }
}
function handleEntities(entitiesList) {
  
  console.log('entities count :' + entitiesList.length);
  for (var i in entitiesList) {
    var entity = entitiesList[i];

    if (entity.hasId()) {
      var idString = '' + entity.getId();
      //if (idString == '8') {
      //  console.log('=========== UPDATING ENTITY ===================')
      //  logEntity(entity);
      //}
      console.log('############## id string read as ' + idString + '###############');
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
      if (idString == '8') {
        console.log('=========== MASTER ENTITY AFTER UPDATE===================')
        logEntity(masterEntities[idString]);
      }

    }
    else {
      console.log('-----ERROR----- no entity ID on entity');
    }

  }
  renderState(gameboard_ctx, masterEntities);
}

function clearGameBoard() {
  gameboard_ctx.clearRect(0, 0, gameboard_canvas.width, gameboard_canvas.height);
}


var draw_example_shapes = function () {
  clearGameBoard();
  colorRGBA = getBasicColorRGBA();
  drawRect(gameboard_ctx,100, 100, 80, 80, colorRGBA);
  drawTriangle(gameboard_ctx,200, 200, 80, colorRGBA);
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
	connectButton.appendChild(connectText);
	connectButton.onclick = function(){
		console.log("calling tryConnect");
		tryConnect('.',0);
	};
	$("#scaii-interface-title").append(connectButton);
  }else {
	  tryConnect('.', 0);
  }
  
}

var initUI = function(){
	gameboard_canvas.width = 400;
	gameboard_canvas.height = 400;
	$("#scaii-gameboard").append(gameboard_canvas);
	$("#scaii-gameboard").css("width", gameboard_canvas.width);
	$("#scaii-gameboard").css("height", gameboard_canvas.height);
	console.log("set height to " + gameboard_canvas.height)
	$("#scaii-gameboard").css("background-color", "#123456");
	
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
	
	var rewindButton = document.createElement("BUTTON");       
	rewindButton.setAttribute("class", "controlButton");
	rewindButton.disabled = true;	
	rewindButton.innerHTML = '<img src="imgs/rewind.png", height="8px" width="10px"/>';    
	$("#scaii-game-controls").append(rewindButton);
	
	$("#scaii-game-controls").css("text-align", "center");
	var pauseButton = document.createElement("BUTTON");       
	pauseButton.setAttribute("class", "controlButton");	
	pauseButton.innerHTML = '<img src="imgs/pause.png", height="8px" width="10px"/>';   
	$("#scaii-game-controls").append(pauseButton);
	pauseButton.onclick = pauseGame;
	
	
	
	//$(".controlButton").css("font-family", "Arial");
	//$(".controlButton").css("font-size", "10px");
	$(".controlButton").css("margin-right", "20px");
	$(".controlButton").css("margin-left", "20px");
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
  clearGameBoard();
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
  }

  dealer.onmessage = function (message) {
    sessionState = "inProgress";
    var s = message.data;
    var sPacket = proto.scaii.common.ScaiiPacket.deserializeBinary(s);
    if (sPacket.hasVizInit()) {
      var vizInit = sPacket.getVizInit();
      handleVizInit(vizInit);
	  var mm = new proto.scaii.common.MultiMessage;
	  dealer.send(mm.serializeBinary());
    }
    else if (sPacket.hasViz()) {
      var viz = sPacket.getViz();
      handleViz(viz);
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
		}
		else {
		  mm = new proto.scaii.common.MultiMessage;
		}
		dealer.send(mm.serializeBinary());
		userCommandScaiiPackets = [];
	  }
	}
    else {
      console.log(sPacket.toString())
      console.log('unexpected message from system!');
      mm = new proto.scaii.common.MultiMessage;
      dealer.send(mm.serializeBinary());
    }
  };
  dealer.onclose = function (closeEvent) {
    console.log("closefired " + attemptCount);
    if (sessionState == "pending") {
      // the closed connection was likely due to failed connection. try reconnecting
	  
      setTimeout(function () { tryConnect(dots, attemptCount); }, 2000);
    }
    //alert("Closed!");
  };

  dealer.onerror = function (err) {
    console.log("Error: " + err);
    //alert("Error: " + err);
  };
};

var then = Date.now();
main();