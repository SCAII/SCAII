function getChartV2UI() {
    var ui = {};

    var chartCanvas = undefined;
    ui.whyButtonInfo = undefined;
    ui.rewardBarTooltipManager = undefined;
    ui.renderChartDetailed = function(chartData){
        createRewardChartContainer();
        //var canvasWidth = $("#explanations-rewards").width;
        //var canvasHeight = $("#explanations-rewards").height;
        //specify dimensions
        var canvasHeight = 500;
        var canvasWidth = 700;
        chartData.initChartDimensions(canvasHeight, canvasWidth, 0.5, 0.0);

        // create canvas
        chartCanvas = document.createElement("canvas");
        chartCanvas.setAttribute("width", canvasWidth);
        chartCanvas.setAttribute("height", canvasHeight);
        chartCanvas.setAttribute("id", "chartV2-canvas");
        chartCanvas.onclick = function(e){
            var x = e.offsetX;
		    var y = e.offsetY;
            var rewardBarName = chartData.getActionBarNameForCoordinates(x, y);
            currentExplManager.chartUI.processRewardBarClick(rewardBarName, chartData);
        }
        
        $("#explanations-rewards").append(chartCanvas);

        // append legend div in explanationRewards so will be right of chartCanvas
        var legendDiv = document.createElement("DIV");
        legendDiv.setAttribute("id", "legend-canvas");
        legendDiv.setAttribute("class", "flex-column");
        legendDiv.setAttribute("style", "background-color:white;");
        $("#explanations-rewards").append(legendDiv);

        // create legend area where names and boxes will exist
        var legendRewards = document.createElement("DIV");
        legendRewards.setAttribute("id", "legend-rewards");
        legendRewards.setAttribute("class", "grid");
        legendRewards.setAttribute("style", "background-color:white");
        $("#legend-canvas").append(legendRewards);

		// append legend names and boxes to legend area
        for (var i in chartData.rewardNames) {
            var rewardBox = document.createElement("DIV");
            rewardBox.setAttribute("id", "legend-box-" + i);
            rewardBox.setAttribute("class", "r" + i + "c0");
            rewardBox.setAttribute("style", "background-color:" + chartData.colors[i] + ";height:10px;width:13px;position:relative;top:4px;");
            $("#legend-rewards").append(rewardBox);

            var rewardInfo = document.createElement("DIV");
            rewardInfo.setAttribute("id", "legend-name-" + i);
            rewardInfo.setAttribute("class", "r" + i + "c1");
            rewardInfo.setAttribute("style", "height:20px;padding-left:5px");
            $("#legend-rewards").append(rewardInfo);

        }
		// append legend total name and box to legend area
        var rewardLegendTotalBox = document.createElement("DIV");
		rewardLegendTotalBox.setAttribute("id", "legend-box-" + i);
		rewardLegendTotalBox.setAttribute("class", "r" + chartData.rewardNames.length + "c0");
		rewardLegendTotalBox.setAttribute("style", "background-color:" + chartData.actions[0].color + ";height:10px;width:13px;position:relative;top:4px;");
		$("#legend-rewards").append(rewardLegendTotalBox);
		var rewardLegendTotal = document.createElement("DIV");
		rewardLegendTotal.setAttribute("id", "legend-total-name");
		rewardLegendTotal.setAttribute("class", "r" + chartData.rewardNames.length + "c1");
		rewardLegendTotal.setAttribute("style", "height:20px;padding-left:5px");
		$("#legend-rewards").append(rewardLegendTotal);

        var ctx = chartCanvas.getContext("2d");
        $("#chartV2-canvas").css("background-color", "white");
        

        this.renderActionSeparatorLines(chartCanvas, chartData);
        this.renderChartValueLabels(chartCanvas, chartData, 4);
        this.renderChartValueLines(chartCanvas, chartData, 4);
        this.renderZeroValueLabel(chartCanvas, chartData);
        
        this.renderBars(chartCanvas,chartData);
        this.renderActionBars(chartCanvas, chartData);
        this.renderXAxis(chartCanvas, chartData);
		this.renderYAxis(chartCanvas, chartData);

		this.renderActionNames(chartCanvas, chartData);
		this.renderLegend(chartData);
        this.renderTitle(chartCanvas, chartData);
        this.rewardBarTooltipManager = getRewardBarTooltipManager(chartCanvas,chartData);
	}

    ui.processRewardBarClick = function(rewardBarName, chartData){
        var bar = chartData.actionRewardForNameMap[rewardBarName];
        chartData.showSalienciesForRewardBar(bar);
        currentExplManager.saliencyVisible = true;
        currentExplManager.saliencyCombined = false;
        currentExplManager.render();
    }

    ui.renderTitle = function (canvas, chartData) {
		// NOTE: There are no tests for rendering the title
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.fillStyle = "black";
		ctx.font = "bold 20px Arial";
		ctx.fillText("Chart Title", chartData.canvasWidth / 2 - chartData.groupWidthMargin, chartData.canvasHeight * .07);
		ctx.restore();
	}
    
	ui.renderLegend = function (chartData) {
		// NOTE: There are no tests for rendering the legend
		for (var i in chartData.rewardNames) {
			var name = document.getElementById("legend-name-" + i);
			//font stuff in here for css
			var content = document.createTextNode(chartData.rewardNames[i]);
			name.appendChild(content);
		}	
		var totalName = document.getElementById("legend-total-name");
		var totalContent = document.createTextNode("Reward Total");
		totalName.appendChild(totalContent);
	}

	ui.renderActionBars = function (canvas, chartData){
		// (EVAN) TODO: add test in here for actionBar Names?
		var ctx = canvas.getContext("2d");
		for (var i in chartData.actions) {
			var bar = chartData.actions[i];
			chartData.positionActionBar(bar, i);
			chartData.dimensionActionBar(bar);
			this.renderBar(ctx, bar, "normal");
		}
	}

	ui.renderActionNames = function (canvas, chartData) {
		chartData.positionActionLabels(30);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < chartData.actions.length; i++) {
            ctx.save();
            ctx.fillStyle = "black";
			ctx.font = "bold 15px Arial";
			ctx.fillText(chartData.actionNames[i], chartData.actions[i].actionLabelOriginX - chartData.groupWidthMargin, chartData.actions[i].actionLabelOriginY)
            ctx.restore();
		}
	}
	
	ui.renderZeroValueLabel = function (canvas, chartData) {
		// NOTE: there is no test for the zero value label
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.fillStyle = "black";
		ctx.font = "bold 10px Arial";
		ctx.fillText(0, chartData.groupWidthMargin - 25, chartData.canvasHeight / 2);
		ctx.restore();
	}

	ui.renderChartValueLabels = function (canvas, chartData, numberOfLines) {
		chartData.positionValueMarkers(numberOfLines);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < numberOfLines; i++) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.font = "bold 10px Arial";
			ctx.fillText(chartData.positiveMarkerValues[i], chartData.groupWidthMargin - 25, chartData.canvasHeight / 2 - Number(chartData.positiveMarkerYPixelsFromXAxis[i]));
			ctx.fillText(-chartData.positiveMarkerValues[i], chartData.groupWidthMargin - 25, chartData.canvasHeight / 2 + Number(chartData.positiveMarkerYPixelsFromXAxis[i]));
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
			ctx.closePath();
			ctx.beginPath();
			ctx.moveTo(chartData.positiveLineOriginX, chartData.canvasHeight / 2 - chartData.positiveMarkerYPixelsFromXAxis[i]);
			ctx.lineTo(Number(chartData.positiveLineOriginX) + Number(chartData.positiveLineLength), chartData.canvasHeight / 2 - chartData.positiveMarkerYPixelsFromXAxis[i]);
			ctx.stroke()
			ctx.closePath();
			ctx.restore();
		}
	}

	ui.renderActionSeparatorLines = function (canvas, chartData) {
		chartData.positionActionSeparatorLines();
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
	if (selectedDecisionStep == step && currentExplManager.chartVisible == true) {
        currentExplManager.chartVisible = false;
        currentExplManager.saliencyVisible = false;
		selectedDecisionStep = undefined;
		currentExplManager.render();
		// engage selection color for supporting areas
		//$("#why-questions").toggleClass('active');
		//$("#why-label").toggleClass('active');
	}	
	else {
		currentExplManager.chartVisible = true;

		// show explanation info for new step
		selectedDecisionStep = step;
		askBackendForExplanationRewardInfo(step);
	}
}

// function fullClearExplanationInfo() {
// 	$("#explanations-rewards").empty();
// 	$("#action-name-label").html(" ");
// 	clearQuestionControls();
// 	if ($("#rewards-titled-container").length) {
// 		$("#rewards-titled-container").remove();
// 	}	
// 	if (currentExplManager != undefined) {
// 		currentExplManager.chartVisible = false;
// 		if (currentExplManager.saliencyVisible) {
// 			$("#saliency-div").remove();
// 		}
// 		currentExplManager.saliencyVisible = false;
// 	}

// }


function cleanExplanationUI() {
	$("#explanations-rewards").empty();
	$("#action-name-label").html(" ");
	clearQuestionControls();
	if ($("#rewards-titled-container").length) {
		$("#rewards-titled-container").remove();
	}	
	$("#saliency-div").remove();
}


function createRewardChartContainer() {
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
	whatDiv.setAttribute("style", "margin:auto;font-family:Arial;padding:10px;");
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
