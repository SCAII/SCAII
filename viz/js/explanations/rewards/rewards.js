
function configureInvisibleRewardChart(displayModeKey) {
    replayState.rewardView = displayModeKey;
	activeBarChartManager = barChartManagers[displayModeKey];
	if (!wasDefaultSelectionDone(displayModeKey)){
		activeBarChartManager.setDefaultSelections();
		rememberDefaultSelection(displayModeKey);
	}
	replayState.rewardsAreShowing = false;
}

function configureRewardChart(displayModeKey) {
    replayState.rewardView = displayModeKey;
	activeBarChartManager = barChartManagers[displayModeKey];
	if (!wasDefaultSelectionDone(displayModeKey)){
		activeBarChartManager.setDefaultSelections();
		rememberDefaultSelection(displayModeKey);
	}
	activeBarChartManager.renderExplanationBarChart();
	replayState.rewardsAreShowing = true;
}

function restoreChartIfReturningToTab(step){
    if (isTargetStepChartVisible()) {
        var targetStep = getTargetStepFromReturnInfo();
        if (targetStep != undefined && targetStep == step) {
            processWhyClick(step);
        }
    }
}

function getWhyButtonIdForStep(step) {
	return 'whyButton'+ step;
}