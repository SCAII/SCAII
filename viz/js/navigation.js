var updateProgress = function(step, maxStep){
	var percentComplete = step / maxStep;
	var progressValue = percentComplete * 100;
	var progressString = "" + progressValue;
	$("#game-progress").attr("value", progressString);
}
var processTimelineClick = function(e){
	try {
		if (!userInputBlocked){
			controlsManager.userJumped();
			var clickX = e.offsetX;
			var width = $("#game-progress").width();
			var percent = clickX / width;
			var targetStepCount = Math.floor(maxStep * percent);
			var targetStepCountString = "" + targetStepCount;
			var args = [ targetStepCountString ];
			var userCommand = new proto.scaii.common.UserCommand;
			userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
			userCommand.setArgsList(args);
			stageUserCommand(userCommand);
		}
	}
	catch(err){
		alert(err.message);
	}
}
var stageUserCommand = function(userCommand){
	var scaiiPkt = new proto.scaii.common.ScaiiPacket;
	scaiiPkt.setUserCommand(userCommand);
	userCommandScaiiPackets.push(scaiiPkt);
}
var tryPause = function() {
	if (!userInputBlocked){
		pauseGame();
	}
}
var pauseGame = function(){
	try {
		controlsManager.userClickedPause();
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.PAUSE);
		stageUserCommand(userCommand);
	}
	catch(err){
		alert(err.message);
	}
}

var tryResume = function() {
	if (!userInputBlocked){
		resumeGame();
	}
}

var resumeGame = function(){
	try {
		controlsManager.userClickedResume();
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.RESUME);
		stageUserCommand(userCommand);
	}
	catch(err){
		alert(err.message);
	}
}

var tryRewind = function() {
	if (!userInputBlocked){
		rewindGame();
	}
}
var rewindGame = function(){
	pauseGame();
	try {
		controlsManager.userClickedRewind();
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.REWIND);
		stageUserCommand(userCommand);
	}
	catch(err){
		alert(err.message);
	}
}
var configureControlsManager = function(pauseResumeButton, rewindButton){
	var manager = {};
	manager.pendingAction = undefined;
	manager.pauseResumeButton = pauseResumeButton;
	manager.rewindButton = rewindButton;
	
	manager.setControlsNotReady = function() {
		userInputBlocked = true;
	}
	
	manager.gameStarted = function() {
		userInputBlocked = false;
		this.enableAllControls()
	}
	
	manager.gameSteppingForward = function(){
		this.enableRewind();
	}
	manager.reachedEndOfGame = function() {
		this.expressResumeButton();
		this.disablePauseResume();
	}
	
	//
	//   JUMP
	//
	manager.userJumped = function() {
		userInputBlocked = true;
		// no pending action for this, re-enablingcontrols happenes when we get a JUMP_COMPLETED message from replay
	}
	
	manager.jumpCompleted = function() {
		userInputBlocked = false;
		this.expressResumeButton(); // pause automatically engaged in Replay when jump completed.
		this.enablePauseResume();
	}
	
	//
	//  pause
	//
	manager.userClickedPause = function() {
		userInputBlocked = true;
		this.pendingAction = this.expressResumeButton;
	}
	
	manager.expressResumeButton = function(){
		this.pauseResumeButton.onclick = tryResume;
		this.pauseResumeButton.innerHTML = '<img src="imgs/play.png", height="8px" width="10px"/>'; 
	}
	
	//
	//  resume
	//
	
	manager.userClickedResume = function() {
		userInputBlocked = true;
		this.pendingAction = this.expressPauseButton;
	}
	
	manager.expressPauseButton = function(){
		this.pauseResumeButton.onclick = tryPause;
		this.pauseResumeButton.innerHTML = '<img src="imgs/pause.png", height="8px" width="10px"/>'; 
	}
	
	//
	// rewind
	//
	manager.userClickedRewind = function() {
		userInputBlocked = true;
		this.pendingAction = this.adjustToRewindClick;
	}
	
	manager.adjustToRewindClick = function(){
		// since we sent pause command as first part of rewind, we need to show the play button 
		this.expressResumeButton();
		this.disableRewind();
		this.enablePauseResume();
	}
	
	//
	//  enabling/disabling
	//
	manager.disablePauseResume = function() {
		console.log("disablin' pauseResume");
		$("#pauseResumeButton").css("opacity", "0.6");
		this.pauseResumeButton.disabled = true;
	}
	
	manager.enablePauseResume = function(){
		console.log("enablin' pauseResume");
		$("#pauseResumeButton").css("opacity", "1.0");
		this.pauseResumeButton.disabled = false;
	}
	
	manager.disableRewind = function() {
		console.log("disablin' rewind");
		$("#rewindButton").css("opacity", "0.6");
		this.rewindButton.disabled = true;
	}
	
	manager.enableRewind = function(){
		console.log("enablin' rewind");
		$("#rewindButton").css("opacity", "1.0");
		this.rewindButton.disabled = false;
	}
	
	manager.enableAllControls = function() {
		this.enableRewind();
		this.enablePauseResume();
	}
	
	//
	//  do any pending action
	//
	manager.userCommandSent = function() {
		//this.restorePriorStates();
		if (this.pendingAction != undefined){
			this.pendingAction();
		}
		userInputBlocked = false;
	}
	
	return manager;
}