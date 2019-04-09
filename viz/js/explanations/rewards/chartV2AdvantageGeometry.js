
function addBasicChartGeometryFunctions(chartData) {
    chartData.advancedChartGeometry = {};
    var advCG = chartData.advancedChartGeometry;

    //added variables here
    advCG.canvasHeight                 = undefined;
    advCG.canvasWidth                  = undefined;
    advCG.scalingFactor                = undefined;
    advCG.widthAvailableForGroup       = undefined;
    advCG.groupWidthMargin             = undefined;
    advCG.widthAvailableForRewardBars  = undefined;
    advCG.widthAvailableForRewardBar   = undefined;
    advCG.rewardSpacerWidth            = undefined;
    advCG.rewardBarWidth               = undefined;
    advCG.xAxisOriginX                 = undefined;
    advCG.xAxisOriginY                 = undefined;
    advCG.xAxisLength                  = undefined;
    advCG.yAxisOriginX                 = undefined;
    advCG.yAxisOriginY                 = undefined;
    advCG.yAxisLength                  = undefined;
    advCG.actionLinesOriginX           = [];
    advCG.actionLinesOriginY           = undefined;
    advCG.actionLineLength             = undefined;
    advCG.positiveLineOriginY          = [];
    advCG.positiveLineLength           = undefined;
    advCG.positiveLineOriginX          = undefined;
    advCG.positiveMarkerValues         = [];
    advCG.positiveMarkerYPixelsFromXAxis   = [];
    // for (var i in chartData.actions) {
    //     chartData.actions[i].advChartGeometry.actionLabelOriginX    = undefined;
    // }

    advCG.initChartDimensions = function (canvasHeight, canvasWidth, groupWidthMarginFactor, rewardSpacerWidth) {
        advCG.rewardSpacerWidth = rewardSpacerWidth;
        advCG.canvasHeight = canvasHeight;
        advCG.canvasWidth = canvasWidth;
        advCG.widthAvailableForGroup = Math.floor(advCG.canvasWidth / chartData.actions.length);
        advCG.groupWidthMargin = Math.floor((advCG.widthAvailableForGroup * groupWidthMarginFactor) / 2);
        advCG.widthAvailableForRewardBars = Math.floor(advCG.widthAvailableForGroup - 2 * advCG.groupWidthMargin);
        advCG.widthAvailableForRewardBar = Math.floor(advCG.widthAvailableForRewardBars / chartData.rewardNames.length);
        advCG.rewardBarWidth = Math.floor(advCG.widthAvailableForRewardBar - 2 * rewardSpacerWidth);
        advCG.scalingFactor = ((canvasHeight / 2) * 0.75 / chartData.getMaxAbsRewardOrActionValue()).toFixed(2);
    }

    advCG.positionActionSeparatorLines = function() {
        // acitonLinesLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
        // actionLinesOriginX
        // actionLinesOriginY = (canvasHeight - yAxisLength) / 2
        advCG.actionLinesLength = Math.floor(chartData.getMaxAbsRewardOrActionValue() * 2 * advCG.scalingFactor + 10);
        var actionLineBasedOffYAxis = chartData.getMaxAbsRewardOrActionValue() * 2 * advCG.scalingFactor + 10;
        advCG.actionLinesOriginY = (advCG.canvasHeight - actionLineBasedOffYAxis) / 2;
        for (var i = 1; i < chartData.actions.length; i++) {
            advCG.actionLinesOriginX.push(advCG.widthAvailableForGroup * i);
        }
    }

    advCG.positionXAxisLine = function(){
        // xAxisLength = width - 2 * groupWidthMargin
        // xAxisOriginX = groupWidthMargin;
        // xAxisOriginY = height / 2
        advCG.xAxisLength = advCG.canvasWidth - 2 * advCG.groupWidthMargin;
        advCG.xAxisOriginY = advCG.canvasHeight / 2;
        advCG.xAxisOriginX = advCG.groupWidthMargin;
    }

    advCG.positionYAxisLine = function(){
        // yAxisLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
        // yAxisOriginX = groupWidthMargin;
        // yAxisOriginY = (canvasHeight - yAxisLength) / 2
        advCG.yAxisLength = chartData.getMaxAbsRewardOrActionValue() * 2 * advCG.scalingFactor + 10;
        advCG.yAxisOriginY = (advCG.canvasHeight - advCG.yAxisLength) / 2;
        advCG.yAxisOriginX = advCG.groupWidthMargin;
    }

    advCG.positionRewardBar = function (rewardBar, actionIndex, rewardIndex) {
        //what is passed: ch.actionRewardForNameMap["action_0.reward_0"] & action number
        //204 widthAvailableForGroup == canvasWidth / actionCount 
        //groupWidthMargin = (widthAvailableForGroup * .2) / 2
        //bar.originX = i*widthAvailableForGroup + groupWidthMargin + j *(rewardBarWidth)
        //bar.originY = canvasHeight/2 ==> constant 320.0
        rewardBar.advChartGeometry.originX = Math.floor(actionIndex * advCG.widthAvailableForGroup + advCG.groupWidthMargin + rewardIndex * advCG.rewardBarWidth);
        rewardBar.advChartGeometry.originY = advCG.canvasHeight / 2;
    }

    advCG.dimensionRewardBar = function (rewardBar) {
        //ch.actionRewardForNameMap["action_0.reward_0"]
        //widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        //widthAvailableForRewardBar = widthAvailableForRewardBars / rewardBarCount
        rewardBar.advChartGeometry.height = Math.abs(rewardBar.value * advCG.scalingFactor);
        rewardBar.advChartGeometry.width = advCG.rewardBarWidth;
    }

    advCG.positionActionBar = function (actionBar, action) {
        //ch.actionForNameMap["action_0"]
    	// x coord == groupWidthmargin + i * (widthAvailableForGroup)
    	// y coord == the axis location == canvas_height / 2
        actionBar.advChartGeometry.originX = advCG.groupWidthMargin + action * advCG.widthAvailableForGroup; 
        actionBar.advChartGeometry.originY = advCG.canvasHeight / 2;
    }


    advCG.dimensionActionBar = function (actionBar) {
        //ch.actionForNameMap["action_0"]
        var total = 0;
        for (var i in actionBar.bars) {
            total += actionBar.bars[i].value;
        }
        actionBar.advChartGeometry.height = Math.abs(total * advCG.scalingFactor);
        actionBar.advChartGeometry.width = advCG.widthAvailableForRewardBars;
        actionBar.value = total;
    }

    advCG.positionActionLabels = function(minDistanceFromBarOrAxis) {
        var maxAbsValNegReward = chartData.getMaxAbsValNegativeReward();
        var maxAbsValNegativeAction = chartData.getMaxAbsValNegativeAction();
        var maxAbsValNegBar = Math.max(maxAbsValNegReward, maxAbsValNegativeAction);
        var actionLabelY = undefined;
        if (maxAbsValNegBar == undefined){
            actionLabelY = advCG.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else if (maxAbsValNegBar < minDistanceFromBarOrAxis){
            actionLabelY = advCG.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else {
            actionLabelY = advCG.canvasHeight / 2 + maxAbsValNegBar * advCG.scalingFactor + minDistanceFromBarOrAxis;
        }
        for (var i in chartData.actions){
            var action = chartData.actions[i];
            //groupWidthMargin + i * widthAvailableForGroup +  widthAvailableForRewardBars / 2
            var centerXOfLabel = advCG.groupWidthMargin + Number(i)* advCG.widthAvailableForGroup + advCG.widthAvailableForRewardBars / 2;
            // account for inability to predict width of text by providing an adjustment here that centers the text
            action.advChartGeometry.actionLabelOriginX = centerXOfLabel - 35;
            action.advChartGeometry.actionLabelOriginY = actionLabelY;
        }
    }

    advCG.positionValueMarkers = function (numberOfLines) {
        advCG.positiveMarkerValues = [numberOfLines];
        advCG.positiveMarkerYPixelsFromXAxis = [numberOfLines];
        var valueMarkers = Math.floor(chartData.getMaxAbsRewardOrActionValue() / numberOfLines);
        var setValue = valueMarkers;
        for (var i=0; i < numberOfLines; i++) {
            advCG.positiveMarkerValues[i] = setValue;
            advCG.positiveMarkerYPixelsFromXAxis[i] = (setValue * advCG.scalingFactor).toFixed(2);
            setValue += valueMarkers;
        }
    }

    advCG.positionValueLines = function (numberOfLines) {
        advCG.positiveLine = [numberOfLines];
        var lineSpacing = Math.floor(chartData.getMaxAbsRewardOrActionValue() / numberOfLines * advCG.scalingFactor);
        advCG.positiveLineLength = advCG.canvasWidth - 2 * advCG.groupWidthMargin;
        advCG.positiveLineOriginX = advCG.groupWidthMargin;
        for (var i = 0; i < numberOfLines; i++) {
            advCG.positiveLine[i] = {};
            advCG.positiveLineOriginY[i] = ((advCG.canvasHeight / 2) + (1 + Number(i)) * lineSpacing).toFixed(2);
        }
    }
    advCG.positionTooltips = function(){
        for (var i in chartData.actionRewardNames) {
            var actionRewardName = chartData.actionRewardNames[i];
            var rewardBar = chartData.actionRewardForNameMap[actionRewardName];
            //originX + rewardBarWidth

            rewardBar.advChartGeometry.tooltipOriginX = rewardBar.advChartGeometry.originX + advCG.rewardBarWidth;
            // (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scalingFactor) * 0.75)
            rewardBar.advChartGeometry.tooltipOriginY = advCG.canvasHeight/2 - rewardBar.value * advCG.scalingFactor * 0.75; 
        }
    }
    advCG.positionValueTooltips = function() {
        for (var i in chartData.actionRewardNames) {
            var actionRewardName = chartData.actionRewardNames[i];
            var rewardBar = chartData.actionRewardForNameMap[actionRewardName];


            rewardBar.advChartGeometry.tooltipOriginX = rewardBar.advChartGeometry.originX - Number(advCG.rewardBarWidth / 2);
            // (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scalingFactor) * 0.75)
            if (rewardBar.value >= 0) {
                rewardBar.advChartGeometry.tooltipOriginY = advCG.canvasHeight/2 - (rewardBar.value + 30) * advCG.scalingFactor;
            } else {
                rewardBar.advChartGeometry.tooltipOriginY = advCG.canvasHeight/2 - (rewardBar.value) * advCG.scalingFactor;
            }
        }
    }
    advCG.getActionBarNameForCoordinates = function(x,y) {
        for (var i in chartData.actionRewardNames){
            var barName = chartData.actionRewardNames[i];
            var bar = chartData.actionRewardForNameMap[barName];
            var isHeightNegative = true;
            if (bar.value > 0){
                isHeightNegative = false;
            }
            var barCg = bar.advChartGeometry;
            if (chartData.isPointInsideBox(x, y, barCg.originX, barCg.originY, barCg.width, barCg.height, isHeightNegative)){ 
                return bar.fullName;
            }
        }
        return "None";
    }
    chartData.isPointInsideBox = function(x, y, originX, originY, width, height, isHeightNegative){
        if (x < originX || x > originX + width){
            return false;
        }
        if (isHeightNegative){
            // height is negative which means maxY is > originY
            if (height < 5) {
                if (y > (originY - 8) || y < (originY + height + 8)) {
                    return true;
                }
            } else if (y < originY || y > (originY + height)) {
                return false; // its outside a negative bar
            }
        }
        else {
            // height is positive which means maxY is < originY
            if (height < 5) {
                if (y < (originY + 8) || y > (originY - height - 8)) {
                    return true;
                }
            } else if (y > originY || y < (originY - height)) {
                return false;  // it's outside a positive bar
            }
        }
        return true;
    }
    return chartData;
}