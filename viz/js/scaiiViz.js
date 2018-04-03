

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
goog.require('proto.scaii.common.ExplanationPoint');
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
//check2
var maxStep = 0;
var userCommandScaiiPackets = [];
var sessionState = "pending";
var currentStep = -1;
var explanationControlYPosition = 14;


var replaySessionConfig;
var replayChoiceConfig;
var selectedExplanationStep = undefined;
var fullPathMap = {};

var actionLabel = document.createElement("LABEL");
var actionNameLabel = document.createElement("LABEL");

var controlsManager = configureControlsManager(pauseResumeButton, rewindButton);
var shape_outline_color = '#202020';
var shape_outline_width = 2;
var use_shape_color_for_outline = false;

var dealer;
var masterEntities = {};

var main = function () {
	initUI();
	var debug = true;
	if (debug) {
		var connectButton = document.createElement("BUTTON");
		var connectText = document.createTextNode("Start Replay");
		connectButton.setAttribute("class", "connectButton");
		connectButton.setAttribute("id", "connectButton");
		connectButton.appendChild(connectText);
		connectButton.onclick = function () {
			console.log("calling tryConnect");
			tryConnect('.', 0);
		};
		$("#playback-panel").append(connectButton);
		$("#connectButton").css("font-size", "14px");
	} else {
		tryConnect('.', 0);
	}
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
	//$("#scaii-interface-title").html(systemTitle + " (... connecting " + attemptCount + " " + dots + ")");
	//gameboard_ctx.fillText("connecting  " + attemptCount + " " + dots, 10, 50);
	connect(dots, attemptCount);
}

var ack = function(dealer){
	var mm = new proto.scaii.common.MultiMessage;
	dealer.send(mm.serializeBinary());
}

var connect = function (dots, attemptCount) {
	dealer = new WebSocket('ws://localhost:6112');

	dealer.binaryType = 'arraybuffer';
	dealer.onopen = function (event) {
		//$("#scaii-interface-title").html(systemTitle);
		console.log("WS Opened.");
	};

	dealer.onmessage = function (message) {
		try {
			sessionState = "inProgress";
			var s = message.data;
			var sPacket = proto.scaii.common.ScaiiPacket.deserializeBinary(s);
			if (sPacket.hasReplayChoiceConfig()) {
				var config = sPacket.getReplayChoiceConfig();
				replayChoiceConfig = config;
				handleReplayChoiceConfig(config);
				ack(dealer);
			}
			else if (sPacket.hasReplaySessionConfig()) {
				console.log("-----got replaySessionConfig");
				var config = sPacket.getReplaySessionConfig();
				replaySessionConfig = config;
				//var selectedStep = undefined;
				handleReplaySessionConfig(config,undefined);
				ack(dealer);
			}
			else if (sPacket.hasVizInit()) {
				console.log("-----got vizInit");
				var vizInit = sPacket.getVizInit();
				handleVizInit(vizInit);
				controlsManager.gameStarted();
				ack(dealer);
			}
			else if (sPacket.hasViz()) {
				console.log("-----got Viz");
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
			else if (sPacket.hasExplDetails()) {
				console.log('has expl details');
				var explDetails = sPacket.getExplDetails();
				handleExplDetails(explDetails);
				ack(dealer);
			}
			else if (sPacket.hasReplayControl()) {
				console.log("-----got replayCOntrol");
				var replayControl = sPacket.getReplayControl();
				handleReplayControl(replayControl);
				ack(dealer);
			}
			else if (sPacket.hasErr()) {
				console.log("-----got errorPkt");
				console.log(sPacket.getErr().getDescription())
				ack(dealer);
			}
			else if (sPacket.hasUserCommand()) {
				var userCommand = sPacket.getUserCommand();
				var commandType = userCommand.getCommandType();
				if (commandType == proto.scaii.common.UserCommand.UserCommandType.POLL_FOR_COMMANDS) {
					//console.log("-----got pollForCommands");
					var mm;
					if (userCommandScaiiPackets.length > 0) {
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
					console.log("-----got jump completed message");
					controlsManager.jumpCompleted();
					ack(dealer);
				}
				else if (commandType == proto.scaii.common.UserCommand.UserCommandType.SELECT_FILE_COMPLETE){
					controlsManager.doneLoadReplayFile();
					ack(dealer);
				}
			}
			else {
				console.log(sPacket.toString())
				console.log('unexpected message from system!');
				ack(dealer);
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