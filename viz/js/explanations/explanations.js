google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var dummy = function(){}

var googleChart;
var saliencyLookupMap = {};
var showingDecisionNumber;

var selectionManagers = {};
var saliencyDisplayManagers = {};
var barChartManagers = {};
function initExplanationFields(replayState){
    replayState.saliencyCombined = true;
    replayState.rewardsAreShowing = false;
    replayState.salienciesAreShowing =false;
    replayState.rewardView = "rewards.combined";
    // save off explPoint message

}
var activeSaliencyDisplayManager = undefined;
var activeBarChartManager = undefined;
var activeExplanationPoint = undefined;
function initSelectionManagersForExplanation() {
    selectionManagers["rewards.combined"] = getSelectionManager();
    selectionManagers["rewards.detailed"] = getSelectionManager();
    selectionManagers["advantage.combined"] = getSelectionManager();
    selectionManagers["advantage.detailed"] = getSelectionManager();
}

function initSaliencyDisplayManagers(){
    saliencyDisplayManagers["rewards.combined"] = getSaliencyDisplayManager(selectionManagers["rewards.combined"]);
    saliencyDisplayManagers["rewards.detailed"] = getSaliencyDisplayManager(selectionManagers["rewards.detailed"]);
    saliencyDisplayManagers["advantage.combined"] = getSaliencyDisplayManager(selectionManagers["advantage.combined"]);
    saliencyDisplayManagers["advantage.detailed"] = getSaliencyDisplayManager(selectionManagers["advantage.detailed"]);
    replayState.rewardView = getTargetDisplayModeFromTabManager(replayState.rewardView);
    activeSaliencyDisplayManager = saliencyDisplayManagers[replayState.rewardView];
}

function initChartManagers(barChartMessage) {
    barChartManagers["rewards.combined"] = getBarChartManager(barChartMessage,selectionManagers["rewards.combined"],saliencyDisplayManagers["rewards.combined"],true, true);
	barChartManagers["rewards.detailed"] = getBarChartManager(barChartMessage,selectionManagers["rewards.detailed"],saliencyDisplayManagers["rewards.detailed"], false, true);
	barChartManagers["advantage.combined"] = getBarChartManager(barChartMessage,selectionManagers["advantage.combined"],saliencyDisplayManagers["advantage.combined"], true, false);
	barChartManagers["advantage.detailed"] = getBarChartManager(barChartMessage,selectionManagers["advantage.detailed"],saliencyDisplayManagers["advantage.detailed"], false, false);
    replayState.rewardView = getTargetDisplayModeFromTabManager(replayState.rewardView);
    activeBarChartManager = barChartManagers[replayState.rewardView];
}

function handleExplDetails(explDetails){
	if (explDetails.hasExplPoint()){
        explanationPoint = explDetails.getExplPoint();
        initSelectionManagersForExplanation();
		initSaliencyDisplayManagers();
		var barChartMessage = explanationPoint.getBarChart();
		initChartManagers(barChartMessage);
        renderWhyInfo(explanationPoint);
	}
	else {
		console.log("MISSING expl point!");
	}
}

function showRewards(displayModeKey) {
    replayState.rewardView = displayModeKey;
	activeSaliencyDisplayManager = saliencyDisplayManagers[displayModeKey];
    configureRewardChart(displayModeKey);
    // NEW_SAL  treatment# affects which saliencies to show
    // NEW_SAL  userStudyMode yes/no
    if (userStudyMode) {
        if (!studyTreatment.showSaliencyAll){
            // bypass showing saliency 
            return;
        }
    }

	if (replayState.salienciesAreShowing){
        // NEW_SAL  shown yes/no
		if (replayState.saliencyCombined) {
             // NEW_SAL  combined yes/no
			activeSaliencyDisplayManager.setSaliencyMode(saliencyModeAggregate);
		}
		else {
			activeSaliencyDisplayManager.setSaliencyMode(saliencyModeDetailed);
        }
        // NEW_SAL  checkboxes were used as proxy selection control - they will go
		if (showCheckboxes) {
			activeSaliencyDisplayManager.renderCheckboxes();
		}
		activeSaliencyDisplayManager.renderExplanationSaliencyMaps();
	}
}


function renderWhyInfo(explPoint) {
    if (userStudyMode) {
        if (studyTreatment.showAllSaliencyForTreatment1){
            prepareForSaliencyOnlyView(explPoint);
            return;
        }
    }
	fullClearExplanationInfo();
	clearDefaultSelections();
	createRewardChartContainer();
	activeExplanationPoint = explPoint;

	saliencyDisplayManagers["rewards.combined"].populateActionCheckBoxes();
	saliencyDisplayManagers["rewards.detailed"].populateActionBarCheckBoxes();
	saliencyDisplayManagers["advantage.combined"].populateActionCheckBoxes();
	saliencyDisplayManagers["advantage.detailed"].populateActionBarCheckBoxes();
    activeSaliencyDisplayManager = saliencyDisplayManagers[replayState.rewardView];
	configureRewardChart(replayState.rewardView);
    if (userStudyMode) {
        // NEW_CHART  display mode varieties - used to have 4 due to advantage/reward and combined/vsdetailed.  But now we have ????  
        stateMonitor.setRewardDisplayModeByKey(replayState.rewardView);
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
    
    var revivedCachedSaliencyState = false;
    if (userStudyMode){
        if (studyTreatment.showSaliencyAll){
            addWhatButton();
            var currentStep = activeStudyQuestionManager.squim.getCurrentStep();
            revivedCachedSaliencyState = restoreSaliencyIfReturningToTab(currentStep);
        }
    }
    else {
        addWhatButton();
    }
	if ((replayState.salienciesAreShowing || saliencyKeepAlive)  && !revivedCachedSaliencyState){
		processWhatClick();
	}
}


var selectedWhyButtonId = undefined;
var selectedDecisionStep = undefined;

function showChart(step){
    selectedDecisionStep = step;
    askBackendForExplanationRewardInfo(step);
} 
function processWhyClick(step) {
    
	if (selectedDecisionStep == step){
        // NEW_CHART  toggling why button click shows/hides chart
		// toggle active buttons
		$("#" + selectedWhyButtonId).toggleClass('active');

		// clear explanation info
		fullClearExplanationInfo();
		selectedDecisionStep = undefined;
		selectedWhyButtonId = undefined;

		// engage selection color for supporting areas
		//$("#why-questions").toggleClass('active');
		//$("#why-label").toggleClass('active');
	}
	else if (selectedDecisionStep == undefined) {
        // NEW_CHART  clicking why button click shows chart
		// toggle target buttons
	 	selectedWhyButtonId = getWhyButtonIdForStep(step);
	 	$("#" + selectedWhyButtonId).toggleClass('active');
		// show explanation info for new step
		showChart(step);
		
		// engage selection color for supporting areas
		$("#why-questions").toggleClass('active');
		$("#why-label").toggleClass('active');
	}
	else {
		// (selectedDecisionStep == someOtherStep)
		// toggle active buttons
		$("#" + selectedWhyButtonId).toggleClass('active');
		// toggle target buttons
	 	selectedWhyButtonId = getWhyButtonIdForStep(step);
		$("#" + selectedWhyButtonId).toggleClass('active');
		 
		// show explanation info for new step
        showChart(step);
	}
}

function askBackendForExplanationRewardInfo(stepNumber) {
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