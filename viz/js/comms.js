var dealer;
var sessionState = "pending";
var userCommandScaiiPackets = [];


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
