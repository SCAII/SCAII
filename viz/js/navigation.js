var updateProgress = function(step, maxStep){
	var percentComplete = step / maxStep;
	var progressValue = percentComplete * 100;
	var progressString = "" + progressValue;
	$("#game-progress").attr("value", progressString);
}
var processTimelineClick = function(e){
	try {
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
	catch(err){
		alert(err.message);
	}
	
}
var stageUserCommand = function(userCommand){
	var scaiiPkt = new proto.scaii.common.ScaiiPacket;
	scaiiPkt.setUserCommand(userCommand);
	userCommandScaiiPackets.push(scaiiPkt);
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
var rewindGame = function(){
	pauseGame();
	try {
		controlsManager.userClickedRewind();
		//var userCommand1 = new proto.scaii.common.UserCommand;
		//userCommand1.setCommandType(proto.scaii.common.UserCommand.UserCommandType.PAUSE);
		//stageUserCommand(userCommand1);
		var userCommand2 = new proto.scaii.common.UserCommand;
		userCommand2.setCommandType(proto.scaii.common.UserCommand.UserCommandType.REWIND);
		stageUserCommand(userCommand2);
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
		this.priorStateRewindButton = "off";
		this.priorStatePauseResumeButton = "off";
		this.rewindButton.disabled = true;
		this.pauseResumeButton.disabled = true;
	}
	
	manager.gameStarted = function() {
		this.enableAllControls()
	}
	
	manager.userJumped = function() {
		this.saveCurrentStates();
		this.disableAllControls();
		// no pending action for this, re-enablingcontrols happenes when we get a JUMP_COMPLETED message from replay
	}
	manager.userClickedPause = function() {
		this.saveCurrentStates();
		this.disableAllControls();
		this.pendingAction = this.adjustToPauseClick;
	}
	
	manager.userClickedResume = function() {
		this.saveCurrentStates();
		this.disableAllControls();
		this.pendingAction = this.adjustToResumeClick;
	}
	
	manager.userClickedRewind = function() {
		this.saveCurrentStates();
		this.disableAllControls();
		this.pendingAction = this.adjustToRewindClick;
	}
	manager.jumpCompleted = function() {
		this.restorePriorStates();
		this.adjustToPauseClick(); // pause automatically engaged in Replay when jump completed.
	}
	manager.adjustToPauseClick = function(){
		this.pauseResumeButton.onclick = resumeGame;
		this.pauseResumeButton.innerHTML = '<img src="imgs/play.png", height="8px" width="10px"/>'; 
	}
	
	manager.adjustToRewindClick = function(){
		// since we sent pause command as first part of rewind, we need to show the play button 
		this.adjustToPauseClick();
		this.disableRewind();
		this.enablePauseResume();
	}
	
	manager.adjustToResumeClick = function(){
		this.pauseResumeButton.onclick = pauseGame;
		this.pauseResumeButton.innerHTML = '<img src="imgs/pause.png", height="8px" width="10px"/>'; 
		this.enableRewind();
	}
	manager.disablePauseResume = function() {
		console.log("disablin' pauseResume");
		this.pauseResumeButton.disabled = true;
	}
	
	manager.enablePauseResume = function(){
		console.log("enablin' pauseResume");
		this.pauseResumeButton.disabled = false;
	}
	
	manager.disableRewind = function() {
		this.rewindButton.disabled = true;
	}
	
	manager.enableRewind = function(){
		this.rewindButton.disabled = false;
	}
	
	manager.disableAllControls = function() {
		this.disableRewind();
		this.disablePauseResume();
	}
	
	manager.enableAllControls = function() {
		this.enableRewind();
		this.enablePauseResume();
	}
	
	manager.saveCurrentStates = function(){
		if (this.rewindButton.disabled){
			this.priorStateRewindButton = "off";
		}
		else {
			this.priorStateRewindButton = "on";
		}
		if (this.pauseResumeButton.disabled){
			this.priorStatePauseResumeButton = "off";
		}
		else {
			this.priorStatePauseResumeButton = "on";
		}
	}
	
	manager.userCommandSent = function() {
		this.restorePriorStates();
		if (this.pendingAction != undefined){
			this.pendingAction();
			this.pendingAction = undefined;
		}
	}
	
	manager.restorePriorStates = function(){
		this.resetControlToPriorState(this.rewindButton, this.priorStateRewindButton);
		this.resetControlToPriorState(this.pauseResumeButton, this.priorStatePauseResumeButton);
	}
	
	manager.resetControlToPriorState = function(control, priorState){
		if (priorState == "off") { control.disabled = true; }
		else { control.disabled = false; }
	}
	
	return manager
}