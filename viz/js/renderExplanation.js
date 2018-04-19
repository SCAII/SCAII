google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var googleChart;
var explanations = [];
var explanationBoxMap = {};
var saliencyLookupMap = {};
var saliencyDisplayManager = getSaliencyDisplayManager();
var selectionManager;

function clearExplanationInfo() {
	$("#saliency-maps").empty();
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	$("#saliency-checkboxes").empty();
}



function handleExplDetails(explDetails){
	//console.log('handling expl details');
	if (explDetails.hasExplPoint()){
		explanationPoint = explDetails.getExplPoint();
		//console.log('got expl point for step ' + explanationPoint.getStep());
		renderExplanationPoint(explanationPoint);
	}
	else {
		console.log("MISSING expl point!");
	}
}


function getSelectionManager() {
	var sm = {};
	sm.isAggregate = true;
	sm.aggregateSelections = [];
	sm.detailedSelections  = [];
	
	sm.setAggregate = function(boolValue){
		this.isAggregate = boolValue;
	}
	
	sm.setSelections = function(info) {
		if (this.isAggregate){
			this.aggregateSelections = info;
		}
		else {
			this.detailedSelections = info;
		}
	}
	
	sm.addSelection = function(selection) {
		if (this.isAggregate){
			this.aggregateSelections.push(selection);
		}
		else {
			this.detailedSelections.push(selection);
		}
		
	}
	sm.getSelections = function(){
		if (this.isAggregate){
			return this.aggregateSelections;
		}
		else {
			return this.detailedSelections;
		}
	}
	return sm;
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
		
		if (matchingStep == sessionIndexManager.getCurrentIndex()) {
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


function renderExplanationPoint(explPoint){
	activeBarChartInfo = explPoint.getBarChart();
	addHelperFunctionsToBarChartInfo(activeBarChartInfo);

	renderActionName(explPoint);
	var saliency = explPoint.getSaliency();
	saliencyLookupMap = saliency.getSaliencyMapMap();
	
	selectionManager = getSelectionManager();
	saliencyDisplayManager.setSelectionManager(selectionManager);
	activeBarChartInfo.setSelectionManager(selectionManager);
	
	activeBarChartInfo.setAggregate(true); 
	activeBarChartInfo.setDefaultSelections();
	activeBarChartInfo.renderExplanationBarChart();
	
	renderTabActiveActionRewards();
	populateSaliencyQuestionSelector();
	//renderTabCombinedSaliency();
	saliencyDisplayManager.populateCheckBoxes(true);
	saliencyDisplayManager.displayAnswerToSaliencyQuestion();
}

function populateSaliencyQuestionSelector(){
	$("#saliency-question-selector").append($('<option>', {
			value: 0,
			text: saliencyQuestionAggregate
	}));	
	$("#saliency-question-selector").append($('<option>', {
			value: 1,
			text: saliencyQuestionDetailed
	}));
}

function showRewardsPerAction(evt) {
	renderTabActiveActionRewards();
	showRewards(true);
}

function showRewardsPerRewardType(evt) {
    renderTabActiveRewardTypes();
	showRewards(false);
}

function showRewards(isAggregate) {
	activeBarChartInfo.setAggregate(isAggregate);
	activeBarChartInfo.setDefaultSelections();
	activeBarChartInfo.renderExplanationBarChart();
	
	saliencyDisplayManager.populateCheckBoxes(isAggregate);
	saliencyDisplayManager.renderExplanationSaliencyMaps();
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
	//console.log("explanation count is " + explanation_steps.length);
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