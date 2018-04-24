google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var googleChart;
var explanations = [];
var explanationBoxMap = {};
var saliencyLookupMap = {};
var saliencyDisplayManager = getSaliencyDisplayManager();
var selectionManager;
var rewardsAreShowing = false;
var salienciesAreShowing = false;
var questionMarkButtonIds =[];
var activeExplanationPoint = undefined;

function clearExplanationInfo() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	$("#saliency-checkboxes").empty();
	removeStaleQuestionMarkButtons();
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
}
function clearQuestionControls(){
	$("#why-questions").empty();
	$("#what-button-div").empty();
	$("#reward-question-selector").empty();
	$("#why-label").html(" ");

}

function handleExplDetails(explDetails){
	//console.log('handling expl details');
	if (explDetails.hasExplPoint()){
		explanationPoint = explDetails.getExplPoint();
		//console.log('got expl point for step ' + explanationPoint.getStep());
		renderWhyInfo(explanationPoint);
		//renderExplanationPoint(explanationPoint);
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

function renderWhyInfo(explPoint) {
	activeExplanationPoint = explPoint;
	activeBarChartInfo = explPoint.getBarChart();
	addHelperFunctionsToBarChartInfo(activeBarChartInfo);

	selectionManager = getSelectionManager();
	activeBarChartInfo.setSelectionManager(selectionManager);
	
	activeBarChartInfo.setAggregate(true); 
	activeBarChartInfo.setDefaultSelections();
	createRewardChartContainer();
	activeBarChartInfo.renderExplanationBarChart();
	var whyPrompt = "Why " + activeBarChartInfo.getChosenActionName() + ":";
	$("#why-label").html(whyPrompt);
	$("#why-label").css("font-size", 14);
	populateRewardQuestionSelector();
	addWhatButtonForAction();
}

function renderWhatInfo() {
    var saliency = activeExplanationPoint.getSaliency();
    saliencyLookupMap = saliency.getSaliencyMapMap();
	populateSaliencyQuestionSelector();
	createSaliencyContainers();
	saliencyDisplayManager.setSelectionManager(selectionManager);
    saliencyDisplayManager.populateCheckBoxes(true);
	saliencyDisplayManager.displayAnswerToSaliencyQuestion();
	salienciesAreShowing = true;
}
function createRewardChartContainer() {
	var rewardTitleContainer = document.createElement("DIV");
	rewardTitleContainer.setAttribute("id", "rewards-titled-container");
	rewardTitleContainer.setAttribute("class", "flex-column titled-container r0c1 rewards-bg");
	$("#scaii-interface").append(rewardTitleContainer);

	
	var rewardsTitle = document.createElement("DIV");
	rewardsTitle.setAttribute("id", "rewards-title");
	rewardsTitle.setAttribute("class", "rewards-bg");
	rewardsTitle.setAttribute("style", "margin:auto;");
	$("#rewards-titled-container").append(rewardsTitle);
	$("#rewards-title").html("Rewards and Punishments Were Learned");

	var explanationRewards = document.createElement("DIV");
	explanationRewards.setAttribute("id", "explanations-rewards");
	explanationRewards.setAttribute("class", "rewards-bg");
	explanationRewards.setAttribute("style", "margin-left:20px; margin-right: 20px;");
	$("#rewards-titled-container").append(explanationRewards);

	var whatDiv = document.createElement("DIV");
	whatDiv.setAttribute("id", "what-div");
	whatDiv.setAttribute("class", "flex-row rewards-bg question-dropdown");
	whatDiv.setAttribute("style", "margin:auto;");
	$("#rewards-titled-container").append(whatDiv);

	var whatButtonDiv = document.createElement("DIV");
	whatButtonDiv.setAttribute("id", "what-button-div");
	whatButtonDiv.setAttribute("class", "rewards-bg");
	//whatButtonDiv.setAttribute("style", "margin:auto;");
	$("#what-div").append(whatButtonDiv);
	
	var whatQuestionDiv = document.createElement("DIV");
	whatQuestionDiv.setAttribute("id", "what-questions");
	whatQuestionDiv.setAttribute("class", "rewards-bg");
	$("#what-div").append(whatQuestionDiv);
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

	var saliencySelections = document.createElement("DIV");
	saliencySelections.setAttribute("id", "saliency-selections");
	saliencySelections.setAttribute("class", "flex-column  saliencies-bg");
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
	saliencyMaps.setAttribute("class", "grid saliencies-bg");
	$("#saliency-maps-titled-container").append(saliencyMaps);
}

function renderExplanationPoint(explPoint){
	activeBarChartInfo = explPoint.getBarChart();
	addHelperFunctionsToBarChartInfo(activeBarChartInfo);

	//renderActionName(explPoint);
	var saliency = explPoint.getSaliency();
	saliencyLookupMap = saliency.getSaliencyMapMap();
	
	selectionManager = getSelectionManager();
	saliencyDisplayManager.setSelectionManager(selectionManager);
	activeBarChartInfo.setSelectionManager(selectionManager);
	
	activeBarChartInfo.setAggregate(true); 
	activeBarChartInfo.setDefaultSelections();
	activeBarChartInfo.renderExplanationBarChart();
	
	populateRewardQuestionSelector();
	//renderTabActiveActionRewards();
	populateSaliencyQuestionSelector();
	//renderTabCombinedSaliency();
	saliencyDisplayManager.populateCheckBoxes(true);
	saliencyDisplayManager.displayAnswerToSaliencyQuestion();
}

function populateSaliencyQuestionSelector(){
	$("#what-questions").empty();
	var saliencyQuestionSelector = document.createElement("SELECT");
	saliencyQuestionSelector.setAttribute("id", "saliency-question-selector");
	saliencyQuestionSelector.setAttribute("class", "question-selector");
	saliencyQuestionSelector.onchange = showSaliencyAnswer;
	//<select id="reward-question-selector"  class="question-selector" onchange="showRewardAnswer()"></select>
	$("#what-questions").append(saliencyQuestionSelector);
	$("#saliency-question-selector").append($('<option>', {
			value: 0,
			text: saliencyQuestionAggregate
	}));	
	$("#saliency-question-selector").append($('<option>', {
			value: 1,
			text: saliencyQuestionDetailed
	}));
}


function populateRewardQuestionSelector(){
	$("#why-questions").empty();
	
	var rewardQuestionSelector = document.createElement("SELECT");
	rewardQuestionSelector.setAttribute("id", "reward-question-selector");
	rewardQuestionSelector.setAttribute("class", "question-selector");
	rewardQuestionSelector.onchange = showRewardAnswer;
	//<select id="reward-question-selector"  class="question-selector" onchange="showRewardAnswer()"></select>
	$("#why-questions").append(rewardQuestionSelector);
	$("#reward-question-selector").toggleClass('active');
	$("#reward-question-selector").append($('<option>', {
			value: 0,
			text: rewardQuestionAggregate
	}));	
	$("#reward-question-selector").append($('<option>', {
			value: 1,
			text: rewardQuestionDetailed
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

function removeStaleQuestionMarkButtons() {
	for (id in questionMarkButtonIds){
		$("#" + id).remove();
	}
	questionMarkButtonIds = [];
}

function renderExplanationSelectors(rsc, selectedStep) {
	$("#action-list").empty();
	removeStaleQuestionMarkButtons();
	var decisionsLabel = document.createElement("LABEL");
	decisionsLabel.setAttribute("id", "decisions-label");
	decisionsLabel.setAttribute("style", getGridPositionStyle(1,0) + ';height: 30px; padding-top:10px;font-size: 18px;font-weight: bold;');
				
	$("#action-list").append(decisionsLabel);
	$("#decisions-label").text("Decisions");
	//explanationBoxMap = {};
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
		var uiIndex =index + 1;
		addLabelForAction(title, uiIndex);
		addWhyButtonForAction(step, uiIndex);
		configureExplanationSelectorButton(rsc.getStepCount(), step);
		index = index + 1;
	}
}

function addWhyButtonForAction(step, index) {
	var whyButton = document.createElement("BUTTON");
	var buttonId = getWhyButtonIdForStep(step);
	whyButton.setAttribute("id", buttonId);
	var why = document.createTextNode("why?");
	whyButton.appendChild(why);          
	whyButton.setAttribute("style", getGridPositionStyle(2,index) + ';margin-left: 40px;');
	
	$("#action-list").append(whyButton);
	$("#" + buttonId).click(function(e) {
		 e.preventDefault();
		 processWhyClick(step);
	})
}

function addWhatButtonForAction() {
	$("#what-button-div").empty();
	var whatButton = document.createElement("BUTTON");
	var buttonId = getWhatButtonId();
	whatButton.setAttribute("id", buttonId);
	var what = document.createTextNode("what?");
	whatButton.appendChild(what);    
	//whatButton.onclick = renderWhatInfo;      
	whatButton.setAttribute("style", "padding-top:6px; padding-left:6px; padding-bottom:6px; padding-right: 6px;");
	
	$("#what-button-div").append(whatButton);
	$("#" + buttonId).click(function(e) {
		 e.preventDefault();
		 processWhatClick();
	})
}
function addLabelForAction(title, index){
	var actionLabel = document.createElement("LABEL");
	var nameNoSpaces = title.replace(/ /g,"");
	var nameForId = nameNoSpaces.replace(/,/g,"");
	nameForId = nameForId + "actionLabel";
	actionLabel.setAttribute("id", nameForId);
	actionLabel.setAttribute("style", getGridPositionStyle(1,index) + ';height: 30; padding-top:10px;');
	var html = index + '.   ' + title;
	actionLabel.innerHTML = html;
	$("#action-list").append(actionLabel);
}

function configureExplanationSelectorButton(step_count, step) {
	var totalWidth = expl_ctrl_canvas.width;
	var rectWidth = totalWidth / step_count;
	var leftX = rectWidth * (step - 1) + 40;
	var y = explanationControlYPosition;
	var qmButton = document.createElement("BUTTON");
	var buttonId = getQmButtonId(step);
	questionMarkButtonIds.push(buttonId);
	qmButton.setAttribute("id", buttonId);
	var qm = document.createTextNode("?");
	qmButton.appendChild(qm);          
	qmButton.setAttribute("style", 'z-index:2; position:relative; left:' + leftX + 'px; top: -30px; padding-left:2px; padding-right:2px');
	
	$("#explanation-control-panel").append(qmButton);
	$("#" + buttonId).click(function(e) {
		 e.preventDefault();
		 processWhyClick(step);
	})
}

function processWhyClick(step) {
	if (rewardsAreShowing) {
		clearExplanationInfo();
		rewardsAreShowing = false;
	 }
	 else {
		showExplanationRewardInfo(step);
		rewardsAreShowing = true;
	 }
	 var qmButtonId = getQmButtonId(step);
	 var whyButtonId = getWhyButtonIdForStep(step);
	 $("#" + qmButtonId).toggleClass('active');
	 $("#" + whyButtonId).toggleClass('active');
	 $("#why-questions").toggleClass('active');
	 $("#why-label").toggleClass('active');
}

function processWhatClick() {
	if (salienciesAreShowing) {
		clearSaliencies();
	 }
	 else {
		renderWhatInfo();
	 }
	 var whatButtonId = getWhatButtonId();
	 //$("#" + whatButtonId).toggleClass('active');
	 $("#what-questions").toggleClass('saliency-active');
	 $("#what-label").toggleClass('saliency-active');
}

function getWhatButtonId() {
	return 'whatButton';
}

function getQmButtonId(step) {
	return 'qmButton' + step;
}
function getWhyButtonIdForStep(step) {
	return 'whyButton'+ step;
}
function showExplanationRewardInfo(stepNumber) {
	selectedExplanationStep = stepNumber;
	var userCommand = new proto.scaii.common.UserCommand;
	userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.EXPLAIN);
	var args = ['' +selectedExplanationStep];
	userCommand.setArgsList(args);
	stageUserCommand(userCommand);
	
	if (stepNumber == sessionIndexManager.getCurrentIndex()) {
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
	//renderExplanationSelectors(replaySessionConfig,selectedExplanationStep);
}

function configureExplanationSelectorDiamond(uiIndex, step_count, step, title, selected){
	var totalWidth = expl_ctrl_canvas.width;
	var rectWidth = totalWidth / step_count;
	var leftX = rectWidth * step + rectWidth/2;
	var rightX = rectWidth * (step + 1)  + rectWidth/2;
	var upperLeftX = leftX;
	var distFromLine = 12
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
	
	ctx.font = "16px Arial bold";
	ctx.fillStyle = 'black';
	var textCenterX = ((rightVertexX - leftVertexX) / 2) + leftVertexX - 8;
	var textCenterY = explanationControlYPosition + 5;
	ctx.fillText("?",textCenterX,textCenterY);

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