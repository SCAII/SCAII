
function fullClearExplanationInfo() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	$("#saliency-checkboxes").empty();
	clearQuestionControls();
	if ($("#rewards-titled-container").length) {
		$("#rewards-titled-container").remove();
    }
    if (replayState != undefined) {
        replayState.rewardsAreShowing = false;
        if (replayState.salienciesAreShowing) {
            clearSaliencies();
        }
        replayState.salienciesAreShowing = false;
    }
	
}


function clearExplanationInfoButRetainState() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	$("#saliency-checkboxes").empty();
	clearQuestionControls();
	if ($("#rewards-titled-container").length) {
		$("#rewards-titled-container").remove();
    }
    if (replayState != undefined) {
        if (replayState.salienciesAreShowing) {
            clearSaliencies();
        }
    }
	
}

function createRewardChartContainer() {
	var rewardTitleContainer = document.createElement("DIV");
	rewardTitleContainer.setAttribute("id", "rewards-titled-container");
	rewardTitleContainer.setAttribute("class", "flex-column titled-container r0c1 rewards-bg");
	$("#scaii-interface").append(rewardTitleContainer);

    var rewardSpacerContainer = document.createElement("DIV");
	rewardSpacerContainer.setAttribute("id", "rewards-spacer");
	rewardSpacerContainer.setAttribute("class", "r0c2");
	rewardSpacerContainer.setAttribute("style", "background-color:white;width:800px;");
	$("#scaii-interface").append(rewardSpacerContainer);


	var whyQuestionsDiv = document.createElement("DIV");
	whyQuestionsDiv.setAttribute("id", "why-questions-div");
	whyQuestionsDiv.setAttribute("class", "rewards-bg flex-row");
	whyQuestionsDiv.setAttribute("style", "margin:auto;font-family:Arial;padding:10px;");
	$("#rewards-titled-container").append(whyQuestionsDiv);

	var whyActionLabel = document.createElement("DIV");
	whyActionLabel.setAttribute("id", "why-action-label");
	whyActionLabel.setAttribute("class", "rewards-bg");
	whyActionLabel.setAttribute("style", "font-family:Arial;font-size:14px;");
	$("#why-questions-div").append(whyActionLabel);
	
	var whyLabel = document.createElement("DIV");
	whyLabel.setAttribute("id", "why-label");
	whyLabel.setAttribute("class", "rewards-bg");
	whyLabel.setAttribute("style", "font-family:Arial;");
	$("#why-questions-div").append(whyLabel);


	var whyRadios = document.createElement("DIV");
	whyRadios.setAttribute("id", "why-radios");
	whyRadios.setAttribute("class", "rewards-bg flex-row");
	whyRadios.setAttribute("style", "margin:auto;font-family:Arial;padding:10px;font-size:14px;");
	$("#rewards-titled-container").append(whyRadios);

	var explanationRewards = document.createElement("DIV");
	explanationRewards.setAttribute("id", "explanations-rewards");
	explanationRewards.setAttribute("class", "rewards-bg");
	explanationRewards.setAttribute("style", "margin-left:20px; margin-right: 20px;font-family:Arial;");
	$("#rewards-titled-container").append(explanationRewards);

	var whatDiv = document.createElement("DIV");
	whatDiv.setAttribute("id", "what-div");
	whatDiv.setAttribute("class", "flex-row rewards-bg");
	whatDiv.setAttribute("style", "margin:auto;font-family:Arial;");
	$("#rewards-titled-container").append(whatDiv);

	var whatButtonDiv = document.createElement("DIV");
	whatButtonDiv.setAttribute("id", "what-button-div");
	whatButtonDiv.setAttribute("class", "rewards-bg");
	//whatButtonDiv.setAttribute("style", "margin:auto;");
	$("#what-div").append(whatButtonDiv);
	
	var whatRadios = document.createElement("DIV");
	whatRadios.setAttribute("id", "what-radios");
	whatRadios.setAttribute("class", "flex-row rewards-bg");
	whatRadios.setAttribute("style", "padding:6px");
	$("#what-div").append(whatRadios);

    $("#rewards-titled-container").on("click",regionClickHandlerRewards);
}

function createSaliencyContainers() {
	var scaiiExplanations = document.createElement("DIV");
	scaiiExplanations.setAttribute("id", "scaii-explanations");
    scaiiExplanations.setAttribute("class", "r1c0_2 saliencies-bg");
	$("#scaii-interface").append(scaiiExplanations);

	var saliencyGroup = document.createElement("DIV");
	saliencyGroup.setAttribute("id", "saliency-group");
	saliencyGroup.setAttribute("class", "flex-row saliencies-bg");
	//saliencyGroup.setAttribute("style", "margin-left:20px; margin-top:20px; margin-right: 20px;");
	$("#scaii-explanations").append(saliencyGroup);

	
	// selections area will be hidden so wedon't see checkboxes
	var saliencySelections = document.createElement("DIV");
	saliencySelections.setAttribute("id", "saliency-selections");
	saliencySelections.setAttribute("class", "flex-column  saliencies-bg");
	//saliencySelections.setAttribute("style", "visibility:hidden;");
	$("#saliency-group").append(saliencySelections);

	var saliencySelectionsTitle = document.createElement("DIV");
	saliencySelectionsTitle.setAttribute("id", "saliency-selections-title");
	saliencySelectionsTitle.setAttribute("class", "saliencies-bg");
	saliencySelectionsTitle.html = 'Generating Rewards';
	$("#saliency-selections").append(saliencySelectionsTitle);
	
	var saliencyCheckboxes = document.createElement("DIV");
	saliencyCheckboxes.setAttribute("id", "saliency-checkboxes");
	saliencyCheckboxes.setAttribute("class", "grid saliencies-bg");
	$("#saliency-selections").append(saliencyCheckboxes);



	var saliencyContent = document.createElement("DIV");
	saliencyContent.setAttribute("id", "saliency-content");
	saliencyContent.setAttribute("class", "flex-column saliencies-bg");
	$("#saliency-group").append(saliencyContent);

	
	var saliencyMapsTitledContainer = document.createElement("DIV");
	saliencyMapsTitledContainer.setAttribute("id", "saliency-maps-titled-container");
	saliencyMapsTitledContainer.setAttribute("class", "titled-container flex-column saliencies-bg");
	$("#saliency-content").append(saliencyMapsTitledContainer);

	var saliencyMaps = document.createElement("DIV");
	saliencyMaps.setAttribute("id", "saliency-maps");
	saliencyMaps.setAttribute("class", "grid");
	$("#saliency-maps-titled-container").append(saliencyMaps);

    $("#scaii-explanations")      .on("click",regionClickHandlerSaliency);
}


function populateSaliencyQuestionSelector(){
	$("#what-radios").empty();
	
	// SALIENCY SECTION
	var radioCombinedSaliency = document.createElement("input");
	radioCombinedSaliency.setAttribute("type","radio");
	radioCombinedSaliency.setAttribute("name","saliencyView");
	radioCombinedSaliency.setAttribute("id","relevance-combined-radio");
	radioCombinedSaliency.setAttribute("value","saliencyCombined");
    radioCombinedSaliency.setAttribute("style", "margin-left:20px;");
    if (replayState.saliencyCombined){
        radioCombinedSaliency.setAttribute("checked", "true");
    }
	radioCombinedSaliency.onclick = function(e) {
        replayState.saliencyCombined = true;
        targetClickHandler(e, "setSaliencyView:combinedSaliency");
        if (userStudyMode) {
            stateMonitor.showedCombinedSaliency();
        }
		activeSaliencyDisplayManager.setSaliencyMode(saliencyModeAggregate);
		activeSaliencyDisplayManager.renderExplanationSaliencyMaps();
	};

	var combinedSaliencyLabel = document.createElement("div");
	combinedSaliencyLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	combinedSaliencyLabel.innerHTML = "relevance combined";
	combinedSaliencyLabel.setAttribute("id","relevance-combined-label");

	var radioDetailedSaliency = document.createElement("input");
	radioDetailedSaliency.setAttribute("type","radio");
	radioDetailedSaliency.setAttribute("name","saliencyView");
	radioDetailedSaliency.setAttribute("id","relevance-detailed-radio");
	radioDetailedSaliency.setAttribute("value","saliencyDetailed");
    radioDetailedSaliency.setAttribute("style", "margin-left:20px; ");
    if (!replayState.saliencyCombined){
        radioDetailedSaliency.setAttribute("checked", "true");
    }
	radioDetailedSaliency.onclick = function(e) {
        replayState.saliencyCombined = false;
        targetClickHandler(e, "setSaliencyView:detailedSaliency");
        if (userStudyMode) {
            stateMonitor.showedDetailedSaliency();
        }
		activeSaliencyDisplayManager.setSaliencyMode(saliencyModeDetailed);
		activeSaliencyDisplayManager.renderExplanationSaliencyMaps();
	};

	var detailedSaliencyLabel = document.createElement("div");
	detailedSaliencyLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	detailedSaliencyLabel.innerHTML = "relevance details";
	detailedSaliencyLabel.setAttribute("id","relevance-detailed-label");
	
	$("#what-radios").append(radioCombinedSaliency);
	$("#what-radios").append(combinedSaliencyLabel);
	$("#what-radios").append(radioDetailedSaliency);
	$("#what-radios").append(detailedSaliencyLabel);
}


function populateRewardQuestionSelector(){
	$("#why-radios").empty();
	
	// REWARDS SECTION
	var radioCombinedRewards = document.createElement("input");
	radioCombinedRewards.setAttribute("type","radio");
	radioCombinedRewards.setAttribute("id","radio-combined-rewards");
	radioCombinedRewards.setAttribute("name","rewardView");
	radioCombinedRewards.setAttribute("value","rewardCombined");
    radioCombinedRewards.setAttribute("style", "margin-left:20px;");
    if (replayState.rewardView.includes("combined")){
        radioCombinedRewards.setAttribute("checked", "true");
    }
	radioCombinedRewards.onclick = function(e) {
		var logLine = templateMap["setRewardView"];
		logLine = logLine.replace("<SET_RWRD_VIEW>", "combinedRewards");
        targetClickHandler(e, logLine);
        if (userStudyMode) {
            stateMonitor.showedCombinedRewards();
        }
		showRewards("rewards.combined");
	};

	var combinedRewardsLabel = document.createElement("div");
	combinedRewardsLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	combinedRewardsLabel.innerHTML = "combined rewards";
    // NEW_CHART showing or not
    // NEW_CHART user study yes/no
	var radioDetailedRewards = document.createElement("input");
	radioDetailedRewards.setAttribute("type","radio");
	radioDetailedRewards.setAttribute("id","radio-detailed-rewards");
	radioDetailedRewards.setAttribute("name","rewardView");
	radioDetailedRewards.setAttribute("value","rewardDetailed");
    radioDetailedRewards.setAttribute("style", "margin-left:20px; ");
    if (replayState.rewardView.includes("detailed")){
        radioDetailedRewards.setAttribute("checked", "true");
    }
	radioDetailedRewards.onclick = function(e) {
		var logLine = templateMap["setRewardView"];
		logLine = logLine.replace("<SET_RWRD_VIEW>", "detailedRewards");
        targetClickHandler(e, logLine);
        if (userStudyMode) {
            stateMonitor.showedDetailedRewards();
        }
		showRewards("rewards.detailed");
	};

	var detailedRewardsLabel = document.createElement("div");
	detailedRewardsLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	detailedRewardsLabel.innerHTML = "detailed rewards";
	
	$("#why-radios").append(radioCombinedRewards);
	$("#why-radios").append(combinedRewardsLabel);
	$("#why-radios").append(radioDetailedRewards);
	$("#why-radios").append(detailedRewardsLabel);

	// ADVANTAGE SECTION
	var radioCombinedAdvantage = document.createElement("input");
	radioCombinedAdvantage.setAttribute("type","radio");
	radioCombinedAdvantage.setAttribute("id","radio-combined-advantage");
	radioCombinedAdvantage.setAttribute("name","rewardView");
	radioCombinedAdvantage.setAttribute("value","advantageCombined");
	radioCombinedAdvantage.setAttribute("style", "margin-left:20px;");
	radioCombinedAdvantage.onclick = function(e) {
		var logLine = templateMap["setRewardView"];
		logLine = logLine.replace("<SET_RWRD_VIEW>", "combinedAdvantage");
        targetClickHandler(e, logLine);
        if (userStudyMode) {
            stateMonitor.showedCombinedAdvantage();
        }
		showRewards("advantage.detailed");
	};

	var combinedAdvantageLabel = document.createElement("div");
	combinedAdvantageLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	combinedAdvantageLabel.innerHTML = "combined advantage";

	var radioDetailedAdvantage = document.createElement("input");
	radioDetailedAdvantage.setAttribute("type","radio");
	radioDetailedAdvantage.setAttribute("id","radio-detailed-advantage");
	radioDetailedAdvantage.setAttribute("name","rewardView");
	radioDetailedAdvantage.setAttribute("value","advantageDetailed");
	radioDetailedAdvantage.setAttribute("style", "margin-left:20px; ");
	radioDetailedAdvantage.onclick = function(e) {
		var logLine = templateMap["setRewardView"];
		logLine = logLine.replace("<SET_RWRD_VIEW>", "detailedAdvantage");
        targetClickHandler(e, logLine);
        if (userStudyMode) {
            stateMonitor.showedDetailedAdvantage();
        }
		showRewards("advantage.detailed");
	};

	var detailedAdvantageLabel = document.createElement("div");
	detailedAdvantageLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	detailedAdvantageLabel.innerHTML = "detailed advantage";
	
	//$("#why-radios").append(radioCombinedAdvantage);
	//$("#why-radios").append(combinedAdvantageLabel);
	//$("#why-radios").append(radioDetailedAdvantage);
	//$("#why-radios").append(detailedAdvantageLabel);

}


// var renderActionName = function(explPoint){
// 	var title = explPoint.getTitle();
// 	$("#action-name-label").html(title);
// }


var explanationPointBigDiamondHalfWidth = 22;
var explanationPointSmallDiamondHalfWidth = 16;
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
        if (userStudyMode){
            if (studyTreatment.showReward) {
                addWhyButtonForAction(step, xPositionOfWhyButton,  yPositionOfWhyButton);
            }
            if (studyTreatment.showAllSaliencyForTreatment1){
                // send explain command to back end
                askBackendForExplanationRewardInfo(step);
            }
        }
        else {
            addWhyButtonForAction(step, xPositionOfWhyButton,  yPositionOfWhyButton);
        }
		
        boldThisStepInLegend(step);
        if (userStudyMode){
            userActionMonitor.stepToDecisionPoint(step);
            stateMonitor.setDecisionPoint(step);
        }
		if (replayState.rewardsAreShowing){
			// send a request to back end for focusing on this new step
			processWhyClick(step);
			// but salienciesAreShowing is cleared by default on loading new explanation point
			if (replayState.salienciesAreShowing){
				// so we force saliency to stay visible across a round trip request to back using a keepAlive flag
				saliencyKeepAlive = true;
			}
        }
        else {
            restoreChartIfReturningToTab(step);
        }
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



var winningActionForStep = {};
function renderDecisionPointLegend() {
	$("#action-list").empty();
	decisionPointIds = {};
	var legendLabel = document.createElement("LABEL");
	legendLabel.setAttribute("id", "legend-label");
	legendLabel.setAttribute("style", getGridPositionStyle(0,0) + 'margin-left:10px;margin-bottom:0px;margin-top:6px;font-family:Arial;font-size:14px;');
	legendLabel.innerHTML = "Decision Points: ";
	$("#action-list").append(legendLabel);

	var explanation_steps = replaySessionConfig.getExplanationStepsList();
    var explanation_titles = replaySessionConfig.getExplanationTitlesList();
    if (userStudyMode) {
       explanation_titles = activeStudyQuestionManager.getExplanationTitles(explanation_steps, explanation_titles);
    }
	var expl_count = explanation_steps.length;
	var index = 0;
	while (index < expl_count){
		var title = explanation_titles[index];
		var uiIndex =index + 1;
        var step = explanation_steps[index];
        winningActionForStep[step] = title;
		addLabelForAction(title, uiIndex, step);
		index = index + 1;
	}
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

function addWhyButtonForAction(step, x,  y) {
	var whyButton = document.createElement("BUTTON");
	var buttonId = "why-button";
	whyButton.setAttribute("id", buttonId);
	var why = document.createTextNode("why?");
	whyButton.appendChild(why);          
	whyButton.setAttribute("style", 'z-index:' + zIndexMap["whyButton"] + ';position:relative;left:' + x + 'px;top:' + y + 'px;font-family:Arial;');
	
	$("#explanation-control-panel").append(whyButton);
	$("#" + buttonId).click(function(e) {
        
        if (replayState.rewardsAreShowing) {
			var logLine = templateMap["hideWhy"];
			logLine = logLine.replace("<HIDE_WHY>", "NA");
			targetClickHandler(e, logLine);
            //targetClickHandler(e,"hideWhy:NA");
        }
        else {
			var logLine = templateMap["showWhy"];
			logLine = logLine.replace("<SHW_WHY>", "NA");
			targetClickHandler(e, logLine);
            //targetClickHandler(e,"showWhy:NA");
        }
        
		 e.preventDefault();
		 processWhyClick(step);
	})
}

function addWhatButton() {
	$("#what-button-div").empty();
	var whatButton = document.createElement("BUTTON");
	var buttonId = "what-button";
	whatButton.setAttribute("id", buttonId);
	var what = document.createTextNode("what was relevant?");
	whatButton.appendChild(what);    
	whatButton.setAttribute("style", "padding:6px;margin-right:30px;font-family:Arial;");
	
	$("#what-button-div").append(whatButton);
	$("#" + buttonId).click(function(e) {
        if (replayState.salienciesAreShowing){
			var logLine = templateMap["hideSaliency"];
			logLine = logLine.replace("<HIDE_SALNCY>", "NA");
            targetClickHandler(e, logLine);
            //targetClickHandler(e,"hideSaliency:NA");
        }
        else {
			var logLine = templateMap["showSaliency"];
			logLine = logLine.replace("<SHW_SALNCY>", "NA");
            targetClickHandler(e, logLine);
            //targetClickHandler(e,"showSaliency:NA");
        }
		e.preventDefault();
		processWhatClick();
	})
}



function convertNameToLegalId(name) {
	name = name.replace(/ /g,"");
	name = name.replace(/,/g,"");
	name = name.replace(/\(/g,"");
	var nameForId = name.replace(/\)/g,"");
	return nameForId;
}
var decisionPointIds = {};

function unboldThisStepInLegend(step){
	var decisionPointId = decisionPointIds[step];
	if (decisionPointId != undefined) {
		$("#" + decisionPointId).css("font-weight","normal");
	}
}

function boldThisStepInLegend(step){
	var decisionPointId = decisionPointIds[step];
	if (decisionPointId != undefined) {
		$("#" + decisionPointId).css("font-weight","bold");
	}
}

function getDecisionPointIdForName(name, step){
	var nameForId = convertNameToLegalId(name);
	nameForId = "actionLabel-step-" +step + "-action-" + nameForId;
	return nameForId;
}

function addLabelForAction(title, index, step){
    var fullName = 'D' + index + ': ' + title;
	var actionLabel = document.createElement("div");
	var id = getDecisionPointIdForName(title, step);
	decisionPointIds[step] = id;

	actionLabel.setAttribute("id", id);

	actionLabel.addEventListener("click", function(evt) {
		if (!isUserInputBlocked()){
            if (userStudyMode){
                if (activeStudyQuestionManager.accessManager.isBeyondCurrentRange(step)){
					var logLine = templateMap["clickActionLabelDenied"];
					logLine = logLine.replace("<CLCK_ACT_D>", escapeAnswerFileDelimetersFromTextString(fullName));
					targetClickHandler(evt, logLine);
                    return;
                }
                else {
					var logLine = templateMap["clickActionLabel"];
					logLine = logLine.replace("<CLCK_ACT>", escapeAnswerFileDelimetersFromTextString(fullName));
					targetClickHandler(evt, logLine);
                    //targetClickHandler(evt, "clickActionLabel:" + escapeAnswerFileDelimetersFromTextString(fullName));
                }
            }
            jumpToStep(step);
		}
	});
	actionLabel.addEventListener("mouseenter", function(evt) {
        //$("#" + id).css("background-color","rgba(100,100,100,1.0);");
        if (userStudyMode){
            if (activeStudyQuestionManager.accessManager.isBeyondCurrentRange(step)){
                return;
            }
        }
		$("#" + id).css("background-color","#EEDDCC");
	});
	actionLabel.addEventListener("mouseleave", function(evt) {
		//$("#" + id).css("background-color","rgba(100,100,100,0.0)");
		$("#" + id).css("background-color","transparent");
	});

	var row = Math.floor((index - 1) / 2);
	var col = 1 + (index - 1) % 2;
	actionLabel.setAttribute("style", getGridPositionStyle(col, row) + 'padding:0px;margin-left:4px;margin-bottom:2px;margin-top:2px;margin-right:4px;font-family:Arial;font-size:14px;');
	
	actionLabel.innerHTML = fullName;
	$("#action-list").append(actionLabel);
}


function getXOriginOfDecisionPointAtStep(step){
	var widthOfTimeline = expl_ctrl_canvas.width - 2*timelineMargin;
	var value = sessionIndexManager.getPercentIntoGameForStep(step);
    var x = timelineMargin + (value / 100) * widthOfTimeline;
    return x;
}

function clearSaliencies() {
	$("#scaii-explanations").remove();
	replayState.salienciesAreShowing = false;
	$("#relevance-combined-radio").remove();
	$("#relevance-detailed-radio").remove();
	$("#relevance-combined-label").remove();
	$("#relevance-detailed-label").remove();
}
function clearQuestionControls(){
	$("#why-radios").empty();
	$("#what-button-div").empty();
	$("#reward-question-selector").empty();
	$("#why-label").html(" ");
}
