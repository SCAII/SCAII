var testingMode = false;
var replaySessionConfig;
var replayChoiceConfig;
var selectedExplanationStep = undefined;
var sessionIndexManager = undefined;

// ToDo - when strat jump- turn off incrementing index until receive set position.  Unblock incrementing on jump complete
// then it will be apparent if we need to correct for ReplaySequencer's index pointing to next-packet-to-send rather than 
// current packet in hand
function getSessionIndexManager(stepSizeAsKnownInReplaySequencer, progressWidth) {
	var sim = {};
	sim.replaySequencerIndex  = 0;
	sim.replaySequencerMaxIndex = stepSizeAsKnownInReplaySequencer - 1;
	sim.progressWidth = progressWidth;
	
	// progress bar is divided up in stepSizeAsKnownInReplaySequencer - 1 pieces
	// because the first chunk of that we want to correspond to ReplaySequencer.scaii_pkts[1]
	// since ReplaySequencer.scaii_pkts[0] corresponds to the initial state (prior to first "step")
	var progressBarSegmentCount = stepSizeAsKnownInReplaySequencer - 1;
	sim.progressBarSegmentCount = progressBarSegmentCount
	sim.getStepCountToDisplay = function(){
		if (this.replaySequencerIndex == 0) {
			return undefined;
		}
		else {
			// from one on up, the actual replaySequencerIndex will be what we want to display 
			// as we are presenting the step sequence as starting at 1.
			return this.replaySequencerIndex;
		}
	}
	
	sim.isAtGameStart = function() {
		return (this.replaySequencerIndex == 0);
	}
	
	sim.isAtTimelineStepOne = function() {
		return (this.replaySequenceIndex == 1);
	}
	sim.getReplaySequencerIndexForClick = function(xIndexOfClick){
		var percent = xIndexOfClick/this.progressWidth;
		// example, click 65% -> 6.5 -> 6  -> add one for UI render -> 7  so clicking on segment 7 of 10
		var replaySequenceTargetStep = Math.floor(this.progressBarSegmentCount * percent) + 1;
		console.log('calculated replaySequenceTargetStep as ' + replaySequenceTargetStep);
		return replaySequenceTargetStep;
	}
	
	sim.setReplaySequencerIndex = function(index) {
		this.replaySequencerIndex = index;
		console.log('');
		console.log('');
		console.log('replaySequencerIndex is now ' + index);
		console.log('');
		console.log('');
		var displayVal = this.getStepCountToDisplay();
		if (displayVal == undefined){
			$("#step-value").html(this.progressBarSegmentCount + " steps");
		}
		else {
			$("#step-value").html('' + displayVal + ' / ' + this.progressBarSegmentCount);
		}
		paintProgress(this.getProgressBarValue());
	}
	
	sim.getProgressBarValue = function() {
		var value = Math.floor((this.replaySequencerIndex / this.replaySequencerMaxIndex ) * 100);
		console.log('progress value to paint: ' + value);
		return value;
	}
	
	sim.getCurrentIndex = function() {
		return this.replaySequencerIndex;
	}

	sim.incrementReplaySequencerIndex = function() {
		this.setReplaySequencerIndex(this.replaySequencerIndex + 1);
	}
	sim.isAtEndOfGame = function(){
		if (this.replaySequencerIndex == this.replaySequencerMaxIndex) {
			return true;
		} 
		return false;
	}
	return sim;
}

function handleReplayControl(replayControl) {
	var command = replayControl.getCommandList();
	if (command.length == 2) {
		if (command[0] == 'set_step_position') {
			console.log('___set_step_position updating step from handleReplayControl to ' + command[1] + ' which should be one prior to what the first viz packet arriving will set it to');
			sessionIndexManager.setReplaySequencerIndex(parseInt(command[1]));
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
	console.log("    file selected: " + chosenFile);
	var args = [chosenFile];
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.SELECT_FILE);
	userCommand.setArgsList(args);
	stageUserCommand(userCommand);
	$("#action-list").empty();
	$("#explanation-control-panel").empty();
	drawExplanationTimeline();
	clearGameBoards();
	clearExplanationInfo();
}



function handleReplaySessionConfig(rsc, selectedStep) {
	if (!rsc.hasStepCount()) {
		dialog('Error no stepCount carried by ReplaySessionConfig');
	}
	var progressWidth = $("#game-progress").width();
	sessionIndexManager = getSessionIndexManager(rsc.getStepCount(), progressWidth);

	sessionIndexManager.setReplaySequencerIndex(0);
	renderExplanationSelectors(rsc, selectedStep);
}


function handleVizInit(vizInit) {
	$("#connectButton").remove();
	if (vizInit.hasTestMode()) {
		if (vizInit.getTestMode()) {
			testingMode = true;
		}
	}
	// ignoring gameboard width and height, assume 40 x 40
}
function handleViz(vizData) {
	entitiesList = vizData.getEntitiesList();
	handleEntities(entitiesList);
	if (!jumpInProgress) {
		sessionIndexManager.incrementReplaySequencerIndex();
		console.log('');
		console.log('___Viz called incrementReplaySequencerIndex');
	}
	if (sessionIndexManager.isAtEndOfGame()) {
		controlsManager.reachedEndOfGame();
	}
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