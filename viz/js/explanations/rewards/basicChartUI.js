function getBasicChartUI() {
    var ui = {};

    var chartCanvas = undefined;
    ui.rewardBarTooltipManager = undefined;
    ui.backgroundColor = "#eeeeee";
    ui.renderChart = function(chartData, treatment, canvasHeight, canvasWidth){
        var geometry = chartData.basicChartGeometry;
        //specify dimensions
        geometry.initChartDimensions(canvasHeight, canvasWidth, 0.5, 0.0);
        // create canvas
        chartCanvas = document.createElement("canvas");
        chartCanvas.setAttribute("width", canvasWidth);
        chartCanvas.setAttribute("height", canvasHeight);
		chartCanvas.setAttribute("id", "chartV2-canvas");
        chartCanvas.onclick = function(e){
            var x = e.offsetX;
		    var y = e.offsetY;
            var rewardBarName = geometry.getActionBarNameForCoordinates(x, y);
            currentExplManager.chartUI.activeChart.processRewardBarClick(rewardBarName, chartData, e, treatment);
        }
        // create chartCanvasContainer because some layout issues dealing with canvas directly
        var chartCanvasContainer = document.createElement("div");
        chartCanvasContainer.setAttribute("width", canvasWidth);
        chartCanvasContainer.setAttribute("height", canvasHeight);
        chartCanvasContainer.setAttribute("id", "chartV2-canvas-container");
        
        $("#explanations-rewards").append(chartCanvasContainer);
        $("#chartV2-canvas-container").append(chartCanvas);

        // append legend div in explanationRewards so will be right of chartCanvas
        var legendDiv = document.createElement("DIV");
        //legendDiv.setAttribute("height", canvasHeight);
        legendDiv.setAttribute("id", "legend-div");
        legendDiv.setAttribute("class", "flex-column");
        legendDiv.setAttribute("style", "background-color:" + this.backgroundColor + ";height:" + canvasHeight + "px;");
        $("#explanations-rewards").append(legendDiv);
        var nextIndex = positionLegendPieces(chartData, this.backgroundColor);
        
		// append legend total name and box to legend area
        var rewardLegendTotalBox = document.createElement("DIV");
		rewardLegendTotalBox.setAttribute("id", "legend-box-" + nextIndex);
		rewardLegendTotalBox.setAttribute("class", "r" + Number(chartData.rewardNames.length + 1) + "c1");
		rewardLegendTotalBox.setAttribute("style", "background-color:" + chartData.actions[0].color + ";height:17px;width:17px;position:relative;top:4px;");
		$("#legend-rewards").append(rewardLegendTotalBox);
		var rewardLegendTotal = document.createElement("DIV");
		rewardLegendTotal.setAttribute("id", "legend-total-name");
		rewardLegendTotal.setAttribute("class", "r" + Number(chartData.rewardNames.length + 1) + "c2");
		rewardLegendTotal.setAttribute("style", "height:20px;padding-top:3px;padding-left:3px");
		$("#legend-rewards").append(rewardLegendTotal);

        var ctx = chartCanvas.getContext("2d");
        $("#chartV2-canvas").css("background-color", this.backgroundColor);
        

        this.renderActionSeparatorLines(chartCanvas, chartData);
        this.renderChartValueLabels(chartCanvas, geometry, 4);
        this.renderChartValueLines(chartCanvas, geometry, 4);
        this.renderZeroValueLabel(chartCanvas, geometry);
        
        this.renderActionBars(chartCanvas, chartData);
        this.renderBars(chartCanvas,chartData, treatment);
        this.renderXAxis(chartCanvas, geometry);
		this.renderYAxis(chartCanvas, geometry);

		this.renderActionNames(chartCanvas, chartData);
		this.renderLegend(chartData);
		this.renderLegendTitle();
        this.renderTitle(chartCanvas, geometry);
        this.rewardBarTooltipManager = getRewardBarTooltipManager(chartCanvas,chartData);
	}

    ui.processRewardBarClick = function(rewardBarName, chartData, e, treatment){
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
            if (treatment == "T3" || treatment== "NA") {
                chartData.clearHighlightSelections(); // 
                var trueRewardBarName = rewardBarName.split(".")[1];
                chartData.highlightSimilarRewardBars(trueRewardBarName);
            }
            this.renderBars(chartCanvas, chartData, treatment);
            var bar = chartData.actionRewardForNameMap[rewardBarName];
            chartData.showSalienciesForRewardName(bar.name);
            currentExplManager.saliencyVisible = true;
            currentExplManager.saliencyCombined = false;
            currentExplManager.render("live");
        }
    }

    ui.renderTitle = function (canvas, basicChartGeometry) {
        // NOTE: There are no tests for rendering the title
        var bcg = basicChartGeometry;
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.fillStyle = "black";
		ctx.font = "bold 20px Arial";
		ctx.fillText(" ", bcg.canvasWidth / 2 - bcg.groupWidthMargin, bcg.canvasHeight * .07);
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
		var totalName = document.getElementById("legend-total-name");
		var totalContent = document.createTextNode("Sum of above rewards");
		totalName.appendChild(totalContent);
	}

	ui.renderActionBars = function (canvas, chartData){
		var ctx = canvas.getContext("2d");
		for (var i in chartData.actions) {
			var bar = chartData.actions[i];
			chartData.basicChartGeometry.positionActionBar(bar, i);
			chartData.basicChartGeometry.dimensionActionBar(bar);
			this.renderBar(ctx, bar, "normal");
		}
	}


	ui.renderActionNames = function (canvas, chartData) {
        var bcg = chartData.basicChartGeometry;
		bcg.positionActionLabels(30);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < chartData.actions.length; i++) {
            ctx.save();
            ctx.fillStyle = "black";
			ctx.font = "bold 15px Arial";
			ctx.fillText(chartData.actionNames[i], chartData.actions[i].basicChartGeometry.actionLabelOriginX, chartData.actions[i].basicChartGeometry.actionLabelOriginY)
            ctx.restore();
		}
	}
	
	ui.renderZeroValueLabel = function (canvas, basicChartGeometry) {
		// NOTE: there is no test for the zero value label
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.fillStyle = "black";
		ctx.font = "bold 10px Arial";
		ctx.fillText(0, basicChartGeometry.groupWidthMargin - 25, basicChartGeometry.canvasHeight / 2);
		ctx.restore();
	}

	ui.renderChartValueLabels = function (canvas, basicChartGeometry, numberOfLines) {
        var bcg = basicChartGeometry;
		bcg.positionValueMarkers(numberOfLines);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < numberOfLines; i++) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.font = "bold 10px Arial";
			ctx.fillText(bcg.positiveMarkerValues[i], bcg.groupWidthMargin - 25, bcg.canvasHeight / 2 - Number(bcg.positiveMarkerYPixelsFromXAxis[i]));
			ctx.fillText(-bcg.positiveMarkerValues[i], bcg.groupWidthMargin - 25, bcg.canvasHeight / 2 + Number(bcg.positiveMarkerYPixelsFromXAxis[i]));
            ctx.restore();
		}
	}


	ui.renderChartValueLines = function (canvas, basicChartGeometry, numberOfLines) {
        var bcg = basicChartGeometry;
		bcg.positionValueLines(numberOfLines);
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < numberOfLines; i++) {
			ctx.save();
			ctx.strokeStyle = "grey";
			ctx.beginPath();
			ctx.moveTo(bcg.positiveLineOriginX, bcg.positiveLineOriginY[i]);
			ctx.lineTo(Number(bcg.positiveLineOriginX) + Number(bcg.positiveLineLength), bcg.positiveLineOriginY[i]);
			ctx.stroke();
			ctx.closePath();
			ctx.beginPath();
			ctx.moveTo(bcg.positiveLineOriginX, bcg.canvasHeight / 2 - bcg.positiveMarkerYPixelsFromXAxis[i]);
			ctx.lineTo(Number(bcg.positiveLineOriginX) + Number(bcg.positiveLineLength), bcg.canvasHeight / 2 - bcg.positiveMarkerYPixelsFromXAxis[i]);
			ctx.stroke()
			ctx.closePath();
			ctx.restore();
		}
	}

	ui.renderActionSeparatorLines = function (canvas, chartData) {
        var bcg = chartData.basicChartGeometry;
		bcg.positionActionSeparatorLines();
		var ctx = canvas.getContext("2d");
		for (var i = 0; i < chartData.actions.length - 1; i++) {
			ctx.save();
			ctx.strokeStyle = "red";
			ctx.beginPath();
			ctx.setLineDash([5, 15]);
			ctx.moveTo(bcg.actionLinesOriginX[i], bcg.actionLinesOriginY);
			ctx.lineTo(bcg.actionLinesOriginX[i], Number(bcg.actionLinesOriginY) + Number(bcg.actionLinesLength));
			ctx.stroke();
			ctx.restore();
		}
	}

	ui.renderXAxis = function (canvas, basicChartGeometry) {
        var bcg = basicChartGeometry;
		bcg.positionXAxisLine();
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(bcg.xAxisOriginX, bcg.xAxisOriginY);
		ctx.lineTo(Number(bcg.xAxisOriginX) + Number(bcg.xAxisLength), bcg.xAxisOriginY);
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
	}

	ui.renderYAxis = function (canvas, basicChartGeometry) {
        var bcg = basicChartGeometry;
		bcg.positionYAxisLine();
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(bcg.yAxisOriginX, bcg.yAxisOriginY);
		ctx.lineTo(bcg.yAxisOriginX, Number(bcg.yAxisOriginY) + Number(bcg.yAxisLength));
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
	ui.renderBars = function (canvas, chartData, treatment) {
		var ctx = canvas.getContext("2d");
		for (var i=0; i<chartData.actions.length; i++) {
			var action = chartData.actions[i];
			for (var j=0; j<chartData.rewardNames.length; j++) {
				var bar = action.bars[j];
				chartData.basicChartGeometry.positionRewardBar(bar, i, j);
				chartData.basicChartGeometry.dimensionRewardBar(bar);
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
        var barBcg = bar.basicChartGeometry;
		var x0 = barBcg.originX;
		var y0 = barBcg.originY;

		var upperLeftOriginX = x0;
		var upperLeftOriginY = undefined;
		if (bar.value > 0) {
			upperLeftOriginY = y0 - barBcg.height;
		}
		else {
			upperLeftOriginY = y0;
		}	
		ctx.beginPath();
        
		if (mode == "outlineT3") {
			ctx.clearRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = "white";
			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);

			var rgbaBarColor = hexToRgbA(bar.color);
			ctx.fillStyle = rgbaBarColor + " 0.7)";
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);

			var pattern = this.renderPattern(bar.color);
			ctx.fillStyle = ctx.createPattern(pattern, 'repeat');
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, bbarBcgar.width, barBcg.height);
	
		} else if (mode == "outlineBlue") {
            var adjustedBarHeight = 0;
            if (bar.value > 0) {
                upperLeftOriginOutline = upperLeftOriginY - 3;
                heightOutline = barBcg.height + 3;
            }
            else {
                upperLeftOriginOutline = upperLeftOriginY;
                heightOutline = barBcg.height + 3;
            }	
			ctx.clearRect(upperLeftOriginX - 3, upperLeftOriginOutline, barBcg.width + 6, heightOutline);
            ctx.strokeStyle = "blue";
			ctx.strokeRect(upperLeftOriginX - 3, upperLeftOriginOutline, barBcg.width + 6, heightOutline);

			var rgbaBarColor = hexToRgbA(bar.color);
			ctx.fillStyle = rgbaBarColor + " 0.7)";
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);

			var pattern = this.renderPattern(bar.color);
			ctx.fillStyle = ctx.createPattern(pattern, 'repeat');
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
	
        } else if (mode == "outline") {
			ctx.clearRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = "white";
			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
		
			ctx.fillStyle = bar.color;
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
		} else if (mode == "gradient") {
			ctx.clearRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = bar.color;

			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);

			var rgbaBarColor = hexToRgbA(bar.color);
			ctx.fillStyle = rgbaBarColor + " 0.7)";
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);

			var pattern = this.renderPattern(bar.color);
			ctx.fillStyle = ctx.createPattern(pattern, 'repeat');
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
		} else {
			ctx.lineWidth = shape_outline_width;
			ctx.strokeStyle = bar.color;

			ctx.strokeRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);

			ctx.fillStyle = bar.color;
			ctx.fillRect(upperLeftOriginX, upperLeftOriginY, barBcg.width, barBcg.height);
		}
		ctx.restore();
	}
	return ui;
}