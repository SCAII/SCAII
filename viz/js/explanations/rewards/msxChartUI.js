// just a clone of getBasicChartUI so far
function getMsxChartUI() {
    var ui = {};
    var chartCanvas = undefined;
    ui.rewardBarTooltipManager = undefined;
    ui.backgroundColor = "#eeeeee";
    ui.renderChart = function(chartData, treatment, canvasHeight, canvasWidth){
        var msxGeometry = chartData.msxChartGeometry;
        //specify dimensions
        msxGeometry.initChartDimensions(canvasHeight, canvasWidth, 0.5, 0.0);
        // create canvas
        chartCanvas = document.createElement("canvas");
        chartCanvas.setAttribute("width", canvasWidth);
        chartCanvas.setAttribute("height", canvasHeight);
        chartCanvas.setAttribute("id", "chartV2-canvas");
        var winningAction = chartData.actionBest;
        var losingAction = actionForMsxTabId[activeMsxChart];
        chartData.clearHighlightSelectionForAction(winningAction);
        this.recoverWinningActionStateAfterViewSwitch(chartData, winningAction, losingAction);
        chartCanvas.onclick = function(e){
            var x = e.offsetX;
		    var y = e.offsetY;
            var rewardBarName = msxGeometry.getActionBarNameForCoordinates(x, y, winningAction, losingAction);
            currentExplManager.chartUI.activeChart.processRewardBarClick(rewardBarName, chartData, e, treatment, winningAction, losingAction);
        }
        // create the MSX div which will contain the tabs above the active chart
        var msxContainer = document.createElement("div");
        msxContainer.setAttribute("id", "msx-container");
        msxContainer.setAttribute("class", "flex-column");
        $("#explanations-rewards").append(msxContainer);

        // create the MSX tabs div
        var msxTabsContainer = document.createElement("div");
        msxTabsContainer.setAttribute("id", "msx-chart-tabs");
        msxTabsContainer.setAttribute("class", "msx-tab-container flex-row");
        $("#msx-container").append(msxTabsContainer);
        generateChartTabs();
        enableChartTab(activeMsxChart);

        // create a row div so that chart and legend will be side by side
        var msxChartLegendRowDiv = document.createElement("div");
        msxChartLegendRowDiv.setAttribute("id", "msx-chart-legend-row");
        msxChartLegendRowDiv.setAttribute("class", "flex-row");
        $("#msx-container").append(msxChartLegendRowDiv);

        // create chartCanvasContainer because some layout issues dealing with canvas directly
        var chartCanvasContainer = document.createElement("div");
        chartCanvasContainer.setAttribute("width", canvasWidth);
        chartCanvasContainer.setAttribute("height", canvasHeight);
        chartCanvasContainer.setAttribute("id", "chartV2-canvas-container");
        
        $("#msx-chart-legend-row").append(chartCanvasContainer);
        $("#chartV2-canvas-container").append(chartCanvas);

        // append legend div in explanationRewards so will be right of chartCanvas
        var legendDiv = document.createElement("DIV");
        //legendDiv.setAttribute("height", canvasHeight);
        legendDiv.setAttribute("id", "legend-div");
        legendDiv.setAttribute("class", "flex-column");
        legendDiv.setAttribute("style", "background-color:" + this.backgroundColor + ";height:" + canvasHeight + "px;");
        $("#msx-chart-legend-row").append(legendDiv);
        positionLegendPieces(chartData, this.backgroundColor);

        var ctx = chartCanvas.getContext("2d");
        $("#chartV2-canvas").css("background-color", this.backgroundColor);
        
        this.renderChartComponents(chartCanvas, msxGeometry, chartData, treatment, winningAction, losingAction);
	}

    ui.selectHighestScoringMsxBar = function(chartData, winningAction, losingAction){
        chartData.clearSelectionForAction(winningAction);
        chartData.clearSelectionForAction(losingAction);
        var highestBarValue = -9999999;
        var highestBar;
        for (var i in losingAction.bars){
            var bar = losingAction.bars[i];
            if (bar.msxImportantBar){
                var winningBar = winningAction.bars[i];
                if (winningBar.value > highestBarValue){
                    highestBarValue = winningBar.value;
                    highestBar = winningBar;
                }
            }
        }
        highestBar.selected = true;
        chartData.showSalienciesForRewardName(highestBar.name);
    }

    ui.renderChartComponents = function(chartCanvas, msxGeometry, chartData, treatment, winningAction, losingAction){
        this.renderActionSeparatorLines(chartCanvas, chartData);
        this.renderChartValueLabels(chartCanvas, msxGeometry, 4);
        this.renderChartValueLines(chartCanvas, msxGeometry, 4);
        this.renderZeroValueLabel(chartCanvas, msxGeometry);
        
        var winningAction = chartData.actionBest;
        var losingAction = actionForMsxTabId[activeMsxChart];
        this.selectHighestScoringMsxBar(chartData, winningAction, losingAction);
        this.renderBars(chartCanvas,chartData, treatment, winningAction, losingAction);
        this.renderXAxis(chartCanvas, msxGeometry);
		this.renderYAxis(chartCanvas, msxGeometry);

		this.renderActionNames(chartCanvas, chartData, winningAction, losingAction);
		this.renderLegend(chartData);
		this.renderLegendTitle();
        this.renderTitle(chartCanvas, msxGeometry);
        this.rewardBarTooltipManager = getMSXRewardBarTooltipManager(chartCanvas,chartData);
    }

    ui.processRewardBarClick = function(rewardBarName, chartData, e, treatment, winningAction, losingAction){
        if (userStudyMode){
            if (isSaliencyMapSwitchBlockedByQuestion(treatment)){
                return;
            }
        }
        var logLine = templateMap["selectedRewardBar"];
        logLine = logLine.replace("<SLCT_RWRD_BAR>", rewardBarName);
        chartTargetClickHandler("rewardBar", logLine);
        if (rewardBarName != "None") {
            chartData.clearRewardBarSelections();
            chartData.selectSingleRewardBar(rewardBarName);
            if (treatment == "T4" || treatment== "NA") {
                chartData.clearHighlightSelections(); // 
                var trueRewardBarName = rewardBarName.split(".")[1];
                chartData.highlightSimilarRewardBarsForActions(trueRewardBarName, winningAction, losingAction);
            }
            this.renderBars(chartCanvas, chartData, treatment, winningAction, losingAction);
            var bar = chartData.actionRewardForNameMap[rewardBarName];
            chartData.showSalienciesForRewardName(bar.name);
            currentExplManager.saliencyVisible = true;
            currentExplManager.saliencyCombined = false;
            currentExplManager.render("live");
        }
    }

    // Since we are using the losingActions to remember state of highlight and selection,
    // we need to use the following logic to deduce whether the winningAction has any selection 
    // in the context of the current pair:
    //
    // clear the selection state and highlight state of all bars on the winning action 
    // if losingAction has highlighted bar
    //      highlight corresponding bar in winningAction
    //      if losingAction's highlighted bar is not selected
    //           select corresponding bar on winningAction 
    //
    ui.recoverWinningActionStateAfterViewSwitch = function(chartData, winningAction, losingAction){
        // clear the selection state and highlight state of all bars on the winning action 
        chartData.clearHighlightSelectionForAction(winningAction);
        chartData.clearSelectionForAction(winningAction);
        var highlightedLosingActionBar = undefined;
        for (var i in losingAction.bars){
            var bar = losingAction.bars[i];
            if (bar.highlight){
                highlightedLosingActionBar = bar;
            }
        }
        // if losingAction has highlighted bar
        //      highlight corresponding bar in winningAction
        //      if losingAction's highlighted bar is not selected
        //           select corresponding bar on winningAction 
        if (highlightedLosingActionBar != undefined){
            chartData.highlightSimilarRewardBarsForAction(winningAction, highlightedLosingActionBar.name);
            if (!highlightedLosingActionBar.selected){
                chartData.selectSimilarRewardBarsForAction(winningAction, highlightedLosingActionBar.name);
            }
        }

    }
    ui.renderTitle = function (canvas, msxChartGeometry) {
        // NOTE: There are no tests for rendering the title
        var msxGeometry = msxChartGeometry;
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.fillStyle = "black";
		ctx.font = "bold 20px Arial";
		ctx.fillText(" ", msxGeometry.canvasWidth / 2 - msxGeometry.groupWidthMargin, msxGeometry.canvasHeight * .07);
		ctx.restore();
	}
    ui.renderLegendTitle = function () {
		var titleElement = document.getElementById("legend-title");
		var titleContent = document.createTextNode("The agent predicts that, by the end of the game, it will get:");
		titleElement.appendChild(titleContent);
	}
	ui.renderLegend = function (chartData) {
		// NOTE: There are no tests for rendering the legend
		for (var i in chartData.rewardNames) {
			var desc = document.getElementById("legend-desc-" + i);
			var damagedOrDestroyed = chartData.rewardNames[i].split(" ");
			var type;
			if (damagedOrDestroyed[1] == "Damaged") {
				type = "score";
			} else if (damagedOrDestroyed[1] == "Destroyed") {
				if (damagedOrDestroyed[0] == "Enemy") {
					type = "bonus";
				} else {
					type = "penalty";
				}
			}
			var descContent = document.createTextNode("This " + type);
			desc.append(descContent);

			var name = document.getElementById("legend-name-" + i);
			//font stuff in here for css
			var content = document.createTextNode("for " + chartData.rewardNames[i] + " on all future maps");
			/**********************************************************************************************
			 * Author: Andrew Anderson
			 * Purpose: Changing Friend Damaged to "Friendly Fort Damaged" without trying to break things
			 * Date made: 9/4/2018
			 * Date mod:  9/4/2018
			 **********************************************************************************************/
			if ( chartData.rewardNames[i] == "Friend Damaged" ){
				var content = document.createTextNode( "for Friendly Fort Damaged on all future maps" );
			}
			if ( chartData.rewardNames[i] == "Friend Destroyed" ){
				var content = document.createTextNode( "for Friendly Fort Destroyed on all future maps" );
			}
			if ( chartData.rewardNames[i] == "Enemy Damaged" ){
				var content = document.createTextNode( "for Enemy Fort Damaged on all future maps" );
			}
			if ( chartData.rewardNames[i] == "Enemy Destroyed" ){
				var content = document.createTextNode( "for Enemy Fort Destroyed on all future maps" );
			}
			/**********************************************************************************************
			 * 									END OF RENAMING
			 *********************************************************************************************/
			name.appendChild(content);
		}	
	}


	ui.renderActionNames = function (canvas, chartData, winningAction, losingAction) {
        var actions = [ winningAction, losingAction];
        var msxGeometry = chartData.msxChartGeometry;
		msxGeometry.positionActionLabels(30);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            ctx.save();
            ctx.fillStyle = "black";
			ctx.font = "bold 15px Arial";
			ctx.fillText(action.name, action.msxChartGeometry.actionLabelOriginX, action.msxChartGeometry.actionLabelOriginY)
            ctx.restore();
		}
	}
	
	ui.renderZeroValueLabel = function (canvas, msxChartGeometry) {
		// NOTE: there is no test for the zero value label
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.fillStyle = "black";
		ctx.font = "bold 10px Arial";
		ctx.fillText(0, msxChartGeometry.groupWidthMargin - 25, msxChartGeometry.canvasHeight / 2);
		ctx.restore();
	}

	ui.renderChartValueLabels = function (canvas, msxChartGeometry, numberOfLines) {
        var msxGeometry = msxChartGeometry;
		msxGeometry.positionValueMarkers(numberOfLines);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < numberOfLines; i++) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.font = "bold 10px Arial";
			ctx.fillText(msxGeometry.positiveMarkerValues[i], msxGeometry.groupWidthMargin - 25, msxGeometry.canvasHeight / 2 - Number(msxGeometry.positiveMarkerYPixelsFromXAxis[i]));
			ctx.fillText(-msxGeometry.positiveMarkerValues[i], msxGeometry.groupWidthMargin - 25, msxGeometry.canvasHeight / 2 + Number(msxGeometry.positiveMarkerYPixelsFromXAxis[i]));
            ctx.restore();
		}
	}


	ui.renderChartValueLines = function (canvas, msxChartGeometry, numberOfLines) {
        var msxGeometry = msxChartGeometry;
		msxGeometry.positionValueLines(numberOfLines);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < numberOfLines; i++) {
			ctx.save();
			ctx.strokeStyle = "grey";
			ctx.beginPath();
			ctx.moveTo(msxGeometry.positiveLineOriginX, msxGeometry.positiveLineOriginY[i]);
			ctx.lineTo(Number(msxGeometry.positiveLineOriginX) + Number(msxGeometry.positiveLineLength), msxGeometry.positiveLineOriginY[i]);
			ctx.stroke();
			ctx.closePath();
			ctx.beginPath();
			ctx.moveTo(msxGeometry.positiveLineOriginX, msxGeometry.canvasHeight / 2 - msxGeometry.positiveMarkerYPixelsFromXAxis[i]);
			ctx.lineTo(Number(msxGeometry.positiveLineOriginX) + Number(msxGeometry.positiveLineLength), msxGeometry.canvasHeight / 2 - msxGeometry.positiveMarkerYPixelsFromXAxis[i]);
			ctx.stroke()
			ctx.closePath();
			ctx.restore();
		}
	}

	ui.renderActionSeparatorLines = function (canvas, chartData) {
        var msxGeometry = chartData.msxChartGeometry;
		msxGeometry.positionActionSeparatorLines();
		var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.moveTo(msxGeometry.actionLinesOriginX[0], msxGeometry.actionLinesOriginY);
        ctx.lineTo(msxGeometry.actionLinesOriginX[0], Number(msxGeometry.actionLinesOriginY) + Number(msxGeometry.actionLinesLength));
        ctx.stroke();
        ctx.restore();
	}

	ui.renderXAxis = function (canvas, msxChartGeometry) {
        var msxGeometry = msxChartGeometry;
		msxGeometry.positionXAxisLine();
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(msxGeometry.xAxisOriginX, msxGeometry.xAxisOriginY);
		ctx.lineTo(Number(msxGeometry.xAxisOriginX) + Number(msxGeometry.xAxisLength), msxGeometry.xAxisOriginY);
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
	}

	ui.renderYAxis = function (canvas, msxChartGeometry) {
        var msxGeometry = msxChartGeometry;
		msxGeometry.positionYAxisLine();
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(msxGeometry.yAxisOriginX, msxGeometry.yAxisOriginY);
		ctx.lineTo(msxGeometry.yAxisOriginX, Number(msxGeometry.yAxisOriginY) + Number(msxGeometry.yAxisLength));
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
	}	
	ui.renderPattern = function (color) {
		var p = document.createElement("canvas")
		p.width=32;
		p.height=16;
		var pctx=p.getContext('2d');
		
		var x0=36;
		var x1=-4;
		var y0=-2;
		var y1=18;
		var offset=32;
	
		pctx.imageSmoothingEnabled = true;
		pctx.strokeStyle = color;
		pctx.lineWidth=4;
		pctx.beginPath();
		pctx.moveTo(x0,y0);
		pctx.lineTo(x1,y1);
		pctx.moveTo(x0-(offset / 2),y0);
		pctx.lineTo(x1-(offset / 2),y1);
		pctx.moveTo(x0-offset,y0);
		pctx.lineTo(x1-offset,y1);
		pctx.moveTo(x0+(offset / 2),y0);
		pctx.lineTo(x1+(offset / 2),y1);
		pctx.moveTo(x0+offset,y0);
		pctx.lineTo(x1+offset,y1);
		pctx.stroke();	

		return p;
    }
    
    ui.copyLosingActionBarColorsToWinningAction = function(winningAction, losingAction){
        // replace winning action's bar colors with that of losingAction (as that is where msx state is stored)
        for (var i in winningAction.bars){
            var winningBar = winningAction.bars[i];
            var losingBar = losingAction.bars[i];
            winningBar.msxColor = losingBar.msxColor;
        }
    }

    ui.copyLosingActionBarColorsToLegend = function(losingAction){
        // replace legend's bar colors with that of losingAction (as that is where msx state is stored)
        for (var i in losingAction.bars){
            var losingBar = losingAction.bars[i];
            var losingBarColor = losingBar.msxColor;
            $("#legend-box-" + i).css("background-color", losingBarColor);
            if (losingBarColor == msxGrey){
                $("#legend-desc-" + i).css("color", msxGrey);
                $("#legend-name-" + i).css("color", msxGrey);
            }
        }
    }

	ui.renderBars = function (canvas, chartData, treatment, winningAction, losingAction) {
        this.copyLosingActionBarColorsToWinningAction(winningAction, losingAction);
        this.copyLosingActionBarColorsToLegend(losingAction);
        var ctx = canvas.getContext("2d");
        var actions = [ winningAction, losingAction];
		for (var i=0; i< actions.length; i++) {
			var action = actions[i];
			for (var j=0; j<chartData.rewardNames.length; j++) {
				var bar = action.bars[j];
				chartData.msxChartGeometry.positionRewardBar(action.msxMaxValueAction, bar, j);
				chartData.msxChartGeometry.dimensionRewardBar(bar);
				if (bar.selected == true) {
					var saveSelected = bar;
				} else if (bar.highlight == true) {
					this.renderBar(ctx, bar, "gradient");
				} else {
					this.renderBar(ctx, bar, "normal");
				}	
			}
		}
		if (saveSelected != undefined) {
			if (treatment == "T3") {
				this.renderBar(ctx, saveSelected, "outlineT3");
            }
            else if (treatment == "NA") {
                this.renderBar(ctx, saveSelected, "outlineBlue");
            }
			else {
				this.renderBar(ctx, saveSelected, "outline");
			}
		}
	}	
	ui.renderBar = function (ctx, bar, mode) {
		// originY is always on the x axis
        ctx.save();
        var barMcg = bar.msxChartGeometry;
		var x0 = barMcg.originX;
		var y0 = barMcg.originY;

		var upperLeftOriginX = x0;
		var upperLeftOriginY = undefined;
		if (bar.value > 0) {
			upperLeftOriginY = y0 - barMcg.height;
		}
		else {
			upperLeftOriginY = y0;
		}	
		ctx.beginPath();
        
		if (mode == "outlineT3") {
			ctx.clearRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = "white";
			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);

			var rgbaBarColor = hexToRgbA(bar.msxColor);
			ctx.fillStyle = rgbaBarColor + " 0.7)";
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);

			var pattern = this.renderPattern(bar.msxColor);
			ctx.fillStyle = ctx.createPattern(pattern, 'repeat');
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
	
		} else if (mode == "outlineBlue") {
            var adjustedBarHeight = 0;
            if (bar.value > 0) {
                upperLeftOriginOutline = upperLeftOriginY - 3;
                heightOutline = barMcg.height + 3;
            }
            else {
                upperLeftOriginOutline = upperLeftOriginY;
                heightOutline = barMcg.height + 3;
            }	
			ctx.clearRect(upperLeftOriginX - 3, upperLeftOriginOutline, barMcg.width + 6, heightOutline);
            ctx.strokeStyle = "blue";
			ctx.strokeRect(upperLeftOriginX - 3, upperLeftOriginOutline, barMcg.width + 6, heightOutline);

			var rgbaBarColor = hexToRgbA(bar.msxColor);
			ctx.fillStyle = rgbaBarColor + " 0.7)";
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);

			var pattern = this.renderPattern(bar.msxColor);
			ctx.fillStyle = ctx.createPattern(pattern, 'repeat');
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
	
        } else if (mode == "outline") {
			ctx.clearRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = "white";
			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
		
			ctx.fillStyle = bar.msxColor;
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
		} else if (mode == "gradient") {
			ctx.clearRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = bar.msxColor;

			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);

			var rgbaBarColor = hexToRgbA(bar.msxColor);
			ctx.fillStyle = rgbaBarColor + " 0.7)";
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);

			var pattern = this.renderPattern(bar.msxColor);
			ctx.fillStyle = ctx.createPattern(pattern, 'repeat');
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
		} else {
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = bar.msxColor;

			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);

			ctx.fillStyle = bar.msxColor;
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barMcg.width, barMcg.height);
		}
		ctx.restore();
	}
	return ui;
}
