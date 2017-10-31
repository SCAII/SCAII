

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

var sessionState = "pending";

var spacingFactor = 1;
var sizingFactor = 1;
// Create the gameboard canvas
var gameboard_canvas = document.createElement("canvas");
var gameboard_ctx = gameboard_canvas.getContext("2d");

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
    gameboardWidth = vizInit.getTestMode();
  }
  if (vizInit.hasGameboardHeight()) {
    gameboardHeight = vizInit.getTestMode();
  }
  explanations = vizInit.getExplanationsList();
  mm = buildEchoVizInitMultiMessage(vizInit);
  return mm;
}

function handleViz(vizData) {
  console.log('received Viz...');
  var entitiesList = vizData.getEntitiesList()
  console.log('entities count :' + entitiesList.length);
  for (var i in entitiesList) {
    var entity = entitiesList[i];

    if (entity.hasId()) {
      var idString = '' + entity.getId();
      if (idString == '8') {
        console.log('=========== UPDATING ENTITY ===================')
        logEntity(entity);
      }
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
  tryConnect('.', 0);
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
	$("#scaii-interface-title").html(systemTitle);
	
	$("#explanations-interface-title").css("font-family", "Fira Sans");
	$("#explanations-interface-title").css("font-size", "12px");
	$("#explanations-interface-title").css("padding-left", "6px");
	$("#explanations-interface-title").css("padding-top", "4px");
	$("#explanations-interface-title").css("text-align", "center");
	$("#explanations-interface-title").html("- Explanations -");
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
      var mm = handleVizInit(vizInit);
      var returnMessage = mm.serializeBinary();
      dealer.send(returnMessage);
    }
    else if (sPacket.hasViz()) {
      var viz = sPacket.getViz();
      handleViz(viz);
      var mm;
      if (testingMode) {
        mm = buildReturnMultiMessageFromState(masterEntities);
      }
      else {
        var userCommand = new proto.scaii.common.UserCommand;
        userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.NONE);
        mm = buildMultiMessageWithUserCommand(userCommand);
      }
      var returnMessage = mm.serializeBinary();
      dealer.send(returnMessage);
    }
    else {
      console.log('unexpected message from system!');
    }
  };
  dealer.onclose = function (closeEvent) {
    console.log("closefired " + attemptCount);
    if (sessionState == "pending") {
      // the closed connection was likely due to failed connection. try reconnecting
      setTimeout(function () { tryConnect(dots, attemptCount); }, 1500);
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