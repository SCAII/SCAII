
function addBasicChartGeometryFunctions(chartData) {
    chartData.basicChartGeometry = {};
    var basicCG = chartData.basicChartGeometry;

    //added variables here
    basicCG.canvasHeight                 = undefined;
    basicCG.canvasWidth                  = undefined;
    basicCG.scalingFactor                = undefined;
    basicCG.widthAvailableForGroup       = undefined;
    basicCG.groupWidthMargin             = undefined;
    basicCG.widthAvailableForRewardBars  = undefined;
    basicCG.widthAvailableForRewardBar   = undefined;
    basicCG.rewardSpacerWidth            = undefined;
    basicCG.rewardBarWidth               = undefined;
    basicCG.xAxisOriginX                 = undefined;
    basicCG.xAxisOriginY                 = undefined;
    basicCG.xAxisLength                  = undefined;
    basicCG.yAxisOriginX                 = undefined;
    basicCG.yAxisOriginY                 = undefined;
    basicCG.yAxisLength                  = undefined;
    basicCG.actionLinesOriginX           = [];
    basicCG.actionLinesOriginY           = undefined;
    basicCG.actionLineLength             = undefined;
    basicCG.positiveLineOriginY          = [];
    basicCG.positiveLineLength           = undefined;
    basicCG.positiveLineOriginX          = undefined;
    basicCG.positiveMarkerValues         = [];
    basicCG.positiveMarkerYPixelsFromXAxis   = [];
    // for (var i in chartData.actions) {
    //     chartData.actions[i].basicChartGeometry.actionLabelOriginX    = undefined;
    // }

    basicCG.initChartDimensions = function (canvasHeight, canvasWidth, groupWidthMarginFactor, rewardSpacerWidth) {
        basicCG.rewardSpacerWidth = rewardSpacerWidth;
        basicCG.canvasHeight = canvasHeight;
        basicCG.canvasWidth = canvasWidth;
        basicCG.widthAvailableForGroup = Math.floor(basicCG.canvasWidth / chartData.actions.length);
        basicCG.groupWidthMargin = Math.floor((basicCG.widthAvailableForGroup * groupWidthMarginFactor) / 2);
        basicCG.widthAvailableForRewardBars = Math.floor(basicCG.widthAvailableForGroup - 2 * basicCG.groupWidthMargin);
        basicCG.widthAvailableForRewardBar = Math.floor(basicCG.widthAvailableForRewardBars / chartData.rewardNames.length);
        basicCG.rewardBarWidth = Math.floor(basicCG.widthAvailableForRewardBar - 2 * rewardSpacerWidth);
        basicCG.scalingFactor = ((canvasHeight / 2) * 0.75 / chartData.getMaxAbsRewardOrActionValue()).toFixed(2);
    }

    basicCG.positionActionSeparatorLines = function() {
        // acitonLinesLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
        // actionLinesOriginX
        // actionLinesOriginY = (canvasHeight - yAxisLength) / 2
        basicCG.actionLinesLength = Math.floor(chartData.getMaxAbsRewardOrActionValue() * 2 * basicCG.scalingFactor + 10);
        var actionLineBasedOffYAxis = chartData.getMaxAbsRewardOrActionValue() * 2 * basicCG.scalingFactor + 10;
        basicCG.actionLinesOriginY = (basicCG.canvasHeight - actionLineBasedOffYAxis) / 2;
        for (var i = 1; i < chartData.actions.length; i++) {
            basicCG.actionLinesOriginX.push(basicCG.widthAvailableForGroup * i);
        }
    }

    basicCG.positionXAxisLine = function(){
        // xAxisLength = width - 2 * groupWidthMargin
        // xAxisOriginX = groupWidthMargin;
        // xAxisOriginY = height / 2
        basicCG.xAxisLength = basicCG.canvasWidth - 2 * basicCG.groupWidthMargin;
        basicCG.xAxisOriginY = basicCG.canvasHeight / 2;
        basicCG.xAxisOriginX = basicCG.groupWidthMargin;
    }

    basicCG.positionYAxisLine = function(){
        // yAxisLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
        // yAxisOriginX = groupWidthMargin;
        // yAxisOriginY = (canvasHeight - yAxisLength) / 2
        basicCG.yAxisLength = chartData.getMaxAbsRewardOrActionValue() * 2 * basicCG.scalingFactor + 10;
        basicCG.yAxisOriginY = (basicCG.canvasHeight - basicCG.yAxisLength) / 2;
        basicCG.yAxisOriginX = basicCG.groupWidthMargin;
    }

    basicCG.positionRewardBar = function (rewardBar, actionIndex, rewardIndex) {
        //what is passed: ch.actionRewardForNameMap["action_0.reward_0"] & action number
        //204 widthAvailableForGroup == canvasWidth / actionCount 
        //groupWidthMargin = (widthAvailableForGroup * .2) / 2
        //bar.originX = i*widthAvailableForGroup + groupWidthMargin + j *(rewardBarWidth)
        //bar.originY = canvasHeight/2 ==> constant 320.0
        rewardBar.basicChartGeometry.originX = Math.floor(actionIndex * basicCG.widthAvailableForGroup + basicCG.groupWidthMargin + rewardIndex * basicCG.rewardBarWidth);
        rewardBar.basicChartGeometry.originY = basicCG.canvasHeight / 2;
    }

    basicCG.dimensionRewardBar = function (rewardBar) {
        //ch.actionRewardForNameMap["action_0.reward_0"]
        //widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        //widthAvailableForRewardBar = widthAvailableForRewardBars / rewardBarCount
        rewardBar.basicChartGeometry.height = Math.abs(rewardBar.value * basicCG.scalingFactor);
        rewardBar.basicChartGeometry.width = basicCG.rewardBarWidth;
    }

    basicCG.positionActionBar = function (actionBar, action) {
        //ch.actionForNameMap["action_0"]
    	// x coord == groupWidthmargin + i * (widthAvailableForGroup)
    	// y coord == the axis location == canvas_height / 2
        actionBar.basicChartGeometry.originX = basicCG.groupWidthMargin + action * basicCG.widthAvailableForGroup; 
        actionBar.basicChartGeometry.originY = basicCG.canvasHeight / 2;
    }


    basicCG.dimensionActionBar = function (actionBar) {
        //ch.actionForNameMap["action_0"]
        var total = 0;
        for (var i in actionBar.bars) {
            total += actionBar.bars[i].value;
        }
        actionBar.basicChartGeometry.height = Math.abs(total * basicCG.scalingFactor);
        actionBar.basicChartGeometry.width = basicCG.widthAvailableForRewardBars;
        actionBar.value = total;
    }

    basicCG.positionActionLabels = function(minDistanceFromBarOrAxis) {
        var maxAbsValNegReward = chartData.getMaxAbsValNegativeReward();
        var maxAbsValNegativeAction = chartData.getMaxAbsValNegativeAction();
        var maxAbsValNegBar = Math.max(maxAbsValNegReward, maxAbsValNegativeAction);
        var actionLabelY = undefined;
        if (maxAbsValNegBar == undefined){
            actionLabelY = basicCG.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else if (maxAbsValNegBar < minDistanceFromBarOrAxis){
            actionLabelY = basicCG.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else {
            actionLabelY = basicCG.canvasHeight / 2 + maxAbsValNegBar * basicCG.scalingFactor + minDistanceFromBarOrAxis;
        }
        for (var i in chartData.actions){
            var action = chartData.actions[i];
            //groupWidthMargin + i * widthAvailableForGroup +  widthAvailableForRewardBars / 2
            action.basicChartGeometry.actionLabelOriginX = basicCG.groupWidthMargin + Number(i)* basicCG.widthAvailableForGroup + basicCG.widthAvailableForRewardBars / 2;
            action.basicChartGeometry.actionLabelOriginY = actionLabelY;
        }
    }

    basicCG.positionValueMarkers = function (numberOfLines) {
        basicCG.positiveMarkerValues = [numberOfLines];
        basicCG.positiveMarkerYPixelsFromXAxis = [numberOfLines];
        var valueMarkers = Math.floor(chartData.getMaxAbsRewardOrActionValue() / numberOfLines);
        var setValue = valueMarkers;
        for (var i=0; i < numberOfLines; i++) {
            basicCG.positiveMarkerValues[i] = setValue;
            basicCG.positiveMarkerYPixelsFromXAxis[i] = (setValue * basicCG.scalingFactor).toFixed(2);
            setValue += valueMarkers;
        }
    }

    basicCG.positionValueLines = function (numberOfLines) {
        basicCG.positiveLine = [numberOfLines];
        var lineSpacing = Math.floor(chartData.getMaxAbsRewardOrActionValue() / numberOfLines * basicCG.scalingFactor);
        basicCG.positiveLineLength = basicCG.canvasWidth - 2 * basicCG.groupWidthMargin;
        basicCG.positiveLineOriginX = basicCG.groupWidthMargin;
        for (var i = 0; i < numberOfLines; i++) {
            basicCG.positiveLine[i] = {};
            basicCG.positiveLineOriginY[i] = ((basicCG.canvasHeight / 2) + (1 + Number(i)) * lineSpacing).toFixed(2);
        }
    }
    basicCG.positionTooltips = function(){
        for (var i in chartData.actionRewardNames) {
            var actionRewardName = chartData.actionRewardNames[i];
            var rewardBar = chartData.actionRewardForNameMap[actionRewardName];
            //originX + rewardBarWidth

            rewardBar.basicChartGeometry.tooltipOriginX = rewardBar.basicChartGeometry.originX + basicCG.rewardBarWidth;
            // (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scalingFactor) * 0.75)
            rewardBar.basicChartGeometry.tooltipOriginY = basicCG.canvasHeight/2 - rewardBar.value * basicCG.scalingFactor * 0.75; 
        }
    }
    basicCG.positionValueTooltips = function() {
        for (var i in chartData.actionRewardNames) {
            var actionRewardName = chartData.actionRewardNames[i];
            var rewardBar = chartData.actionRewardForNameMap[actionRewardName];


            rewardBar.basicChartGeometry.tooltipOriginX = rewardBar.basicChartGeometry.originX - Number(basicCG.rewardBarWidth / 2);
            // (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scalingFactor) * 0.75)
            if (rewardBar.value >= 0) {
                rewardBar.basicChartGeometry.tooltipOriginY = basicCG.canvasHeight/2 - (rewardBar.value + 30) * basicCG.scalingFactor;
            } else {
                rewardBar.basicChartGeometry.tooltipOriginY = basicCG.canvasHeight/2 - (rewardBar.value) * basicCG.scalingFactor;
            }
        }
    }
    basicCG.getActionBarNameForCoordinates = function(x,y) {
        for (var i in chartData.actionRewardNames){
            var barName = chartData.actionRewardNames[i];
            var bar = chartData.actionRewardForNameMap[barName];
            var isHeightNegative = true;
            if (bar.value > 0){
                isHeightNegative = false;
            }
            var barCg = bar.basicChartGeometry;
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