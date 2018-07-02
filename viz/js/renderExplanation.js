google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var googleChart;
var explanations = [];
var explanationBoxMap = {};
var saliencyLookupMap = {};
var showingDecisionNumber;

// selection Managers for four contexts
var selectionManagerRewardsCombined = undefined;
var selectionManagerRewardsDetailed = undefined;
var selectionManagerAdvantageCombined = undefined;
var selectionManagerAdvantageDetailed = undefined;

//saliencyDisplayManagers for four contexts
var saliencyDisplayManagerRewardsCombined = undefined;
var saliencyDisplayManagerRewardsDetailed = undefined;
var saliencyDisplayManagerAdvantageCombined = undefined;
var saliencyDisplayManagerAdvantageDetailed = undefined;
var activeSaliencyDisplayManager = undefined;

// barChartManagers for four contexts
var barChartManagerRewardsCombined = undefined;
var barChartManagerRewardsDetailed = undefined;
var barChartManagerAdvantageCombined = undefined;
var barChartManagerAdvantageDetailed = undefined;
var activeBarChartManager = undefined;


var rewardsAreShowing = false;
var salienciesAreShowing = false;
var questionMarkButtonIds =[];
var activeExplanationPoint = undefined;

var isCombinedView = undefined;
var isRewardMode = undefined;

function clearExplanationInfo() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	$("#saliency-checkboxes").empty();
	clearQuestionControls();
	if ($("#rewards-titled-container").length) {
		$("#rewards-titled-container").remove();
	}
	rewardsAreShowing = false;
	if (salienciesAreShowing) {
		clearSaliencies();
	}
}

function clearSaliencies() {
	$("#scaii-explanations").remove();
	salienciesAreShowing = false;
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

function initSelectionManagers(){
	selectionManagerRewardsCombined = getSelectionManager();
	selectionManagerRewardsDetailed = getSelectionManager();
	selectionManagerAdvantageCombined = getSelectionManager();
	selectionManagerAdvantageDetailed = getSelectionManager();
}

function initSaliencyDisplayManagers(){
	saliencyDisplayManagerRewardsCombined = getSaliencyDisplayManager(selectionManagerRewardsCombined);
	saliencyDisplayManagerRewardsDetailed = getSaliencyDisplayManager(selectionManagerRewardsDetailed);
	saliencyDisplayManagerAdvantageCombined = getSaliencyDisplayManager(selectionManagerAdvantageCombined);
	saliencyDisplayManagerAdvantageDetailed = getSaliencyDisplayManager(selectionManagerAdvantageDetailed);
	activeSaliencyDisplayManager = saliencyDisplayManagerRewardsCombined;
}

function initChartManagers(barChartMessage) {
	barChartManagerRewardsCombined = getBarChartManager(barChartMessage,selectionManagerRewardsCombined,saliencyDisplayManagerRewardsCombined,true, true);
	barChartManagerRewardsDetailed = getBarChartManager(barChartMessage,selectionManagerRewardsDetailed,saliencyDisplayManagerRewardsDetailed, false, true);
	barChartManagerAdvantageCombined = getBarChartManager(barChartMessage,selectionManagerAdvantageCombined,saliencyDisplayManagerAdvantageCombined, true, false);
	barChartManagerAdvantageDetailed = getBarChartManager(barChartMessage,selectionManagerAdvantageDetailed,saliencyDisplayManagerAdvantageDetailed, false, false);
	activeBarChartManager = barChartManagerRewardsCombined;
}

function handleExplDetails(explDetails){
	if (explDetails.hasExplPoint()){
		explanationPoint = explDetails.getExplPoint();
		initSelectionManagers();
		initSaliencyDisplayManagers();
		var barChartMessage = explanationPoint.getBarChart();
		initChartManagers(barChartMessage);
		renderWhyInfo(explanationPoint);
	}
	else {
		console.log("MISSING expl point!");
	}
}


function getSelectionManager() {
	var sm = {};
    sm.selections = [];
    sm.defaultSelectionMade = false;
	
	sm.setSelections = function(info) {
		this.selections = info;
	}
    
    sm.clearSelections = function() {
        if (this.selections.length != 0) {
            var tempSelections = [];
            for (var i in this.selections) {
                var selection = this.selections[i];
                tempSelections.push(selection);
                
            }
            for (var i in tempSelections){
                var selection = tempSelections[i];
                this.removeSelection(selection);
            }
        }
    }
    
	sm.addSelection = function(selection) {
        var targetName = "rewardBar(" + selection[0] + "/" + selection[1] + ")";
        var targetArg = selection[0] + "/" + selection[1];
        if (this.defaultSelectionMade) {
            chartTargetClickHandler(targetName, "selectRewardBar:" + targetArg);
        }
        this.defaultSelectionMade = true;
		this.selections.push(selection);
	}

	sm.removeSelection = function (selection) {
        var targetName = "rewardBar(" + selection[0] + "/" + selection[1] + ")";
        var targetArg = selection[0] + "/" + selection[1];
        chartTargetClickHandler(targetName, "unselectRewardBar:" + targetArg);
		var newList = [];
		for (var i in this.selections) {
			var curSel = this.selections[i];
			if (curSel[0] == selection[0] && curSel[1] == selection[1]) {
				// skip
			}
			else {
				newList.push(curSel);
			}
		}
		this.selections = newList;
	}

	sm.isSelected = function(selection) {
		for (var i in this.selections) {
			var cur = this.selections[i];
			if (cur[0] == selection[0] && cur[1] == selection[1]) {
				return true;
			}
		}
		return false;
	}

	sm.getSelections = function(){
		return this.selections;
	}
	return sm;
}


expl_ctrl_canvas.addEventListener('click', function (event) {
	if (!isUserInputBlocked()){
		var matchingStep = getMatchingExplanationStep(expl_ctrl_ctx, event.offsetX, event.offsetY);
		if (matchingStep == undefined){
            processTimelineClick(event);
		}
		else{
			if (matchingStep == sessionIndexManager.getCurrentIndex()) {
				//no need to move - already at step with explanation
			}
			else {
                jumpToStep(matchingStep);
                specifiedTargetClickHandler("decisionPointList", "jumpToDecisionPoint:" + matchingStep);
			}
        }
	}
});


var defSelSetForRewardCombined = false;
var defSelSetForRewardDetailed = false;
var defSelSetForAdvantageCombined = false;
var defSelSetForAdvantageDetailed = false;

function clearDefaultSelections() {
	defSelSetForRewardCombined = false;
	defSelSetForRewardDetailed = false;
	defSelSetForAdvantageCombined = false;
	defSelSetForAdvantageDetailed = false;
}
function rememberDefaultSelection(isAggregate, isRewardMode) {
	if (isAggregate && isRewardMode) {
		defSelSetForRewardCombined = true;
	}
	else if (!isAggregate && isRewardMode) {
		defSelSetForRewardDetailed = true;
	}
	else if (isAggregate && !isRewardMode) {
		defSelSetForAdvantageCombined= true;
	}
	else {
		// !isAggregate && !isRewardMode
		defSelSetForAdvantageDetailed = true;
	}
}
function wasDefaultSelectionDone(isAggregate, isRewardMode){
	if (isAggregate && isRewardMode) {
		return defSelSetForRewardCombined;
	}
	else if (!isAggregate && isRewardMode) {
		return defSelSetForRewardDetailed;
	}
	else if (isAggregate && !isRewardMode) {
		return defSelSetForAdvantageCombined;
	}
	else {
		// !isAggregate && !isRewardMode
		return defSelSetForAdvantageDetailed;
	}
}

// function getSelectionManagerForSituation(isAggregate, isRewardMode) {
// 	if (isAggregate && isRewardMode) {
// 		return selectionManagerRewardsCombined;
// 	}
// 	else if (!isAggregate && isRewardMode) {
// 		return selectionManagerRewardsDetailed;
// 	}
// 	else if (isAggregate && !isRewardMode) {
// 		return selectionManagerAdvantageCombined;
// 	}
// 	else {
// 		// !isAggregate && !isRewardMode
// 		return selectionManagerAdvantageDetailed;
// 	}
// }

function getSaliencyDisplayManagerForSituation(isAggregate, isRewardMode) {
	if (isAggregate && isRewardMode) {
		return saliencyDisplayManagerRewardsCombined;
	}
	else if (!isAggregate && isRewardMode) {
		return saliencyDisplayManagerRewardsDetailed;
	}
	else if (isAggregate && !isRewardMode) {
		return saliencyDisplayManagerAdvantageCombined;
	}
	else {
		// !isAggregate && !isRewardMode
		return saliencyDisplayManagerAdvantageDetailed;
	}
}

function getBarChartManagerForSituation(isAggregate, isRewardMode) {
	if (isAggregate && isRewardMode) {
		return barChartManagerRewardsCombined;
	}
	else if (!isAggregate && isRewardMode) {
		return barChartManagerRewardsDetailed;
	}
	else if (isAggregate && !isRewardMode) {
		return barChartManagerAdvantageCombined;
	}
	else {
		// !isAggregate && !isRewardMode
		return barChartManagerAdvantageDetailed;
	}
}

function showRewards(isAggregate, isRewardMode) {
	activeSaliencyDisplayManager = getSaliencyDisplayManagerForSituation(isAggregate, isRewardMode);
    configureRewardChart(isAggregate, isRewardMode);
    if (userStudyMode) {
        if (!studyTreatment.showSaliencyAll){
            // bypass showing saliency 
            return;
        }
    }

	if (salienciesAreShowing){
		if (saliencyCombined) {
			activeSaliencyDisplayManager.setSaliencyMode(saliencyModeAggregate);
		}
		else {
			activeSaliencyDisplayManager.setSaliencyMode(saliencyModeDetailed);
		}
		if (showCheckboxes) {
			activeSaliencyDisplayManager.renderCheckboxes();
		}
		activeSaliencyDisplayManager.renderExplanationSaliencyMaps();
	}
}

function configureInvisibleRewardChart(isAggregate, isRewardView) {
	isCombinedView = isAggregate;
	isRewardMode = isRewardView;
	activeBarChartManager = getBarChartManagerForSituation(isAggregate,isRewardMode);
	if (!wasDefaultSelectionDone(isAggregate, isRewardView)){
		activeBarChartManager.setDefaultSelections();
		rememberDefaultSelection(isAggregate, isRewardView);
	}
	rewardsAreShowing = false;
}


function configureRewardChart(isAggregate, isRewardView) {
	isCombinedView = isAggregate;
	isRewardMode = isRewardView;
	activeBarChartManager = getBarChartManagerForSituation(isAggregate,isRewardMode);
	if (!wasDefaultSelectionDone(isAggregate, isRewardView)){
		activeBarChartManager.setDefaultSelections();
		rememberDefaultSelection(isAggregate, isRewardView);
	}
	activeBarChartManager.renderExplanationBarChart();
	rewardsAreShowing = true;
}


function prepareForSaliencyOnlyView(explPoint){
    clearExplanationInfo();
	clearDefaultSelections();
	//createRewardChartContainer();
	activeExplanationPoint = explPoint;

	saliencyDisplayManagerRewardsCombined.populateActionCheckBoxes();
	saliencyDisplayManagerAdvantageCombined.populateActionCheckBoxes();
	
	saliencyDisplayManagerRewardsDetailed.populateActionBarCheckBoxes();
	saliencyDisplayManagerAdvantageDetailed.populateActionBarCheckBoxes();
    activeSaliencyDisplayManager = getSaliencyDisplayManagerForSituation(true, true);
	configureInvisibleRewardChart(true, true);
    if (userStudyMode) {
        stateMonitor.showedCombinedRewards();
        stateMonitor.showedCombinedSaliency();
    }
	var actionName =  activeBarChartManager.getChosenActionName();
	processWhatClick();
}
function renderWhyInfo(explPoint) {
    if (userStudyMode) {
        if (studyTreatment.showAllSaliencyForTreatment1){
            prepareForSaliencyOnlyView(explPoint);
            return;
        }
    }
	clearExplanationInfo();
	clearDefaultSelections();
	createRewardChartContainer();
	activeExplanationPoint = explPoint;

	saliencyDisplayManagerRewardsCombined.populateActionCheckBoxes();
	saliencyDisplayManagerAdvantageCombined.populateActionCheckBoxes();
	
	saliencyDisplayManagerRewardsDetailed.populateActionBarCheckBoxes();
	saliencyDisplayManagerAdvantageDetailed.populateActionBarCheckBoxes();
    activeSaliencyDisplayManager = getSaliencyDisplayManagerForSituation(true, true);
	configureRewardChart(true, true);
    if (userStudyMode) {
        stateMonitor.showedCombinedRewards();
        stateMonitor.showedCombinedSaliency();
    }
	var actionName =  activeBarChartManager.getChosenActionName();
	var fullName = 'D' + showingDecisionNumber + ': ' + actionName;
	var whyPrompt = " had highest predicted reward. ";
	$("#why-action-label").html(fullName);
	$("#why-action-label").css("font-size", 14);
	$("#why-action-label").css("padding-right", 20);
	$("#why-action-label").css("font-weight", "bold");
	$("#why-label").html(whyPrompt);
	$("#why-label").css("font-size", 14);
	$("#why-label").css("padding-right", 20);
    populateRewardQuestionSelector();
    if (userStudyMode){
        if (studyTreatment.showSaliencyAll){
            addWhatButton();
        }
    }
    else {
        addWhatButton();
    }
	if (salienciesAreShowing || saliencyKeepAlive){
		processWhatClick();
	}
}

function initSaliencyContainers(){
	var saliency = activeExplanationPoint.getSaliency();
    saliencyLookupMap = saliency.getSaliencyMapMap();
	populateSaliencyQuestionSelector();
	createSaliencyContainers();
    activeSaliencyDisplayManager = getSaliencyDisplayManagerForSituation(isCombinedView, isRewardMode);
    var chosenSaliencyMode = saliencyModeAggregate;
    if (userStudyMode) {
        if (studyTreatment.showAllSaliencyForTreatment1){
            chosenSaliencyMode = saliencyModeDetailed;
        }
    }
	activeSaliencyDisplayManager.setSaliencyMode(chosenSaliencyMode);
}
function updateSaliencyContainers(){
	activeSaliencyDisplayManager.renderExplanationSaliencyMaps();
	salienciesAreShowing = true;
}
function createRewardChartContainer() {
	var rewardTitleContainer = document.createElement("DIV");
	rewardTitleContainer.setAttribute("id", "rewards-titled-container");
	rewardTitleContainer.setAttribute("class", "flex-column titled-container r0c1 rewards-bg");
	$("#scaii-interface").append(rewardTitleContainer);

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

}

var saliencyCombined = true;

function populateSaliencyQuestionSelector(){
	$("#what-radios").empty();
	
	// SALIENCY SECTION
	var radioCombinedSaliency = document.createElement("input");
	radioCombinedSaliency.setAttribute("type","radio");
	radioCombinedSaliency.setAttribute("name","saliencyView");
	radioCombinedSaliency.setAttribute("id","relevance-combined-radio");
	radioCombinedSaliency.setAttribute("value","saliencyCombined");
	radioCombinedSaliency.setAttribute("style", "margin-left:20px;");
	radioCombinedSaliency.setAttribute("checked", "true");
	radioCombinedSaliency.onclick = function(e) {
        saliencyCombined = true;
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
	radioDetailedSaliency.onclick = function(e) {
        saliencyCombined = false;
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
	radioCombinedRewards.setAttribute("checked", "true");
	radioCombinedRewards.onclick = function(e) {
        targetClickHandler(e, "setRewardView:combinedRewards");
        if (userStudyMode) {
            stateMonitor.showedCombinedRewards();
        }
		showRewards(true, true);
	};

	var combinedRewardsLabel = document.createElement("div");
	combinedRewardsLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	combinedRewardsLabel.innerHTML = "combined rewards";

	var radioDetailedRewards = document.createElement("input");
	radioDetailedRewards.setAttribute("type","radio");
	radioDetailedRewards.setAttribute("id","radio-detailed-rewards");
	radioDetailedRewards.setAttribute("name","rewardView");
	radioDetailedRewards.setAttribute("value","rewardDetailed");
	radioDetailedRewards.setAttribute("style", "margin-left:20px; ");
	radioDetailedRewards.onclick = function(e) {
        targetClickHandler(e, "setRewardView:detailedRewards");
        if (userStudyMode) {
            stateMonitor.showedDetailedRewards();
        }
		showRewards(false, true);
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
        targetClickHandler(e, "setRewardView:combinedAdvantage");
        if (userStudyMode) {
            stateMonitor.showedCombinedAdvantage();
        }
		showRewards(true, false);
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
        targetClickHandler(e, "setRewardView:detailedAdvantage");
        if (userStudyMode) {
            stateMonitor.showedDetailedAdvantage();
        }
		showRewards(false, false);
	};

	var detailedAdvantageLabel = document.createElement("div");
	detailedAdvantageLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	detailedAdvantageLabel.innerHTML = "detailed advantage";
	
	$("#why-radios").append(radioCombinedAdvantage);
	$("#why-radios").append(combinedAdvantageLabel);
	$("#why-radios").append(radioDetailedAdvantage);
	$("#why-radios").append(detailedAdvantageLabel);

}


var renderActionName = function(explPoint){
	var title = explPoint.getTitle();
	$("#action-name-label").html(title);
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
        
        if (rewardsAreShowing) {
            targetClickHandler(e,"hideWhy:NA");
        }
        else {
            targetClickHandler(e,"showWhy:NA");
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
        if (salienciesAreShowing){
            targetClickHandler(e,"hideSaliency:NA");
        }
        else {
            targetClickHandler(e,"showSaliency:NA");
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
                if (activeStudyQuestionManager.isBeyondCurrentRange(step)){
                    targetClickHandler(evt, "clickActionLabelDenied:" + escapeAnswerFileDelimetersFromTextString(fullName));
                    return;
                }
                else {
                    targetClickHandler(evt, "clickActionLabel:" + escapeAnswerFileDelimetersFromTextString(fullName));
                }
            }
            jumpToStep(step);
		}
	});
	actionLabel.addEventListener("mouseenter", function(evt) {
        //$("#" + id).css("background-color","rgba(100,100,100,1.0);");
        if (userStudyMode){
            if (activeStudyQuestionManager.isBeyondCurrentRange(step)){
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

// function configureExplanationSelectorButton(step_count, step) {
// 	var totalWidth = expl_ctrl_canvas.width - 2*timelineMargin;
// 	var rectWidth = totalWidth / step_count;
// 	var leftX = timelineMargin + rectWidth * (step - 1);
// 	var y = explanationControlYPosition;
// 	var qmButton = document.createElement("BUTTON");
// 	var buttonId = getQmButtonId(step);
// 	questionMarkButtonIds.push(buttonId);
// 	qmButton.setAttribute("id", buttonId);
// 	var qm = document.createTextNode("?");
// 	qmButton.appendChild(qm);          
// 	qmButton.setAttribute("style", 'z-index:2; position:relative; left:' + leftX + 'px; top: -30px; padding-left:2px; padding-right:2px;font-family:Arial;');
	
// 	$("#explanation-control-panel").append(qmButton);
// 	$("#" + buttonId).click(function(e) {
// 		 e.preventDefault();
// 		 processWhyClick(step);
// 	})
// }

var selectedWhyButtonId = undefined;
var selectedQmButtonId = undefined;
var selectedDecisionStep = undefined;

function processWhyClick(step) {
	if (selectedDecisionStep == step){
		// toggle active buttons
		//$("#" + selectedQmButtonId).toggleClass('active');
		$("#" + selectedWhyButtonId).toggleClass('active');

		// clear explanation info
		clearExplanationInfo();
		selectedDecisionStep = undefined;
		selectedWhyButtonId = undefined;
		selectedQmButtonId = undefined;

		// engage selection color for supporting areas
		//$("#why-questions").toggleClass('active');
		//$("#why-label").toggleClass('active');
	}
	else if (selectedDecisionStep == undefined) {
		// toggle target buttons
		//selectedQmButtonId = getQmButtonId(step);
	 	selectedWhyButtonId = getWhyButtonIdForStep(step);
	 	selectedDecisionStep = step;
	 	//$("#" + selectedQmButtonId).toggleClass('active');
	 	$("#" + selectedWhyButtonId).toggleClass('active');
		// show explanation info for new step
		showExplanationRewardInfo(step);
		
		// engage selection color for supporting areas
		$("#why-questions").toggleClass('active');
		$("#why-label").toggleClass('active');
	}
	else {
		// (selectedDecisionStep == someOtherStep)
		// toggle active buttons
		$("#" + selectedQmButtonId).toggleClass('active');
		$("#" + selectedWhyButtonId).toggleClass('active');

		// clear explanation info
		//clearExplanationInfo();
		// toggle target buttons
		selectedQmButtonId = getQmButtonId(step);
	 	selectedWhyButtonId = getWhyButtonIdForStep(step);
	 	selectedDecisionStep = step;
	 	$("#" + selectedQmButtonId).toggleClass('active');
		$("#" + selectedWhyButtonId).toggleClass('active');
		 
		// show explanation info for new step
		showExplanationRewardInfo(step);

	}
}
var saliencyKeepAlive = false;
function processWhatClick() {
	if (saliencyKeepAlive) {
		initSaliencyContainers();
		activeSaliencyDisplayManager.renderCheckboxes();
		updateSaliencyContainers();
		saliencyKeepAlive = false;
	}
	else if (salienciesAreShowing) {
		clearSaliencies();
	}
	else {
		initSaliencyContainers();
		activeSaliencyDisplayManager.renderCheckboxes();
		updateSaliencyContainers();
	}
	 $("#what-questions").toggleClass('saliency-active');
	 $("#what-label").toggleClass('saliency-active');
}


function getQmButtonId(step) {
	return 'qmButton' + step;
}
function getWhyButtonIdForStep(step) {
	return 'whyButton'+ step;
}
function showExplanationRewardInfo(stepNumber) {
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.EXPLAIN);
	var args = ['' +stepNumber];
	userCommand.setArgsList(args);
	stageUserCommand(userCommand);
	
	if (stepNumber == sessionIndexManager.getCurrentIndex()) {
		//console.log("no need to move - already at step with explanation");
	}
	else {
		jumpToStep(newStep);
	}
}

var explanationPointBigDiamondHalfWidth = 22;
var explanationPointSmallDiamondHalfWidth = 16;
function configureExplanationSelectorDiamond(uiIndex,step){
	var widthOfTimeline = expl_ctrl_canvas.width - 2*timelineMargin;
	var value = sessionIndexManager.getPercentIntoGameForStep(step);
	var x = timelineMargin + (value / 100) * widthOfTimeline;
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
                showExplanationRewardInfo(step);
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
		if (rewardsAreShowing){
			// send a request to back end for focusing on this new step
			processWhyClick(step);
			// but salienciesAreShowing is cleared by default on loading new explanation point
			if (salienciesAreShowing){
				// so we force saliency to stay visible across a round trip request to back using a keepAlive flag
				saliencyKeepAlive = true;
			}
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

var dummy = function(){
	
}