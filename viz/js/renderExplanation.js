google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var chart;
var explanations = [];
var explanationBoxMap = {};

const chartModeAggregate = "show values for Bar Group";
const chartModeDetailed = "show values for Reward Type";
var chartMode = chartModeAggregate;

var saliencyMapPercentSize = 0.75;

var chosenSaliencyIdForAggregate = undefined;
var chosenAggregateCoordKey = undefined;

var chosenSaliencyIdForDetailed = undefined;
var chosenDetailCoordKey = undefined;
//
// when clicking on a bar, the saliency will be looked up as follows:
// we'll know which mode we are displaying (aggregate vs details)
// if aggregate, we get the 
//
//
var saliencyCoordinatesMap = {};
var saliencyLookupMap = {};
var curExplPt = undefined;
var explanationControlYPosition = 14;

function clearExplanationInfo() {
	$("#saliency-maps").empty();
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
}

expl_ctrl_canvas.addEventListener('click', function (event) {
	var matchingStep = getMatchingExplanationStep(expl_ctrl_ctx, event.offsetX, event.offsetY);
	console.log('clicked on step ' + selectedExplanationStep);	
	if (matchingStep == undefined){
		// ignore click if not on one of the selectors
	}
	else if (matchingStep == selectedExplanationStep) {
		selectedExplanationStep = undefined;
		clearExplanationInfo();
	}
	else{
		selectedExplanationStep = matchingStep;
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.EXPLAIN);
		var args = ['' +selectedExplanationStep];
		userCommand.setArgsList(args);
		stageUserCommand(userCommand);
		
		if (matchingStep == currentStep) {
			console.log("no need to move - already at step with explanation");
		}
		else {
			var userCommand = new proto.scaii.common.UserCommand;
			console.log("jumping to step " + selectedExplanationStep);
			userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
			// same args as above
			userCommand.setArgsList(args);
			stageUserCommand(userCommand);
		}
	}	
	renderExplanationSelectors(replaySessionConfig,selectedExplanationStep);
});


function handleExplDetails(explDetails){
	console.log('handling expl details');
	if (explDetails.hasExplPoint()){
		explanationPoint = explDetails.getExplPoint();
		console.log('got expl point for step ' + explanationPoint.getStep());
		renderExplanationPoint(explanationPoint);
	}
	else {
		console.log("MISSING expl point!");
	}
}

function showRewardsPerAction(evt) {
	chartMode = chartModeAggregate;
	renderTabActiveActionRewards();
	if (undefined == chosenSaliencyIdForAggregate){
		setCuesForFavoredAction(curExplPt);
	}
	
	var barChart = curExplPt.getBarChart();
	renderExplanationBarChart(barChart, chartMode, chosenAggregateCoordKey);
	renderExplanationSaliencyMaps(chosenSaliencyIdForAggregate);
}

function showRewardsPerRewardType(evt) {
	chartMode = chartModeDetailed;
    renderTabActiveRewardTypes();
	if (undefined == chosenSaliencyIdForDetailed){
		setCuesForFavoredActionsHighestReward(curExplPt);
	}
	
	var barChart = curExplPt.getBarChart();
	renderExplanationBarChart(barChart, chartMode,chosenDetailCoordKey);
	renderExplanationSaliencyMaps(chosenSaliencyIdForDetailed);
}
var getMaxValueBarGroup = function(barGroups){
	var barGroupWithMaxValue = undefined;
	for (var i in barGroups) {
		barGroup = barGroups[i];
		if (barGroupWithMaxValue == undefined) {
			barGroupWithMaxValue = barGroup;
		}
		else {
			var curValue = getValueForBarGroup(barGroup);
			var maxValue = getValueForBarGroup(barGroupWithMaxValue);
			if (curValue > maxValue) {
				barGroupWithMaxValue = barGroup;
			}
		}
	}
	return barGroupWithMaxValue;
}

var getMaxValueBarGroupIndex = function(barGroups){
	var barGroupWithMaxValue = undefined;
	var barGroupWithMaxValueIndex = undefined;
	for (var i in barGroups) {
		barGroup = barGroups[i];
		if (barGroupWithMaxValue == undefined) {
			barGroupWithMaxValue = barGroup;
			barGroupWithMaxValueIndex = i;
		}
		else {
			var curValue = getValueForBarGroup(barGroup);
			console.log('value of bar group is ' + curValue);
			var maxValue = getValueForBarGroup(barGroupWithMaxValue);
			if (curValue > maxValue) {
				barGroupWithMaxValue = barGroup;
				barGroupWithMaxValueIndex = i;
			}
		}
	}
	return barGroupWithMaxValueIndex;
}
var populateSaliencyCoordinatesMap = function(explPoint) {
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	for (var i in barGroups) {
		var barGroup = barGroups[i];
		var saliencyId = barGroup.getSaliencyId();
		// only one column of data for aggregate (i.e. barGroup) data
		var coordsKey = getDataCoordinatesKey(i, 0, true);
		console.log('populating... ' + coordsKey + '  ' + saliencyId);
		saliencyCoordinatesMap[coordsKey] = saliencyId;
		var bars = barGroup.getBarsList();
		for (var j in bars){
			var bar = bars[j];
			var col = Number(j);
			var saliencyId = bar.getSaliencyId();
			var coordsKey = getDataCoordinatesKey(i, col, false);
			console.log('populating... ' + coordsKey + '  ' + saliencyId);
			saliencyCoordinatesMap[coordsKey] = saliencyId;
		}
	}
}

function renderExplanationPoint(explPoint){
	curExplPt = explPoint;
	renderActionName(explPoint);
	populateSaliencyCoordinatesMap(explPoint);
	var saliency = explPoint.getSaliency();
	saliencyLookupMap = saliency.getSaliencyMapMap();
	var keys = saliencyLookupMap.keys();
	console.log('keys for lookup map : ' + keys);
	chartMode = chartModeAggregate; // default to highest score, aggregate i.e. highest scoring task
	
	setCuesForFavoredAction(explPoint);
	var barChart = explPoint.getBarChart();
	renderExplanationBarChart(barChart, chartMode, chosenAggregateCoordKey);
	renderTabActiveActionRewards();
	renderExplanationSaliencyMaps(chosenSaliencyIdForAggregate);
}

function setCuesForFavoredAction(explPoint){
	// look through the data to discover which saliency to express
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	var barGroup = getMaxValueBarGroup(barGroups);
	var barGroupValue = getValueForBarGroup(barGroup);
	var maxValueBarGroupIndex = getMaxValueBarGroupIndex(barGroups);
	console.log("AGGREGATE SALIENCY: chose index " + maxValueBarGroupIndex + "for bar value of " + barGroupValue);
	chosenAggregateCoordKey = getDataCoordinatesKey(maxValueBarGroupIndex, 0, true);
	chosenSaliencyIdForAggregate = saliencyCoordinatesMap[chosenAggregateCoordKey];
}

function setCuesForFavoredActionsHighestReward(explPoint){
	// look through the data to discover which saliency to express
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	var maxValueBarGroupIndex = getMaxValueBarGroupIndex(barGroups);
	var barGroup = getMaxValueBarGroup(barGroups);
	
	var bars = barGroup.getBarsList();
	var maxBarIndex = undefined;
	var max = 0.0;
	for (var i in bars){
		var bar = bars[i];
		var value = bar.getValue();
		if  (maxBarIndex == undefined) {
			maxBarIndex = i;
			max = value;
		}
		else if (value > max) {
			maxBarIndex = i;
			max = value;
		}
		else {
			//skip
		}
	}
	console.log("DETAIL SALIENCY: chose index " + maxBarIndex + "for bar value of " + max);
	chosenDetailCoordKey = getDataCoordinatesKey(maxValueBarGroupIndex, maxBarIndex, false);
	chosenSaliencyIdForDetailed = saliencyCoordinatesMap[chosenDetailCoordKey];
}
var renderActionName = function(explPoint){
	var title = explPoint.getTitle();
	$("#action-name-label").html(title);
}


const chartModeAggregate = "show values for Bar Group";
const chartModeDetailed = "show values for Reward Type";
var chartMode = chartModeAggregate;

var saliencyMapPercentSize = 0.75;

var chosenSaliencyIdForAggregate = undefined;
var chosenAggregateCoordKey = undefined;

var chosenSaliencyIdForDetailed = undefined;
var chosenDetailCoordKey = undefined;
//
// when clicking on a bar, the saliency will be looked up as follows:
// we'll know which mode we are displaying (aggregate vs details)
// if aggregate, we get the 
//
//
var saliencyCoordinatesMap = {};
var saliencyLookupMap = {};
var curExplPt = undefined;

function showRewardsPerAction(evt) {
	chartMode = chartModeAggregate;
	renderTabActiveActionRewards();
	if (undefined == chosenSaliencyIdForAggregate){
		setCuesForFavoredAction(curExplPt);
	}
	
	var barChart = curExplPt.getBarChart();
	renderExplanationBarChart(barChart, chartMode, chosenAggregateCoordKey);
	renderExplanationSaliencyMaps(chosenSaliencyIdForAggregate);
}

function showRewardsPerRewardType(evt) {
	chartMode = chartModeDetailed;
    renderTabActiveRewardTypes();
	if (undefined == chosenSaliencyIdForDetailed){
		setCuesForFavoredActionsHighestReward(curExplPt);
	}
	
	var barChart = curExplPt.getBarChart();
	renderExplanationBarChart(barChart, chartMode,chosenDetailCoordKey);
	renderExplanationSaliencyMaps(chosenSaliencyIdForDetailed);
}
var getMaxValueBarGroup = function(barGroups){
	var barGroupWithMaxValue = undefined;
	for (var i in barGroups) {
		barGroup = barGroups[i];
		if (barGroupWithMaxValue == undefined) {
			barGroupWithMaxValue = barGroup;
		}
		else {
			var curValue = getValueForBarGroup(barGroup);
			var maxValue = getValueForBarGroup(barGroupWithMaxValue);
			if (curValue > maxValue) {
				barGroupWithMaxValue = barGroup;
			}
		}
	}
	return barGroupWithMaxValue;
}

var getMaxValueBarGroupIndex = function(barGroups){
	var barGroupWithMaxValue = undefined;
	var barGroupWithMaxValueIndex = undefined;
	for (var i in barGroups) {
		barGroup = barGroups[i];
		if (barGroupWithMaxValue == undefined) {
			barGroupWithMaxValue = barGroup;
			barGroupWithMaxValueIndex = i;
		}
		else {
			var curValue = getValueForBarGroup(barGroup);
			console.log('value of bar group is ' + curValue);
			var maxValue = getValueForBarGroup(barGroupWithMaxValue);
			if (curValue > maxValue) {
				barGroupWithMaxValue = barGroup;
				barGroupWithMaxValueIndex = i;
			}
		}
	}
	return barGroupWithMaxValueIndex;
}
var populateSaliencyCoordinatesMap = function(explPoint) {
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	for (var i in barGroups) {
		var barGroup = barGroups[i];
		var saliencyId = barGroup.getSaliencyId();
		// only one column of data for aggregate (i.e. barGroup) data
		var coordsKey = getDataCoordinatesKey(i, 0, true);
		console.log('populating... ' + coordsKey + '  ' + saliencyId);
		saliencyCoordinatesMap[coordsKey] = saliencyId;
		var bars = barGroup.getBarsList();
		for (var j in bars){
			var bar = bars[j];
			var col = Number(j);
			var saliencyId = bar.getSaliencyId();
			var coordsKey = getDataCoordinatesKey(i, col, false);
			console.log('populating... ' + coordsKey + '  ' + saliencyId);
			saliencyCoordinatesMap[coordsKey] = saliencyId;
		}
	}
}

function renderExplanationPoint(explPoint){
	curExplPt = explPoint;
	renderActionName(explPoint);
	populateSaliencyCoordinatesMap(explPoint);
	var saliency = explPoint.getSaliency();
	saliencyLookupMap = saliency.getSaliencyMapMap();
	var keys = saliencyLookupMap.keys();
	console.log('keys for lookup map : ' + keys);
	chartMode = chartModeAggregate; // default to highest score, aggregate i.e. highest scoring task
	
	setCuesForFavoredAction(explPoint);
	var barChart = explPoint.getBarChart();
	renderExplanationBarChart(barChart, chartMode, chosenAggregateCoordKey);
	renderTabActiveActionRewards();
	renderExplanationSaliencyMaps(chosenSaliencyIdForAggregate);
}

function setCuesForFavoredAction(explPoint){
	// look through the data to discover which saliency to express
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	var barGroup = getMaxValueBarGroup(barGroups);
	var barGroupValue = getValueForBarGroup(barGroup);
	var maxValueBarGroupIndex = getMaxValueBarGroupIndex(barGroups);
	console.log("AGGREGATE SALIENCY: chose index " + maxValueBarGroupIndex + "for bar value of " + barGroupValue);
	chosenAggregateCoordKey = getDataCoordinatesKey(maxValueBarGroupIndex, 0, true);
	chosenSaliencyIdForAggregate = saliencyCoordinatesMap[chosenAggregateCoordKey];
}

function setCuesForFavoredActionsHighestReward(explPoint){
	// look through the data to discover which saliency to express
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	var maxValueBarGroupIndex = getMaxValueBarGroupIndex(barGroups);
	var barGroup = getMaxValueBarGroup(barGroups);
	
	var bars = barGroup.getBarsList();
	var maxBarIndex = undefined;
	var max = 0.0;
	for (var i in bars){
		var bar = bars[i];
		var value = bar.getValue();
		if  (maxBarIndex == undefined) {
			maxBarIndex = i;
			max = value;
		}
		else if (value > max) {
			maxBarIndex = i;
			max = value;
		}
		else {
			//skip
		}
	}
	console.log("DETAIL SALIENCY: chose index " + maxBarIndex + "for bar value of " + max);
	chosenDetailCoordKey = getDataCoordinatesKey(maxValueBarGroupIndex, maxBarIndex, false);
	chosenSaliencyIdForDetailed = saliencyCoordinatesMap[chosenDetailCoordKey];
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

function renderExplanationSelectors(rsc, selectedStep) {
	explanationBoxMap = {};
	var explanation_steps = rsc.getExplanationStepsList();
	var explanation_titles = rsc.getExplanationTitlesList();
	console.log("explanation count is " + explanation_steps.length);
	var expl_count = explanation_steps.length;
	var index = 0;
	while (index < expl_count){
		var step = explanation_steps[index];
		var selected = false;
		if (selectedStep == step){
			selected = true;
		}
		var title = explanation_titles[index];
		configureExplanationSelector(rsc.getStepCount(), step, title, selected);
		index = index + 1;
	}
}

var configureExplanationSelector = function(step_count, step, title, selected){
	var totalWidth = expl_ctrl_canvas.width;
	var rectWidth = totalWidth / step_count;
	var leftX = rectWidth * step;
	var rightX = rectWidth * (step + 1);
	var upperLeftX = leftX;
	var distFromLine = 8
	var upperLeftY = explanationControlYPosition - distFromLine;
	var ctx = expl_ctrl_ctx;
	ctx.beginPath();
	if (selected){
		ctx.fillStyle = 'yellow';
	}
	else {
		ctx.fillStyle = 'blue';
	}
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'black';
	var leftVertexX = leftX;
	var leftVertexY = explanationControlYPosition;
	var rightVertexX = rightX;
	var rightVertexY = explanationControlYPosition;
	var topVertexX = leftVertexX + (rightVertexX - leftVertexX)/2 ;
	var topVertexY = explanationControlYPosition - distFromLine;
	var bottomVertexX = topVertexX;
	var bottomVertexY = explanationControlYPosition + distFromLine;
	
	ctx.moveTo(leftVertexX, leftVertexY);
	ctx.lineTo(topVertexX,topVertexY);
	ctx.lineTo(rightVertexX, rightVertexY);
	ctx.lineTo(bottomVertexX, bottomVertexY);
	ctx.lineTo(leftVertexX, leftVertexY);
	ctx.closePath();
	ctx.fill();
	
	var rectHeight = distFromLine + distFromLine + 1;
	//ctx.rect(upper_left_x, upper_left_y, rect_width, rect_height);
	var eBox = getExplanationBox(leftX,rightX,upperLeftY, upperLeftY + rectHeight, step);
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
