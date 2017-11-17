var updateProgress = function(step, stepCount){
	var percentComplete = step / (stepCount - 1);// because it will be 0 to stepCount - 1
	var progressValue = percentComplete * 100;
	var progressString = "" + progressValue;
	$("#game-progress").attr("value", progressString);
}
var pauseGame = function(){
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.PAUSE);
	var scaiiPkt = new proto.scaii.common.ScaiiPacket;
    scaiiPkt.setUserCommand(userCommand);
	userCommandScaiiPackets.push(scaiiPkt);
	pauseButton.onclick = resumeGame;
	pauseButton.innerHTML = '<img src="imgs/play.png", height="8px" width="10px"/>'; 
	//mm = buildMultiMessageWithUserCommand(userCommand);
	//dealer.send(mm.serializeBinary());
}
var resumeGame = function(){
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.RESUME);
	var scaiiPkt = new proto.scaii.common.ScaiiPacket;
    scaiiPkt.setUserCommand(userCommand);
	userCommandScaiiPackets.push(scaiiPkt);
	pauseButton.onclick = pauseGame;
	pauseButton.innerHTML = '<img src="imgs/pause.png", height="8px" width="10px"/>'; 
}