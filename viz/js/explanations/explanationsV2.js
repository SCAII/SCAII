var currentChartV2 = undefined;
var currentExplanationStep = undefined;

function handleExplanationDetails(explDetails){
	if (explDetails.hasExplPoint()){
        explanationPoint = explDetails.getExplPoint();
        var barChartMessage = explanationPoint.getBarChart();
        var rawChart = convertProtobufChartToJSChart(barChartMessage);
        //ignore true data for testing
        //currentChartV2.setChartData(getSeeSawChart());
        currentChartV2.setChartData(rawChart);
        currentChartV2.render();
	}
	else {
		console.log("MISSING expl point!");
	}
}


function askBackendForExplanationRewardInfo(stepNumber) {
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.EXPLAIN);
	var args = ['' +stepNumber];
	userCommand.setArgsList(args);
	stageUserCommand(userCommand);
	currentExplanationStep = stepNumber;
	if (stepNumber == sessionIndexManager.getCurrentIndex()) {
		//console.log("no need to move - already at step with explanation");
	}
	else {
		jumpToStep(newStep);
	}
}

function renderWhyButton(step, x, y){
    $("#why-button").remove();
    var whyButton = document.createElement("BUTTON");
    var buttonId = "why-button";
    whyButton.setAttribute("id", buttonId);
    var why = document.createTextNode("why?");
    whyButton.appendChild(why);          
    whyButton.setAttribute("style", 'z-index:' + zIndexMap["whyButton"] + ';position:relative;left:' + x + 'px;top:' + y + 'px;font-family:Arial;');
    $("#explanation-control-panel").append(whyButton);
    $("#" + buttonId).click(function(e) {
        if (currentChartV2.chartVisible) {
            var logLine = templateMap["hideWhy"];
            logLine = logLine.replace("<HIDE_WHY>", "NA");
            targetClickHandler(e, logLine);
        }
        else {
            var logLine = templateMap["showWhy"];
            logLine = logLine.replace("<SHW_WHY>", "NA");
            targetClickHandler(e, logLine);
        }
        
        e.preventDefault();
        processWhyClick(step);
    })
}