
var saliencyKeepAlive = false;

function showSaliencies() {
    initSaliencyContainers();
	activeSaliencyDisplayManager.renderCheckboxes();
	updateSaliencyContainers();
}
function processWhatClick() {
    // NEW_SAL saliency kepp alive still needed?
	if (saliencyKeepAlive) {
		showSaliencies();
		saliencyKeepAlive = false;
	}
	else if (replayState.salienciesAreShowing) {
		clearSaliencies();
	}
	else {
		showSaliencies();
	}
	 $("#what-questions").toggleClass('saliency-active');
	 $("#what-label").toggleClass('saliency-active');
}


function prepareForSaliencyOnlyView(explPoint){
    fullClearExplanationInfo();
	clearDefaultSelections();
	//createRewardChartContainer();
	activeExplanationPoint = explPoint;

	saliencyDisplayManagers["rewards.combined"].populateActionCheckBoxes();
	saliencyDisplayManagers["rewards.detailed"].populateActionBarCheckBoxes();
	saliencyDisplayManagers["advantage.combined"].populateActionCheckBoxes();
	saliencyDisplayManagers["advantage.detailed"].populateActionBarCheckBoxes();

    activeSaliencyDisplayManager = saliencyDisplayManagers["rewards.combined"];
	configureInvisibleRewardChart("rewards.combined");
    if (userStudyMode) {
        stateMonitor.showedCombinedRewards();
        stateMonitor.showedCombinedSaliency();
    }
	var actionName =  activeBarChartManager.getChosenActionName();
	processWhatClick();
}


function initSaliencyContainers(){
	var saliency = activeExplanationPoint.getSaliency();
    saliencyLookupMap = saliency.getSaliencyMapMap();
	populateSaliencyQuestionSelector();
	createSaliencyContainers();
    activeSaliencyDisplayManager = saliencyDisplayManagers[replayState.rewardView];
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
	replayState.salienciesAreShowing = true;
}

function restoreSaliencyIfReturningToTab(step){
    if (isTargetStepSaliencyVisible()){
        replayState.salienciesAreShowing = true;
        saliencyKeepAlive = true;
        var targetStep = getTargetStepFromReturnInfo();
        if (targetStep != undefined && targetStep == step) {
            processWhatClick();
            if (isTargetStepSaliencyCombined()){
                $("#relevance-combined-radio").click();
            }
            else {
                $("#relevance-detailed-radio").click();
            }
            var mapIdToHighlight = getTargetStepSaliencyMapToHighlight();
            if (mapIdToHighlight!= undefined) {
                activeSaliencyDisplayManager.showSaliencyMapOutline(mapIdToHighlight);
            }
            return true;
        }
    }
    return false;
}
