
var explanationPointBigDiamondHalfWidth = 22;
var explanationPointSmallDiamondHalfWidth = 16;

function renderExplanationSelectors() {
	var explanation_steps = replaySessionConfig.getExplanationStepsList();
	var expl_count = explanation_steps.length;
	var index = 0;
	explanationBoxMap = {};
	while (index < expl_count){
		var step = explanation_steps[index];
		var uiIndex =index + 1;
		configureExplanationSelectorDiamond(uiIndex, step);
		index = index + 1;
	}
}
var showingDecisionNumber;

function configureExplanationSelectorDiamond(uiIndex,step){
	var x = getXOriginOfDecisionPointAtStep(step);
	var y = explanationControlYPosition;
	var halfWidth;
	var halfHeight;
	
	var currentStep = sessionIndexManager.getCurrentIndex();
	var ctx = expl_ctrl_ctx;
	if (currentStep == step) {
		showingDecisionNumber = uiIndex;
        $("#winning-action-label").html("Chosen move at D" + uiIndex + ": " + winningActionForStep[step]);
		ctx.font = "16px Arial bold";
		halfWidth = explanationPointBigDiamondHalfWidth;
		halfHeight = explanationPointBigDiamondHalfWidth;
		var yPositionOfWhyButton = -14;// relative to the next container below
        var xPositionOfWhyButton = x - 20;
        // why button rendering handled outside of chartV2 as chartV2 is created later upon explDetails arriving
        if (userStudyMode){
            if (treatmentID == "1"){
                // send explain command to back end
                askBackendForExplanationRewardInfo(step);
            }
            else if (treatmentID == "2" ||treatmentID == "3"){
                renderWhyButton(step, xPositionOfWhyButton, yPositionOfWhyButton);
            }
        }
        else {
            renderWhyButton(step, xPositionOfWhyButton, yPositionOfWhyButton);
        }
		
        boldThisStepInLegend(step);
        if (userStudyMode){
            userActionMonitor.stepToDecisionPoint(step);
            stateMonitor.setDecisionPoint(step);
        }
		// if (currentChartV2.chartVisible){
		// 	// send a request to back end for focusing on this new step
		// 	processWhyClick(step);
		// 	// but salienciesAreShowing is cleared by default on loading new explanation point
        // }
        // else {
        //     restoreChartIfReturningToTab(step);
        // }
	}
	else {
		ctx.font = "12px Arial bold";
		halfWidth = explanationPointSmallDiamondHalfWidth;
		halfHeight = explanationPointSmallDiamondHalfWidth;
		unboldThisStepInLegend(step);
	}
	
	ctx.beginPath();
	
	ctx.fillStyle = 'black';
	
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 2;
	var leftVertexX = x - halfWidth;;
	var leftVertexY = explanationControlYPosition;
	var rightVertexX = x + halfWidth;
	var rightVertexY = explanationControlYPosition;
	var topVertexX = x ;
	var topVertexY = explanationControlYPosition - halfHeight;
	var bottomVertexX = x;
	var bottomVertexY = explanationControlYPosition + halfHeight;
	
	ctx.moveTo(leftVertexX, leftVertexY);
	ctx.lineTo(topVertexX,topVertexY);
	ctx.lineTo(rightVertexX, rightVertexY);
	ctx.lineTo(bottomVertexX, bottomVertexY);
	ctx.lineTo(leftVertexX, leftVertexY);
	ctx.closePath();
	ctx.fill();
	
	ctx.fillStyle = 'white';
	if (currentStep == step) {
		var textCenterX = ((rightVertexX - leftVertexX) / 2) + leftVertexX - 10;
	}
	else {
		var textCenterX = ((rightVertexX - leftVertexX) / 2) + leftVertexX - 7;
	}
	ctx.font = "Arial";
	var textCenterY = explanationControlYPosition + 5;
	ctx.fillText('D' + uiIndex,textCenterX,textCenterY);

	//ctx.rect(upper_left_x, upper_left_y, rect_width, rect_height);
	var eBox = getExplanationBox(leftVertexX, rightVertexX, topVertexY, bottomVertexY, step);
    explanationBoxMap[step] = eBox;
}


function getExplanationBox(left_x,right_x, upper_y, lower_y, step){
	eBox = {};
	eBox.left_x = left_x;
	eBox.right_x = right_x;
	eBox.upper_y = upper_y;
	eBox.lower_y = lower_y;
	eBox.step = step;
	return eBox;
}

var explanationBoxMap = {};



var getMatchingExplanationStep = function(ctx, x, y){
	var matchingStep = undefined;
	for (key in explanationBoxMap) {
		var eBox = explanationBoxMap[key];
		if (x > eBox.left_x && x < eBox.right_x && y > eBox.upper_y && y < eBox.lower_y) {
			matchingStep = eBox.step;
		}
	}
	return matchingStep;
}


function getXOriginOfDecisionPointAtStep(step){
	var widthOfTimeline = expl_ctrl_canvas.width - 2*timelineMargin;
	var value = sessionIndexManager.getPercentIntoGameForStep(step);
    var x = timelineMargin + (value / 100) * widthOfTimeline;
    return x;
}
