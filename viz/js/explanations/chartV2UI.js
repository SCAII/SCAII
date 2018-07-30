function getChartV2UI() {
    var ui = {};

    ui.whyButtonInfo = undefined;

    ui.renderChartDetailed = function(chartData){
        createRewardChartContainer();
        var canvasWidth = $("#explanations-rewards").width;
        var canvasHeight = $("#explanations-rewards").height;
        chartData.initChartDimensions(canvasHeight, canvasWidth);
        alert("called renderChartDetailed");
    }
    return ui;
}


var selectedDecisionStep = undefined;

function processWhyClick(step) {
	if (selectedDecisionStep == step){
        currentChartV2.chartVisible = false;
		selectedDecisionStep = undefined;
        currentChartV2.render();
		// engage selection color for supporting areas
		//$("#why-questions").toggleClass('active');
		//$("#why-label").toggleClass('active');
	}
	else if (selectedDecisionStep == undefined) {
        // show explanation info for new step
        currentChartV2.chartVisible = true;
		selectedDecisionStep = step;
        askBackendForExplanationRewardInfo(step);
		
		// engage selection color for supporting areas
//		$("#why-questions").toggleClass('active');
//		$("#why-label").toggleClass('active');
	}
	else {
		// (selectedDecisionStep == someOtherStep)
        currentChartV2.chartVisible = true;
        
		// show explanation info for new step
        selectedDecisionStep = step;
        askBackendForExplanationRewardInfo(step);
	}
}

function fullClearExplanationInfo() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	clearQuestionControls();
	if ($("#rewards-titled-container").length) {
		$("#rewards-titled-container").remove();
    }
    if (currentChartV2 != undefined) {
        currentChartV2.chartVisible = false;
        if (currentChartV2.saliencyVisible) {
            clearSaliencies();
        }
        currentChartV2.saliencyVisible = false;
    }
	
}


function clearExplanationInfoButRetainState() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	clearQuestionControls();
	if ($("#rewards-titled-container").length) {
		$("#rewards-titled-container").remove();
    }
    if (currentChartV2 != undefined) {
        if (currentChartV2.saliencyVisible) {
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



function populateRewardQuestionSelector(){
	$("#why-radios").empty();
	
	// REWARDS SECTION

    // NEW_CHART showing or not
    // NEW_CHART user study yes/no
	var radioDetailedRewards = document.createElement("input");
	radioDetailedRewards.setAttribute("type","radio");
	radioDetailedRewards.setAttribute("id","radio-detailed-rewards");
	radioDetailedRewards.setAttribute("name","rewardView");
	radioDetailedRewards.setAttribute("value","rewardDetailed");
    radioDetailedRewards.setAttribute("style", "margin-left:20px; ");
    radioDetailedRewards.setAttribute("checked", "true");
	// radioDetailedRewards.onclick = function(e) {
	// 	var logLine = templateMap["setRewardView"];
	// 	logLine = logLine.replace("<SET_RWRD_VIEW>", "detailedRewards");
    //     targetClickHandler(e, logLine);
    //     if (userStudyMode) {
    //         stateMonitor.showedDetailedRewards();
    //     }
	// 	//showRewards("rewards.detailed");
	// };

	var detailedRewardsLabel = document.createElement("div");
	detailedRewardsLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	detailedRewardsLabel.innerHTML = "detailed rewards";
	
	$("#why-radios").append(radioDetailedRewards);
	$("#why-radios").append(detailedRewardsLabel);
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
        if (currentChartV2.saliencyVisible){
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
