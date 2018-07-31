function getChartV2UI() {
	var ui = {};

	ui.whyButtonInfo = undefined;

	ui.renderChartDetailed = function (chartData) {
		createRewardChartContainer();
		//var canvasWidth = $("#explanations-rewards").width;
		//var canvasHeight = $("#explanations-rewards").height;
		//specify dimensions
		var canvasHeight = 500;
		var canvasWidth = 700;
		chartData.initChartDimensions(canvasHeight, canvasWidth, 0.5, 0.0);

		// create canvas
		var chartCanvas = document.createElement("canvas");
		chartCanvas.setAttribute("width", canvasWidth);
		chartCanvas.setAttribute("height", canvasHeight);
		chartCanvas.setAttribute("id", "chartV2-canvas");
		$("#explanations-rewards").append(chartCanvas);

		// create legend area
		var legendCanvas = document.createElement("DIV");
		legendCanvas.setAttribute("id", "legend-canvas");
		legendCanvas.setAttribute("class", "flex-column");
		legendCanvas.setAttribute("style", "background-color:white;width:100px;");
		$("#explanations-rewards").append(legendCanvas);

		//create legend
		var legendRewards = document.createElement("DIV");
		legendRewards.setAttribute("id", "legend-rewards");
		legendRewards.setAttribute("class", "grid");
		legendRewards.setAttribute("style", "background-color:white");
		$("#legend-canvas").append(legendRewards);

		// append legend names and boxes to legendRewards
		var rewardBox = [];
		var rewardInfo = [];
		for (var i in chartData.rewardNames) {
			rewardBox.push(chartData.rewardNames[i] + "_box_" + i);
			rewardBox[i] = document.createElement("DIV");
			rewardBox[i].setAttribute("id", "legend-box-" + i);
			rewardBox[i].setAttribute("class", "r" + i + "c0");
			rewardBox[i].setAttribute("style", "background-color:" + chartData.colors[i] + ";height:10px;width:13px;position:relative;top:4px;");
			$("#legend-rewards").append(rewardBox[i]);

			rewardInfo.push(chartData.rewardNames[i] + "_name_" + i);
			rewardInfo[i] = document.createElement("DIV");
			rewardInfo[i].setAttribute("id", "legend-name-" + i);
			rewardInfo[i].setAttribute("class", "r" + i + "c1");
			rewardInfo[i].setAttribute("style", "height:20px;");
			$("#legend-rewards").append(rewardInfo[i]);
		}
		var rewardLegendTotalBox = document.createElement("DIV");
		rewardLegendTotalBox.setAttribute("id", "legend-box-" + i);
		rewardLegendTotalBox.setAttribute("class", "r" + chartData.rewardNames.length + "c0");
		rewardLegendTotalBox.setAttribute("style", "background-color:" + chartData.actions[0].color + ";height:10px;width:13px;position:relative;top:4px;");
		$("#legend-rewards").append(rewardLegendTotalBox);

		var rewardLegendTotal = document.createElement("DIV");
		rewardLegendTotal.setAttribute("id", "legend-total-name");
		rewardLegendTotal.setAttribute("class", "r" + chartData.rewardNames.length + "c1");
		rewardLegendTotal.setAttribute("style", "height:20px;");
		$("#legend-rewards").append(rewardLegendTotal);


		var ctx = chartCanvas.getContext("2d");
		$("#chartV2-canvas").css("background-color", "white");

		this.renderActionBars(chartCanvas, chartData);
		this.renderBars(chartCanvas, chartData);
		this.renderXAxis(chartCanvas, chartData);
		this.renderYAxis(chartCanvas, chartData);

		this.renderActionSeparatorLines(chartCanvas, chartData);
		//this.renderChartValueLines(chartCanvas, chartData, 4);
		this.renderChartValueLabels(chartCanvas, chartData, 4);
		this.renderActionNames(chartCanvas, chartData);
		this.renderLegend(chartData);
		//this.renderTooltips(chartCanvas, chartData);
		//this.renderTitle(chartCanvas, chartData);
	}	
	
	ui.renderLegend = function (chartData) {
		for (var i in chartData.rewardNames) {
			var name = document.getElementById("legend-name-" + i);
			//font stuff in here for css
			var content = document.createTextNode(chartData.rewardNames[i]);
			name.appendChild(content);
		}	
		var totalName = document.getElementById("legend-total-name");
		var totalContent = document.createTextNode("reward_T");
		totalName.appendChild(totalContent);
	}

	ui.renderActionBars = function (canvas, chartData){
		var ctx = canvas.getContext("2d");
		for (var i in chartData.actions) {
			var bar = chartData.actions[i];
			chartData.positionActionBar(bar, i);
			chartData.dimensionActionBar(bar);
			this.renderBar(ctx, bar, "normal");
		}
	}

	ui.renderActionNames = function (canvas, chartData) {
		chartData.positionActionLabels();
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < chartData.actions.length; i++) {
            ctx.save();
            ctx.fillStyle = "black";
			ctx.font = "bold 20px Arial";
			ctx.fillText(chartData.actionNames[i], chartData.actions[i].actionLabelOriginX - chartData.groupWidthMargin, chartData.actions[i].actionLabelOriginY)
            ctx.restore();
		}
	}

	ui.renderChartValueLabels = function (canvas, chartData, numberOfLines) {
		chartData.positionValueMarkers(numberOfLines);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < numberOfLines; i++) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.font = "bold 10px Arial";
			ctx.fillText(chartData.positiveMarkerValues[i], chartData.groupWidthMargin - 25, chartData.canvasHeight / 2 - chartData.positiveMarkerYPixelsFromXAxis[i]);
			ctx.fillText(-chartData.positiveMarkerValues[i], chartData.groupWidthMargin - 25, chartData.canvasHeight / 2 + chartData.positiveMarkerYPixelsFromXAxis[i]);
            ctx.restore();
		}
	}


	ui.renderChartValueLines = function (canvas, chartData, numberOfLines) {
		chartData.positionValueLines(numberOfLines);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < numberOfLines; i++) {
			ctx.save();
			ctx.strokeStyle = "grey";
			ctx.beginPath();
			ctx.moveTo(chartData.positiveLineOriginX, chartData.positiveLineOriginY[i]);
			ctx.lineTo(Number(chartData.positiveLineOriginX) + Number(chartData.positiveLineLength), chartData.positiveLineOriginY[i]);
			ctx.stroke();
			ctx.restore();
		}
	}

	ui.renderActionSeparatorLines = function (canvas, chartData) {
		chartData.positionActionSeperatorLines();
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < chartData.actions.length - 1; i++) {
			ctx.save();
			ctx.strokeStyle = "red";
			ctx.beginPath();
			ctx.setLineDash([5, 15]);
			ctx.moveTo(chartData.actionLinesOriginX[i], chartData.actionLinesOriginY);
			ctx.lineTo(chartData.actionLinesOriginX[i], Number(chartData.actionLinesOriginY) + Number(chartData.actionLinesLength));
			ctx.stroke();
			ctx.restore();
		}
	}

	ui.renderXAxis = function (canvas, chartData) {
		chartData.positionXAxisLine();
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(chartData.xAxisOriginX, chartData.xAxisOriginY);
		ctx.lineTo(Number(chartData.xAxisOriginX) + Number(chartData.xAxisLength), chartData.xAxisOriginY);
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
	}

	ui.renderYAxis = function (canvas, chartData) {
		chartData.positionYAxisLine();
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(chartData.yAxisOriginX, chartData.yAxisOriginY);
		ctx.lineTo(chartData.yAxisOriginX, Number(chartData.yAxisOriginY) + Number(chartData.yAxisLength));
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
	}
	ui.renderBars = function (canvas, chartData) {
		var ctx = canvas.getContext("2d");
		for (var i in chartData.actions) {
			var action = chartData.actions[i];
			for (var j in action.bars) {
				var bar = action.bars[j];
				chartData.positionRewardBar(bar, i, j);
				chartData.dimensionRewardBar(bar);
				this.renderBar(ctx, bar, "normal");
			}
		}
	}
	ui.renderBar = function (ctx, bar, mode) {
		// originY is always on the x axis
		ctx.save();
		var x0 = bar.originX;
		var y0 = bar.originY;

		var upperLeftOriginX = x0;
		var upperLeftOriginY = undefined;
		if (bar.value > 0) {
			upperLeftOriginY = y0 - bar.height;
		}
		else {
			upperLeftOriginY = y0;
		}
		ctx.beginPath();

		if (mode == "outline") {
			ctx.lineWidth = shape_outline_width + 3;
			ctx.strokeStyle = "blue";
			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, bar.width, bar.height);
		}
		else {
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = bar.color;

			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, bar.width, bar.height);

			ctx.fillStyle = bar.color;
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, bar.width, bar.height);
		}
		ctx.restore();
	}
	return ui;
}


var selectedDecisionStep = undefined;

function processWhyClick(step) {
	if (selectedDecisionStep == step) {
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
	explanationRewards.setAttribute("class", "rewards-bg flex-row");
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

	$("#rewards-titled-container").on("click", regionClickHandlerRewards);
}



function populateRewardQuestionSelector() {
	$("#why-radios").empty();

	// REWARDS SECTION

	// NEW_CHART showing or not
	// NEW_CHART user study yes/no
	var radioDetailedRewards = document.createElement("input");
	radioDetailedRewards.setAttribute("type", "radio");
	radioDetailedRewards.setAttribute("id", "radio-detailed-rewards");
	radioDetailedRewards.setAttribute("name", "rewardView");
	radioDetailedRewards.setAttribute("value", "rewardDetailed");
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
	$("#" + buttonId).click(function (e) {
		if (currentChartV2.saliencyVisible) {
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
