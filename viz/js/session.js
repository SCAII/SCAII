var testingMode = false;

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
