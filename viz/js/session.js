var testingMode = false;
var replaySessionConfig;
var replayChoiceConfig;
var currentStep = -1;
var maxStep = 0;
var selectedExplanationStep = undefined;

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

function handleReplayChoiceConfig(config){
	var replayNames = config.getReplayFilenamesList();
	for (var i in replayNames) {
		var name = replayNames[i];
		$("#replay-file-selector").append($('<option>', {
			value: i,
			text: name
		}));
	}
	loadSelectedReplayFile();
}

function loadSelectedReplayFile() {
	controlsManager.startLoadReplayFile();
	var chosenFile = $( "#replay-file-selector option:selected" ).text();
	console.log("chose " + chosenFile);
	var args = [chosenFile];
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.SELECT_FILE);
	userCommand.setArgsList(args);
	stageUserCommand(userCommand);
	drawExplanationTimeline();
	clearGameBoards();
	clearExplanationInfo();
}



function handleReplaySessionConfig(rsc, selectedStep) {
	if (rsc.hasStepCount()) {
		maxStep = rsc.getStepCount() - 1;
	}
	currentStep = 0;
	updateProgress(0, maxStep);
	renderExplanationSelectors(rsc, selectedStep);
}


function handleVizInit(vizInit) {
	if (vizInit.hasTestMode()) {
		if (vizInit.getTestMode()) {
			testingMode = true;
		}
	}
	// ignoring gameboard width and height, assume 40 x 40
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


function handleScaiiPacket(sPacket) {
	var result = undefined;
	if (sPacket.hasReplayChoiceConfig()) {
		var config = sPacket.getReplayChoiceConfig();
		replayChoiceConfig = config;
		handleReplayChoiceConfig(config);
	}
	else if (sPacket.hasReplaySessionConfig()) {
		console.log("-----got replaySessionConfig");
		var config = sPacket.getReplaySessionConfig();
		replaySessionConfig = config;
		//var selectedStep = undefined;
		handleReplaySessionConfig(config,undefined);
	}
	else if (sPacket.hasVizInit()) {
		console.log("-----got vizInit");
		var vizInit = sPacket.getVizInit();
		handleVizInit(vizInit);
		controlsManager.gameStarted();
	}
	else if (sPacket.hasViz()) {
		console.log("-----got Viz");
		var viz = sPacket.getViz();
		handleViz(viz);
		// we're moving forward so rewind should be enabled
		controlsManager.gameSteppingForward();
		if (testingMode) {
			result = buildReturnMultiMessageFromState(masterEntities);
		}
		else {
			result = new proto.scaii.common.MultiMessage;
		}
	}
	else if (sPacket.hasExplDetails()) {
		console.log('has expl details');
		var explDetails = sPacket.getExplDetails();
		handleExplDetails(explDetails);
	}
	else if (sPacket.hasReplayControl()) {
		console.log("-----got replayCOntrol");
		var replayControl = sPacket.getReplayControl();
		handleReplayControl(replayControl);
	}
	else if (sPacket.hasErr()) {
		console.log("-----got errorPkt");
		console.log(sPacket.getErr().getDescription())
	}
	else if (sPacket.hasUserCommand()) {
		var userCommand = sPacket.getUserCommand();
		var commandType = userCommand.getCommandType();
		if (commandType == proto.scaii.common.UserCommand.UserCommandType.POLL_FOR_COMMANDS) {
			//console.log("-----got pollForCommands");
			if (userCommandScaiiPackets.length > 0) {
				result = buildResponseToReplay(userCommandScaiiPackets);
				controlsManager.userCommandSent();
			}
			else {
				result = new proto.scaii.common.MultiMessage;
			}
			userCommandScaiiPackets = [];
		}
		else if (commandType == proto.scaii.common.UserCommand.UserCommandType.JUMP_COMPLETED) {
			console.log("-----got jump completed message");
			controlsManager.jumpCompleted();
		}
		else if (commandType == proto.scaii.common.UserCommand.UserCommandType.SELECT_FILE_COMPLETE){
			controlsManager.doneLoadReplayFile();
		}
	}
	else {
		console.log(sPacket.toString())
		console.log('unexpected message from system!');
	}
	return result;
}