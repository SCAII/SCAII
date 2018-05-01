var jumpInProgress = false;
var userInputBlocked = false;

function paintProgress(value) {
	var progressString = "" + value;
	$("#game-progress").attr("value", progressString);
}
function tryProcessTimelineClick(e) {
	try {
		if (!userInputBlocked) {
			processTimelineClick(e);
		}
	}
	catch (err) {
		alert(err.message);
	}
}
function processTimelineClick(e) {
	controlsManager.userJumped();
	var clickX = e.offsetX;
	var replaySequenceTargetStep = sessionIndexManager.getReplaySequencerIndexForClick(clickX);
	var targetStepString = "" + replaySequenceTargetStep;
	var args = [targetStepString];
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
	userCommand.setArgsList(args);
	stageUserCommand(userCommand);
}
function stageUserCommand(userCommand) {
	var scaiiPkt = new proto.scaii.common.ScaiiPacket;
	scaiiPkt.setUserCommand(userCommand);
	userCommandScaiiPackets.push(scaiiPkt);
}
var tryPause = function () {
	if (!userInputBlocked) {
		pauseGame();
	}
}
function pauseGame() {
	try {
		controlsManager.userClickedPause();
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.PAUSE);
		stageUserCommand(userCommand);
	}
	catch (err) {
		alert(err.message);
	}
}

var tryResume = function () {
	if (!userInputBlocked) {
		resumeGame();
	}
}

function resumeGame() {
	try {
		controlsManager.userClickedResume();
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.RESUME);
		stageUserCommand(userCommand);
	}
	catch (err) {
		alert(err.message);
	}
}

var tryRewind = function () {
	if (!userInputBlocked) {
		rewindGame();
	}
}
function rewindGame() {
	pauseGame();
	try {
		controlsManager.userClickedRewind();
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.REWIND);
		stageUserCommand(userCommand);
	}
	catch (err) {
		alert(err.message);
	}
}
var configureControlsManager = function (pauseResumeButton, rewindButton) {
	var manager = {};
	manager.registeredItems = [];
	manager.pendingAction = undefined;
	manager.pauseResumeButton = pauseResumeButton;
	manager.rewindButton = rewindButton;

	manager.registerJQueryHandleForWaitCursor = function(item) {
		manager.registeredItems.push(item)
	}
	manager.setControlsNotReady = function () {
		userInputBlocked = true;
	}

	manager.gameStarted = function () {
		userInputBlocked = false;
		this.enableAllControls();
	}

	manager.startLoadReplayFile = function () {
		userInputBlocked = true;
		this.expressResumeButton();
		this.disablePauseResume();
		this.disableRewind();
		this.setWaitCursor();
	}
	
	manager.doneLoadReplayFile = function () {
		userInputBlocked = false;
		this.enablePauseResume();
		this.enableRewind();
		this.clearWaitCursor();
	}
	
	manager.gameSteppingForward = function () {
		this.enableRewind();
	}
	
	manager.reachedEndOfGame = function () {
		this.expressResumeButton();
		this.disablePauseResume();
	}

	manager.setWaitCursor = function () {
		for (var i in this.registeredItems){
			var item = this.registeredItems[i];
			item.css("cursor", "wait");
		}
	}
	
	manager.clearWaitCursor = function () {
		for (var i in this.registeredItems){
			var item = this.registeredItems[i];
			item.css("cursor", "default");
		}
	}
	//
	//   JUMP
	//
	manager.userJumped = function () {
		jumpInProgress = true;
		userInputBlocked = true;
		// no pending action for this, re-enablingcontrols happenes when we get a JUMP_COMPLETED message from replay
	}

	manager.jumpCompleted = function () {
		jumpInProgress = false;
		userInputBlocked = false;
		//this.expressResumeButton(); // pause automatically engaged in Replay when jump completed.
		//this.enablePauseResume();
	}

	//
	//  pause
	//
	manager.userClickedPause = function () {
		userInputBlocked = true;
		this.pendingAction = this.expressResumeButton;
	}

	manager.expressResumeButton = function () {
		//console.log('expressing RESUME button');
		this.pauseResumeButton.onclick = tryResume;
		this.pauseResumeButton.innerHTML = '<img src="imgs/play.png", height="16px" width="14px"/>';
	}

	//
	//  resume
	//

	manager.userClickedResume = function () {
		userInputBlocked = true;
		this.pendingAction = this.expressPauseButton;
	}

	manager.expressPauseButton = function () {
		//console.log('expressing PAUSE button');
		this.pauseResumeButton.onclick = tryPause;
		this.pauseResumeButton.innerHTML = '<img src="imgs/pause.png", height="16px" width="14px"/>';
	}

	//
	// rewind
	//
	manager.userClickedRewind = function () {
		userInputBlocked = true;
		this.pendingAction = this.adjustToRewindClick;
	}

	manager.adjustToRewindClick = function () {
		// since we sent pause command as first part of rewind, we need to show the play button 
		this.expressResumeButton();
		this.disableRewind();
		this.enablePauseResume();
		//console.log('enabled pauseResume after adjustToRewindClick');
	}

	//
	//  enabling/disabling
	//
	manager.disablePauseResume = function () {
		//console.log("disablin' pauseResume");
		$("#pauseResumeButton").css("opacity", "0.6");
		this.pauseResumeButton.disabled = true;
	}

	manager.enablePauseResume = function () {
		//console.log("enablin' pauseResume");
		$("#pauseResumeButton").css("opacity", "1.0");
		this.pauseResumeButton.disabled = false;
	}

	manager.disableRewind = function () {
		//console.log("disablin' rewind");
		$("#rewindButton").css("opacity", "0.6");
		this.rewindButton.disabled = true;
	}

	manager.enableRewind = function () {
		//console.log("enablin' rewind");
		$("#rewindButton").css("opacity", "1.0");
		this.rewindButton.disabled = false;
	}

	manager.enableAllControls = function () {
		this.enableRewind();
		this.enablePauseResume();
	}

	//
	//  do any pending action
	//
	manager.userCommandSent = function () {
		//this.restorePriorStates();
		if (this.pendingAction != undefined) {
			this.pendingAction();
		}
		userInputBlocked = false;
	}

	return manager;
}


function updateButtonsAfterJump() {
	if (sessionIndexManager.isAtGameStart()) {
		controlsManager.expressResumeButton();
		controlsManager.enablePauseResume();
		controlsManager.disableRewind();
	}
	else if (sessionIndexManager.isAtTimelineStepOne()) {
		controlsManager.expressResumeButton();
		controlsManager.enablePauseResume();
		controlsManager.enableRewind();
	}
	else if (sessionIndexManager.isAtEndOfGame()) {
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
