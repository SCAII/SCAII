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
		if (replaySequenceTargetStep > this.replaySequencerMaxIndex) {
			replaySequenceTargetStep = this.replaySequencerMaxIndex;
		}
		//console.log('calculated replaySequenceTargetStep as ' + replaySequenceTargetStep);
		return replaySequenceTargetStep;
	}
	
	sim.setReplaySequencerIndex = function(index) {
		$("#why-button").remove();
		this.replaySequencerIndex = index;
		//console.log('');
		//console.log('');
		//console.log('replaySequencerIndex is now ' + index);
		//console.log('');
		//console.log('');
		var displayVal = this.getStepCountToDisplay();
		if (displayVal == undefined){
			$("#step-value").html('');
			//$("#step-value").html(this.progressBarSegmentCount + " steps");
		}
		else {
			$("#step-value").html('step ' + displayVal + ' / ' + this.progressBarSegmentCount);
		}
		paintProgress(this.getProgressBarValue());
	}
	
	sim.getProgressBarValue = function() {
		var value = Math.floor((this.replaySequencerIndex / this.replaySequencerMaxIndex ) * 100);
		//console.log('progress value to paint: ' + value);
		return value;
	}
	
	sim.getPercentIntoGameForStep = function(step){
		var value = Math.floor((step / this.replaySequencerMaxIndex ) * 100);
		return value;
	}
	sim.getCurrentIndex = function() {
		return this.replaySequencerIndex;
	}

	sim.incrementReplaySequencerIndex = function() {
		if (Number(Number(this.replaySequencerIndex) + Number(1)) <= this.replaySequencerMaxIndex) {
			this.setReplaySequencerIndex(this.replaySequencerIndex + 1);
		}
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
			//console.log('___set_step_position updating step from handleReplayControl to ' + command[1] + ' which should be one prior to what the first viz packet arriving will set it to');
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
	//console.log("    file selected: " + chosenFile);
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
    if (rsc.getSuppressInteractivity()) {
        liveModeInputBlocked = true;
    }
	var timelineWidth = expl_ctrl_canvas.width - 2*timelineMargin;
	sessionIndexManager = getSessionIndexManager(rsc.getStepCount(), timelineWidth);
	sessionIndexManager.setReplaySequencerIndex(0);
	renderDecisionPointLegend();
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
	cumulativeRewardsMap = vizData.getCumulativeRewardsMap();
	handleCumulativeRewards(cumulativeRewardsMap);
	handleEntities(entitiesList);
	if (!jumpInProgress) {
		sessionIndexManager.incrementReplaySequencerIndex();
	}
	if (sessionIndexManager.isAtEndOfGame()) {
		controlsManager.reachedEndOfGame();
	}
}
var totalsString = "total HP";
var rewardsDivMap = {};
function handleCumulativeRewards(crm) {
	var entryList = crm.getEntryList();
	var total = 0;
	//compute totals
	for (var i in entryList ){
    	var entry = entryList[i];
		var val = entry[1];
		total = Number(total) + Number(val);
	}
	var valId = getRewardValueId(totalsString);
	var idOfExistingTotalLabel = rewardsDivMap[valId];
	if (idOfExistingTotalLabel == undefined) {
		addCumRewardPair(0, totalsString, total);
	}
	else {
		$("#" + valId).html(total);
	}  
	// add individual values
  	for (var i in entryList ){
    	var entry = entryList[i];
    	var key = entry[0];
		var val = entry[1];
		var valId = getRewardValueId(key);
		var idOfExistingValueLabel = rewardsDivMap[valId];
		if (idOfExistingValueLabel == undefined) {
			var indexInt = Number(i+1);
			addCumRewardPair(indexInt, key, val);
		}
		else {
			$("#" + valId).html(val);
		}
  	}
}

function getRewardValueId(val) {
	var legalIdVal = convertNameToLegalId(val);
	return 'reward'+legalIdVal;
}

function addCumRewardPair(index, key, val){
	var rewardKeyDiv = document.createElement("DIV");
	rewardKeyDiv.setAttribute("class", "r" + index +"c0");
	if (key == totalsString){
		rewardKeyDiv.setAttribute("style", "height:15px;font-family:Arial;font-size:14px;font-weight:bold;");
	}
	else {
		rewardKeyDiv.setAttribute("style", "height:15px;font-family:Arial;font-size:14px;");
	}
	
	rewardKeyDiv.innerHTML = key;
	$("#cumulative-rewards").append(rewardKeyDiv);

	var rewardValDiv = document.createElement("DIV");
	// give the value div an id constructed with key so can find it later to update
	var id = getRewardValueId(key);
	rewardsDivMap[id] = rewardValDiv;
	rewardValDiv.setAttribute("id", id);
	rewardValDiv.setAttribute("class", "r" + index +"c1");
	if (key == totalsString){
		rewardValDiv.setAttribute("style", "margin-left: 20px;height:15px;font-family:Arial;font-size:14px;font-weight:bold");
	}
	else {
		rewardValDiv.setAttribute("style", "margin-left: 20px;height:15px;font-family:Arial;font-size:14px;");
	}
	
	rewardValDiv.innerHTML = val;
    $("#cumulative-rewards").append(rewardValDiv);
}

function handleScaiiPacket(sPacket) {
	var result = undefined;
	if (sPacket.hasReplayChoiceConfig()) {
		var config = sPacket.getReplayChoiceConfig();
		replayChoiceConfig = config;
		rewardsDivMap = {};
		handleReplayChoiceConfig(config);
	}
	else if (sPacket.hasReplaySessionConfig()) {
		//console.log("-----got replaySessionConfig");
		var config = sPacket.getReplaySessionConfig();
		replaySessionConfig = config;
		//var selectedStep = undefined;
		handleReplaySessionConfig(config,undefined);
	}
	else if (sPacket.hasVizInit()) {
		//console.log("-----got vizInit");
		var vizInit = sPacket.getVizInit();
		handleVizInit(vizInit);
		controlsManager.gameStarted();
	}
	else if (sPacket.hasViz()) {
		//console.log("-----got Viz");
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
		//console.log('has expl details');
		var explDetails = sPacket.getExplDetails();
		handleExplDetails(explDetails);
	}
	else if (sPacket.hasReplayControl()) {
		//console.log("-----got replayCOntrol");
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
			//console.log("-----got jump completed message");
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