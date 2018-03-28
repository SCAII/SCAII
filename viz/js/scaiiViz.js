

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
// VizInit defaults
var testingMode = false;
var maxStep = 0;
var explanations = [];
var userCommandScaiiPackets = [];
var sessionState = "pending";
var currentStep = -1;

var gameScaleFactor = 6;
var spacingFactor = 1;
var sizingFactor = 1;
var zoomFactor = 3;
var zoomBoxOriginX = 0;
var zoomBoxOriginY = 0;
var entitiesList = undefined;
var shapePositionMapForContext = {};
var primaryHighlightedShapeIds = [];
var secondaryHighlightedShapeIds = [];
var explanationBoxMap = {};
var game_background_color = "#123456";
var explanationControlYPosition = 14;

// Create the gameboard canvas
var gameboard_canvas = document.createElement("canvas");
var gameboard_ctx = gameboard_canvas.getContext("2d");

var gameboard_zoom_canvas = document.createElement("canvas");
var gameboard_zoom_ctx = gameboard_zoom_canvas.getContext("2d");

var expl_ctrl_canvas = document.createElement("canvas");
var expl_ctrl_ctx = expl_ctrl_canvas.getContext("2d");
expl_ctrl_ctx.imageSmoothingEnabled = false;

var replaySessionConfig;
var selectedExplanationStep = undefined;

expl_ctrl_canvas.addEventListener('click', function (event) {
	var matchingStep = getMatchingExplanationStep(expl_ctrl_ctx, event.offsetX, event.offsetY);
	console.log('clicked on step ' + selectedExplanationStep);	
	if (matchingStep == selectedExplanationStep) {
		selectedExplanationStep = undefined;
		$("#saliency-maps").empty();
		$("#explanations-rewards").empty();
		$("#action-name-label").html(" ");
	}
	else {
		selectedExplanationStep = matchingStep;
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.EXPLAIN);
		var args = ['' +selectedExplanationStep];
		userCommand.setArgsList(args);
		stageUserCommand(userCommand);
		
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
		// same args as above
		userCommand.setArgsList(args);
		stageUserCommand(userCommand);
	}	
	
	handleReplaySessionConfig(replaySessionConfig,selectedExplanationStep);
});

gameboard_canvas.addEventListener('click', function (event) {
	if (event.shiftKey) {
		adjustZoomBoxPosition(event.offsetX, event.offsetY);
		handleEntities(entitiesList);
	}
	else {
		shapeId = getClosestInRangeShapeId(gameboard_ctx, event.offsetX, event.offsetY, shapePositionMapForContext["game"]);
		primaryHighlightedShapeIds = [];
		if (shapeId != undefined) {
			primaryHighlightedShapeIds.push(shapeId);
		}
		handleEntities(entitiesList);
	}

});
gameboard_zoom_canvas.addEventListener('click', function (event) {
	shapeId = getClosestInRangeShapeId(gameboard_zoom_ctx, event.offsetX, event.offsetY, shapePositionMapForContext["zoom"]);
	primaryHighlightedShapeIds = [];
	if (shapeId != undefined) {
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
var actionLabel = document.createElement("LABEL");
var actionNameLabel = document.createElement("LABEL");

var controlsManager = configureControlsManager(pauseResumeButton, rewindButton);
var shape_outline_color = '#202020';
var shape_outline_width = 2;
var use_shape_color_for_outline = false;

var dealer;
var masterEntities = {};


function adjustZoomBoxPosition(x, y) {
	// they clicked at new target for center of box.
	var boxWidth = gameboard_canvas.width / zoomFactor;
	var boxHeight = gameboard_canvas.height / zoomFactor;
	zoomBoxOriginX = x - boxWidth / 2;
	zoomBoxOriginY = y - boxHeight / 2;
	if (zoomBoxOriginX < 0) {
		zoomBoxOriginX = 0;
	}
	else if (zoomBoxOriginX > gameboard_canvas.width - boxWidth) {
		zoomBoxOriginX = gameboard_canvas.width - boxWidth;
	}
	else {
		// a-ok - they clicked in the middle somewhere
	}
	if (zoomBoxOriginY < 0) {
		zoomBoxOriginY = 0;
	}
	else if (zoomBoxOriginY > gameboard_canvas.height - boxHeight) {
		zoomBoxOriginY = gameboard_canvas.height - boxHeight;
	}
	else {
		// a-ok - they clicked in the middle somewhere
	}

}

function updateButtonsAfterJump() {
	if (currentStep == 0) {
		controlsManager.expressResumeButton();
		controlsManager.enablePauseResume();
		controlsManager.disableRewind();
	}
	else if (currentStep == 1) {
		controlsManager.expressResumeButton();
		controlsManager.enablePauseResume();
		controlsManager.enableRewind();
	}
	else if (currentStep == maxStep) {
		controlsManager.expressResumeButton();
		controlsManager.disablePauseResume();
		controlsManager.enableRewind();
	}
	else {
		controlsManager.expressResumeButton();
		controlsManager.enablePauseResume();
		controlsManager.enableRewind();
	}
}
function handleReplayControl(replayControl) {
	var command = replayControl.getCommandList();
	if (command.length == 2) {
		if (command[0] == 'set_step_position') {
			currentStep = parseInt(command[1]);
			console.log('replay control set step_position to ' + currentStep);
			updateProgress(currentStep, maxStep);
			updateButtonsAfterJump();
		}
	}
}
function handleReplaySessionConfig(rsc, selectedStep) {
	explanationBoxMap = {};
	if (rsc.hasStepCount()) {
		maxStep = rsc.getStepCount() - 1;
	}
	var explanation_steps = rsc.getExplanationStepsList();
	var explanation_titles = rsc.getExplanationTitlesList();
	console.log("explanation count is " + explanation_steps.length);
	var expl_count = explanation_steps.length;
	var index = 0;
	while (index < expl_count){
		var step = explanation_steps[index];
		var selected = false;
		if (selectedStep == step){
			selected = true;
		}
		var title = explanation_titles[index];
		configureExplanationControls(rsc.getStepCount(), step, title, selected);
		index = index + 1;
	}
}

function handleExplDetails(explDetails){
	console.log('handling expl details');
	if (explDetails.hasExplPoint()){
		explanationPoint = explDetails.getExplPoint();
		console.log('got expl point for step ' + explanationPoint.getStep());
		renderExplanationPoint(explanationPoint);
	}
	else {
		console.log("MISSING expl point!");
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
	// if (vizInit.hasGameboardWidth()) {
		// gameboardWidth = vizInit.getGameboardWidth();
		console.log("gameboard width : " + gameboardWidth);
		// $("#scaii-gameboard").css("width", gameboardWidth);
		// gameboard_canvas.width = gameboardWidth;
	// }
	// gameboard_zoom_canvas.width = gameboard_canvas.width;

	// if (vizInit.hasGameboardHeight()) {
		// gameboardHeight = vizInit.getGameboardHeight();
		// $("#scaii-gameboard").css("height", gameboardHeight);
		// gameboard_canvas.height = gameboardHeight;
	// }
	// gameboard_zoom_canvas.height = gameboard_canvas.height;
	//renderTimeline(maxStep);
}
function handleViz(vizData) {
	console.log('received Viz...');
	entitiesList = vizData.getEntitiesList();

	handleEntities(entitiesList);

	currentStep = currentStep + 1;

	if (currentStep == maxStep) {
		controlsManager.reachedEndOfGame();
	}
	console.log("current_step is " + currentStep + "maxStep is " + maxStep);
	updateProgress(currentStep, maxStep);
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
	renderState(gameboard_ctx, gameboard_canvas, masterEntities, gameScaleFactor, 0, 0, shapePositionMapForContext["game"]);
	// disable zoom box for now
	//drawZoomBox(gameboard_ctx, gameboard_canvas, zoomBoxOriginX, zoomBoxOriginY, zoomFactor);
	//renderState(gameboard_zoom_ctx, gameboard_zoom_canvas, masterEntities, zoomFactor, zoomBoxOriginX, zoomBoxOriginY, shapePositionMapForContext["zoom"]);
}

function drawZoomBox(ctx, canvas, originX, originY, zoom) {
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'white';
	var width = canvas.width / zoom;
	var height = canvas.height / zoom;
	ctx.rect(originX, originY, width, height);
	ctx.stroke();
	//ctx.strokeRect(originX, originY, height, width);
}
function clearGameBoard(ctx, canvas, shapePositionMapKey) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//gameboard_ctx.clearRect(0, 0, gameboard_canvas.width, gameboard_canvas.height);
	//gameboard_zoom_ctx.clearRect(0, 0, gameboard_zoom_canvas.width, gameboard_zoom_canvas.height);
	shapePositionMapForContext[shapePositionMapKey] = {};
}


function clearExplanationControl(){
	expl_ctrl_ctx.clearRect(0,0, expl_ctrl_canvas.width, expl_ctrl_canvas.height);
}

var draw_example_shapes = function () {
	clearGameBoard(gameboard_ctx, gameboard_canvas, "game");
	colorRGBA = getBasicColorRGBA();
	drawRect(gameboard_ctx, 100, 100, 80, 80, colorRGBA);
	drawTriangle(gameboard_ctx, 200, 200, 80, 'red');
}
var main = function () {
	initUI();

	//var redrawChartHiddenButton = document.createElement("BUTTON");
	//redrawChartHiddenButton.setAttribute("id", "chartRedrawTriggerButton");
	//redrawChartHiddenButton.appendChild(document.createTextNode("Refresh"));
	//$("#scaii-game-controls").append(redrawChartHiddenButton);
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
		$("#connectButton").css("margin-left", "30px");
		$("#connectButton").css("font-family", "Fira Sans");
		$("#connectButton").css("font-size", "14px");

	} else {
		tryConnect('.', 0);
	}

}
var configureSpeedSlider = function () {
	speedSlider.setAttribute("type", "range");
	speedSlider.setAttribute("min", "1");
	speedSlider.setAttribute("max", "100");
	speedSlider.setAttribute("value", "90");
	speedSlider.setAttribute("class", "slider");
	speedSlider.setAttribute("id", "speed-slider");
	speedSlider.setAttribute("orient","vertical");
	speedSlider.oninput = function () {
		var speedString = "" + this.value;
		var args = [speedString];
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.SET_SPEED);
		userCommand.setArgsList(args);
		stageUserCommand(userCommand);
	}
	//<input type="range" min="1" max="100" value="50" class="slider" id="myRange">
}
var configureZoomSlider = function () {
	zoomSlider.setAttribute("type", "range");
	zoomSlider.setAttribute("min", "100");
	zoomSlider.setAttribute("max", "600");
	zoomSlider.setAttribute("value", "200");
	zoomSlider.setAttribute("class", "slider");
	zoomSlider.setAttribute("id", "zoom-slider");
	zoomSlider.oninput = function () {
		zoomFactor = "" + this.value / 100;
		console.log("zoom factor " + zoomFactor);
		handleEntities(entitiesList);
	}
}
var configureLabelContainer = function(id, fontSize, textVal, textAlign) {
	$(id).css("font-family", "Fira Sans");
	$(id).css("font-size", fontSize);
	$(id).css("padding-left", "0px");
	$(id).css("padding-right", "4px");
	$(id).css("padding-top", "2px");
	$(id).css("text-align", textAlign);
	$(id).html(textVal);
}
var subtractPixels = function(a,b){
	var intA = a.replace("px", "");
	var intB = b.replace("px", "");
	return intA - intB;
}
var configureExplanationControl = function() {
	var container_width = $(".control-panel").css("width");
	var container_padding = $(".control-panel").css("padding-right");
	var can_width = subtractPixels(container_width,container_padding);
	
	expl_ctrl_canvas.width = can_width;
	expl_ctrl_canvas.height = 30;
	$("#explanation-control-panel").append(expl_ctrl_canvas);
	let ctx = expl_ctrl_ctx;
	
	ctx.beginPath();
	ctx.moveTo(0,explanationControlYPosition);
	ctx.lineTo(can_width,explanationControlYPosition);
	ctx.stroke();

	console.log("drawing explanation control");
	// expl_ctrl_canvas.background = 'red';
	// ctx.save();
	// var x = 0;
	// var y = 13;
	
	// var width = $("#replay-speed-panel").width();
	// var height = 4;
	
	// ctx.beginPath();

	// ctx.lineWidth = 1;
	// ctx.strokeStyle = 'black';
	// ctx.strokeRect(x, y, width, height);
	// ctx.fillStyle = 'white'
	//ctx.fillStyle = colorRGBA;
	// ctx.fillRect(x, y, width, height);
	ctx.restore();
}
var initUI = function () {
	configureSpeedSlider();
	configureZoomSlider();
	configureExplanationControl();
	controlsManager.setControlsNotReady();
	gameboard_canvas.width = 40 * gameScaleFactor;
	gameboard_canvas.height = 40 * gameScaleFactor;
	gameboard_zoom_canvas.width = gameboard_canvas.width;
	gameboard_zoom_canvas.height = gameboard_canvas.height;
	$("#scaii-gameboard").append(gameboard_canvas);
	$("#scaii-gameboard").css("width", gameboard_canvas.width);
	$("#scaii-gameboard").css("height", gameboard_canvas.height);
	$("#scaii-gameboard").css("background-color", game_background_color);

	$("#scaii-gameboard-zoom").append(gameboard_zoom_canvas);
	$("#scaii-gameboard-zoom").css("width", gameboard_zoom_canvas.width);
	$("#scaii-gameboard-zoom").css("height", gameboard_zoom_canvas.height);
	$("#scaii-gameboard-zoom").css("background-color", game_background_color);

	configureLabelContainer("#replay-speed-label","14px","replay speed", "right");
	configureLabelContainer("#progress-label","14px","progress", "right");
	configureLabelContainer("#explanation-control-label","14px","explanations", "right");
	configureLabelContainer("#playback-label","14px","", "right");
	
	$("#replay-speed-panel").append(speedSlider);

	rewindButton.setAttribute("class", "playbackButton");
	rewindButton.innerHTML = '<img src="imgs/rewind.png", height="8px" width="10px"/>';
	rewindButton.onclick = tryRewind;
	$("#playback-panel").append(rewindButton);

	$("#scaii-game-controls").css("text-align", "center");

	pauseResumeButton.setAttribute("class", "playbackButton");
	pauseResumeButton.innerHTML = '<img src="imgs/pause.png", height="8px" width="10px"/>';

	$("#playback-panel").append(pauseResumeButton);
	pauseResumeButton.onclick = tryPause;



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
	actionLabel.setAttribute("id", "action-label");
	$("#action-label-div").append(actionLabel);
	$("#action-label").html("action");
	actionNameLabel.setAttribute("id", "action-name-label");
	$("#action-name-div").append(actionNameLabel);
	$("#action-name-label").html(" ");
}
function clearGameBoards() {
	clearGameBoard(gameboard_ctx, gameboard_canvas, "game");
	clearGameBoard(gameboard_zoom_ctx, gameboard_zoom_canvas, "zoom");
}
function drawExplanationBox(step, type) {
	var stepNumber = Number.parseInt(step);
	var startX = 10 + step * 4;
	var startY = 10;
	timeline_ctx.moveTo(startX, startY);
	timeline_ctx.lineTo(startX - 7, startY - 7);
	timeline_ctx.lineTo(startX + 7, startY - 7);
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
	//$("#scaii-interface-title").html(systemTitle + " (... connecting " + attemptCount + " " + dots + ")");
	//gameboard_ctx.fillText("connecting  " + attemptCount + " " + dots, 10, 50);
	connect(dots, attemptCount);
}
var drawExplanationBarChart = function () {


	var options = {
		//legend: { position: "none" },
		title: 'Population of Largest U.S. Cities',
		chartArea: { width: '50%' },
		hAxis: {
			title: 'Total Population',
			minValue: 0
		},
		vAxis: {
			title: 'City'
		},
		'width': 600,
		'height': 400
	};
	var chartData = [
		['Decision', 'r1', 'r2'],
		['unit victorious', 0.77, 0.4],
		['unit loses', -0.39, 0.6],
		['adversary flees', 0.2, 0.3]
	];
	drawBarChart(chartData, options);
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
			if (sPacket.hasReplaySessionConfig()) {
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