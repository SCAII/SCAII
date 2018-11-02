var chartStyle = "basic";

function getChartV2UI() {
    var uis = {};

    uis.renderChart = function(chartData, treatment){
        var canvasHeight = 500;
        var canvasWidth = 700;
        createRewardChartContainer(canvasHeight);
        if (userStudyMode){
            this.chart = getBasicChartUI();
        }
        else if (chartStyle == "basic"){
            this.chart = getBasicChartUI();
        }
        else if (chartStyle == "msx"){
            this.chart = getMsxChartUI();
        }
        else {
            this.chart = getAdvantageChartUI();
        }
        this.chart.renderChart(chartData, treatment,canvasHeight, canvasWidth);
    }
    return uis;
}


var selectedDecisionStep = undefined;

function processWhyClick(step) {
    var explanationStep = sessionIndexManager.getStepThatStartsEpochForStep(step);
	if (selectedDecisionStep == explanationStep && currentExplManager.chartVisible == true) {
        currentExplManager.chartVisible = false;
        currentExplManager.saliencyVisible = false;
		selectedDecisionStep = undefined;
		currentExplManager.render("live");
		// engage selection color for supporting areas
		//$("#why-questions").toggleClass('active');
		//$("#why-label").toggleClass('active');
	}	
	else {
		currentExplManager.chartVisible = true;
		// show explanation info for new step
        selectedDecisionStep = explanationStep;
        currentExplManager.render("live");
	}
}

function cleanExplanationUI() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	clearQuestionControls();
	if ($("#rewards-titled-container").length) {
		$("#rewards-titled-container").remove();
    }
    if (currentExplManager != undefined) {
        currentExplManager.applyFunctionToEachCachedDataset(detachChannelItem, "titledMapDiv");	// so they don't get tossed
    }
	$("#saliency-div").remove();
}


function createRewardChartContainer(canvasHeight) {
	var rewardTitleContainer = document.createElement("DIV");
	rewardTitleContainer.setAttribute("id", "rewards-titled-container");
	rewardTitleContainer.setAttribute("class", "flex-column titled-container rewards-bg");
	//rewardTitleContainer.setAttribute("class", "flex-column titled-container r0c1 rewards-bg");
	rewardTitleContainer.setAttribute("style", "float:left;white-space:nowrap;width:auto;");
	$("#game-chart-container").append(rewardTitleContainer);	

	var whyQuestionsDiv = document.createElement("DIV");
	whyQuestionsDiv.setAttribute("id", "why-questions-div");
	whyQuestionsDiv.setAttribute("class", "rewards-bg flex-row");
	whyQuestionsDiv.setAttribute("style", "margin:auto;font-family:Arial;padding:10px;");
	//$("#rewards-titled-container").append(whyQuestionsDiv);

	var whyActionLabel = document.createElement("DIV");
	whyActionLabel.setAttribute("id", "why-action-label");
	whyActionLabel.setAttribute("class", "rewards-bg");
	whyActionLabel.setAttribute("style", "font-family:Arial;font-size:14px;");
	//$("#why-questions-div").append(whyActionLabel);

	var whyLabel = document.createElement("DIV");
	whyLabel.setAttribute("id", "why-label");
	whyLabel.setAttribute("class", "rewards-bg");
	whyLabel.setAttribute("style", "font-family:Arial;");
	//$("#why-questions-div").append(whyLabel);


    if (!userStudyMode){
        var whyRadios = document.createElement("DIV");
        whyRadios.setAttribute("id", "why-radios");
        whyRadios.setAttribute("class", "rewards-bg flex-row");
        whyRadios.setAttribute("style", "margin:auto;font-family:Arial;padding:10px;font-size:14px;");
        $("#rewards-titled-container").append(whyRadios);
        populateRewardsSelector();
    }
	
    var explanationRewards = document.createElement("DIV");
    explanationRewards.setAttribute("height", canvasHeight + "px");
	explanationRewards.setAttribute("id", "explanations-rewards");
	explanationRewards.setAttribute("class", "rewards-bg flex-row");
	explanationRewards.setAttribute("style", "margin-left:20px; margin-right: 20px; margin-top: 20px; margin-bottom:0px; font-family:Arial;");
	$("#rewards-titled-container").append(explanationRewards);

	var whatDiv = document.createElement("DIV");
	whatDiv.setAttribute("id", "what-div");
	whatDiv.setAttribute("class", "flex-row rewards-bg");
	whatDiv.setAttribute("style", "font-family:Arial;padding:10px;height:60px");
	$("#rewards-titled-container").append(whatDiv);

	var whatButtonDiv = document.createElement("DIV");
	whatButtonDiv.setAttribute("id", "what-button-div");
	whatButtonDiv.setAttribute("class", "rewards-bg");
	whatButtonDiv.setAttribute("style", "margin-left: 200px;align-self:center;");
	$("#what-div").append(whatButtonDiv);

	var whatRadios = document.createElement("DIV");
	whatRadios.setAttribute("id", "what-radios");
	whatRadios.setAttribute("class", "flex-row rewards-bg");
	whatRadios.setAttribute("style", "align-items:center;");
	$("#what-div").append(whatRadios);

    if (userStudyMode){
        $("#rewards-titled-container").on("click", regionClickHandlerRewards);
    }
	
	var whatSpacerDiv = document.createElement("DIV");
	whatSpacerDiv.setAttribute("id", "what-spacer-div");
	whatSpacerDiv.setAttribute("class", "rewards-bg");
	whatSpacerDiv.setAttribute("style", "margin:auto;");
	$("#rewards-titled-container").append(whatSpacerDiv);
}



function populateRewardsSelector() {
    $("#why-radios").empty();
    //basic
	var radioBasicRewards = document.createElement("input");
	radioBasicRewards.setAttribute("type", "radio");
	radioBasicRewards.setAttribute("id", "radio-basic-rewards");
	radioBasicRewards.setAttribute("name", "rewardView");
	radioBasicRewards.setAttribute("value", "rewardBasic");
    radioBasicRewards.setAttribute("style", "margin-left:20px; ");
    if (chartStyle == "basic"){
        radioBasicRewards.setAttribute("checked", "checked");
    }
	radioBasicRewards.onclick = function(e) {
        chartStyle = "basic";
        currentExplManager.render("live");
	};
	var basicRewardsLabel = document.createElement("div");
	basicRewardsLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	basicRewardsLabel.innerHTML = "Basic Reward View";
	$("#why-radios").append(radioBasicRewards);
    $("#why-radios").append(basicRewardsLabel);

    // msx
    var radioMsxRewards = document.createElement("input");
	radioMsxRewards.setAttribute("type", "radio");
	radioMsxRewards.setAttribute("id", "radio-msx-rewards");
	radioMsxRewards.setAttribute("name", "rewardView");
	radioMsxRewards.setAttribute("value", "rewardMsx");
    radioMsxRewards.setAttribute("style", "margin-left:20px; ");
    if (chartStyle == "msx"){
        radioMsxRewards.setAttribute("checked", "checked");
    }
	radioMsxRewards.onclick = function(e) {
        chartStyle = "msx";
		currentExplManager.render("live");
	};
	var msxRewardsLabel = document.createElement("div");
	msxRewardsLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	msxRewardsLabel.innerHTML = "MSX Reward View";
	$("#why-radios").append(radioMsxRewards);
    $("#why-radios").append(msxRewardsLabel);

    // advantage
    var radioAdvantageRewards = document.createElement("input");
	radioAdvantageRewards.setAttribute("type", "radio");
	radioAdvantageRewards.setAttribute("id", "radio-advantage-rewards");
	radioAdvantageRewards.setAttribute("name", "rewardView");
	radioAdvantageRewards.setAttribute("value", "rewardAdvantage");
    radioAdvantageRewards.setAttribute("style", "margin-left:20px; ");
    if (chartStyle == "advantage"){
        radioAdvantageRewards.setAttribute("checked", "checked");
    }
	radioAdvantageRewards.onclick = function(e) {
        chartStyle = "advantage";
		currentExplManager.render("live");
	};
	var advantageRewardsLabel = document.createElement("div");
	advantageRewardsLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	advantageRewardsLabel.innerHTML = "Advantage Reward View";
	$("#why-radios").append(radioAdvantageRewards);
    $("#why-radios").append(advantageRewardsLabel);
    
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
	$("#" + buttonId).click(function (e) {
		if (currentExplManager.saliencyVisible) {
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

// with T3's question design, once the user selects a rewardbar, we want to ensure that
// they don't change the saliency map (by clicking on another bar) before answering the 
// saliency map question - otherwise non-relevant maps might be in play.
function isSaliencyMapSwitchBlockedByQuestion(treatment){
    if (treatment != "T3"){
        return false;
    }
    // we know it's T3
    var isSaliencyMapClickQuestion = activeStudyQuestionManager.isCurrentQuestionWaitForClickOnSaliencyMap();
    var isSaliencyMapRelatedQuestion = activeStudyQuestionManager.isPlainQuestionFocusedOnPriorChosenSaliencyMap();
    if (isSaliencyMapClickQuestion || isSaliencyMapRelatedQuestion) {
        return true;
    }
    return false;
}

function positionLegendPieces(chartData, backgroundColor){
    // create legend area where names and boxes will exist
    var legendRewards = document.createElement("DIV");
    legendRewards.setAttribute("id", "legend-rewards");
    legendRewards.setAttribute("class", "grid");
    legendRewards.setAttribute("style", "background-color:" + backgroundColor + ";padding:6px");
    $("#legend-div").append(legendRewards);

    // append legend title to legend area
    var legendTitle = document.createElement("DIV");
    legendTitle.setAttribute("id", "legend-title");
    legendTitle.setAttribute("class", "r0c0_1");
    legendTitle.setAttribute("style", "height:20px;padding:5px");
    $("#legend-rewards").append(legendTitle);
    var i;
    // append desc, legend names, and boxes to legend area
    for (i in chartData.rewardNames) {
        var iPlusOne = Number(i) + 1;
        if (iPlusOne % 2 == 0) {
            var rewardDesc = document.createElement('DIV');
            rewardDesc.setAttribute("id", "legend-desc-" + i);
            rewardDesc.setAttribute("class", "r" + iPlusOne + "c0");
            rewardDesc.setAttribute("style", "height:20px;width:100px;position:relative;left:15px;padding-top:3px;padding-right:5px;padding-bottom:10px");
            $("#legend-rewards").append(rewardDesc);

            var rewardBox = document.createElement("DIV");
            rewardBox.setAttribute("id", "legend-box-" + i);
            rewardBox.setAttribute("class", "r" + iPlusOne + "c1");
            rewardBox.setAttribute("style", "background-color:" + chartData.colors[i] + ";height:17px;width:17px;position:relative;top:2px;");
            $("#legend-rewards").append(rewardBox);

            var rewardInfo = document.createElement("DIV");
            rewardInfo.setAttribute("id", "legend-name-" + i);
            rewardInfo.setAttribute("class", "r" + iPlusOne + "c2");
            rewardInfo.setAttribute("style", "height:20px;padding-top:3px;padding-left:3px;padding-bottom:10px");
            $("#legend-rewards").append(rewardInfo);

        } else {
            var rewardDesc = document.createElement('DIV');
            rewardDesc.setAttribute("id", "legend-desc-" + i);
            rewardDesc.setAttribute("class", "r" + iPlusOne + "c0");
            rewardDesc.setAttribute("style", "height:20px;width:100px;position:relative;left:15px;padding-top:3px;padding-right:5px");
            $("#legend-rewards").append(rewardDesc);

            var rewardBox = document.createElement("DIV");
            rewardBox.setAttribute("id", "legend-box-" + i);
            rewardBox.setAttribute("class", "r" + iPlusOne + "c1");
            rewardBox.setAttribute("style", "background-color:" + chartData.colors[i] + ";height:17px;width:17px;position:relative;top:2px;");
            $("#legend-rewards").append(rewardBox);

            var rewardInfo = document.createElement("DIV");
            rewardInfo.setAttribute("id", "legend-name-" + i);
            rewardInfo.setAttribute("class", "r" + iPlusOne + "c2");
            rewardInfo.setAttribute("style", "height:20px;padding-top:3px;padding-left:3px");
            $("#legend-rewards").append(rewardInfo);
        }

    }
    return i;
}