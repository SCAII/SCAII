function addMsxGeometryFunctions(chartData) {
    chartData.msxChartGeometry = {};
    var msxCG = chartData.msxChartGeometry;

    msxCG.canvasHeight                 = undefined;
    msxCG.canvasWidth                  = undefined;
    msxCG.scalingFactor                = undefined;
    msxCG.widthAvailableForGroup       = undefined;
    msxCG.groupWidthMargin             = undefined;
    msxCG.widthAvailableForRewardBars  = undefined;
    msxCG.widthAvailableForRewardBar   = undefined;
    msxCG.rewardSpacerWidth            = undefined;
    msxCG.rewardBarWidth               = undefined;
    msxCG.xAxisOriginX                 = undefined;
    msxCG.xAxisOriginY                 = undefined;
    msxCG.xAxisLength                  = undefined;
    msxCG.yAxisOriginX                 = undefined;
    msxCG.yAxisOriginY                 = undefined;
    msxCG.yAxisLength                  = undefined;
    msxCG.actionLinesOriginX           = [];
    msxCG.actionLinesOriginY           = undefined;
    msxCG.actionLineLength             = undefined;
    msxCG.positiveLineOriginY          = [];
    msxCG.positiveLineLength           = undefined;
    msxCG.positiveLineOriginX          = undefined;
    msxCG.positiveMarkerValues         = [];
    msxCG.positiveMarkerYPixelsFromXAxis   = [];


    msxCG.initChartDimensions = function (canvasHeight, canvasWidth, groupWidthMarginFactor, rewardSpacerWidth) {
        msxCG.canvasHeight = canvasHeight;
        msxCG.canvasWidth = canvasWidth;
        msxCG.widthAvailableForGroup = Math.floor(msxCG.canvasWidth / 2);
        msxCG.groupWidthMargin = Math.floor((msxCG.widthAvailableForGroup * groupWidthMarginFactor) / 2);
        msxCG.widthAvailableForRewardBars = Math.floor(msxCG.widthAvailableForGroup - (3 * msxCG.groupWidthMargin));
        msxCG.widthAvailableForRewardBar = Math.floor(msxCG.widthAvailableForRewardBars / chartData.rewardNames.length);
        msxCG.rewardBarWidth = Math.floor(msxCG.widthAvailableForRewardBar - (rewardSpacerWidth));
        //biggest bar should take up .75 of canvasHeight/2  (120 * scalingFactor == 3/4 * canvasHeight/2) (we assumed scalingFactor == 2)
        msxCG.scalingFactor = ( ((msxCG.canvasHeight / 2) * 0.75) / chartData.getMaxAbsoluteValueReward() ).toFixed(2);
    }

    msxCG.positionRewardBar = function (maxValueAction, rewardBar, rewardIndex) {
            //bar.originX = (groupWidthMargin*2) + j *(rewardBarWidth) **For picked best action**
            //bar.originX = widthAvailableForGroup + (groupWidthMargin*2) + j *(rewardBarWidth) **For all other actions**
            //bar.originY = canvasHeight/2 ==> constant 320.0
            
            if (maxValueAction == true) {
                rewardBar.msxChartGeometry.originX = Math.floor((msxCG.groupWidthMargin * 2) + (rewardIndex * msxCG.rewardBarWidth));
            } else {//BUG?? is this right v
                rewardBar.msxChartGeometry.originX = Math.floor(msxCG.widthAvailableForGroup + msxCG.groupWidthMargin + (rewardIndex * msxCG.rewardBarWidth));
            }
            // console.log("rewardindex                  " + rewardIndex);
            // console.log("msxCG.groupWidthMargin       " + msxCG.groupWidthMargin);
            // console.log("msxCG.rewardBarWidth         " + msxCG.rewardBarWidth);
            // console.log("msxCG.widthAvailableForGroup " + msxCG.widthAvailableForGroup);
            // console.log("msxCG.groupWidthMargin       " + msxCG.groupWidthMargin);
            // console.log("rewardBar.msxChartGeometry.originX " + rewardBar.msxChartGeometry.originX);
            rewardBar.msxChartGeometry.originY = msxCG.canvasHeight / 2;
        }

        
    msxCG.getActionBarNameForCoordinatesForAction = function(x,y,action){
        var result = "None";
        for (var i in action.bars){
            var bar = action.bars[i];
            var isHeightNegative = true;
            if (bar.value > 0){
                isHeightNegative = false;
            }
            var barCg = bar.msxChartGeometry;
            if (barCg != undefined) {
                if (chartData.isPointInsideBox(x, y, barCg.originX, barCg.originY, barCg.width, barCg.height, isHeightNegative)){ 
                    result = bar.fullName;
                } 
            }
        }
        return result;
    }
    msxCG.getActionBarNameForCoordinates = function(x,y, winningAction,losingAction) {
        var result = msxCG.getActionBarNameForCoordinatesForAction(x,y,losingAction);
        if (result == "None"){
            result = msxCG.getActionBarNameForCoordinatesForAction(x,y,winningAction);
        }
        return result;
    }
    msxCG.dimensionRewardBar = function (rewardBar) {
        //ch.actionRewardForNameMap["action_0.reward_0"]
        //widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        //widthAvailableForRewardBar = widthAvailableForRewardBars / rewardBarCount
        rewardBar.msxChartGeometry.height = Math.abs(rewardBar.value * msxCG.scalingFactor);
        rewardBar.msxChartGeometry.width = msxCG.rewardBarWidth;
    }
    
    msxCG.positionActionLabels = function(minDistanceFromBarOrAxis) {
        var maxAbsValNegBar = chartData.getMaxAbsValNegativeReward();
        var actionLabelY = undefined;
        if (maxAbsValNegBar == undefined){
            actionLabelY = msxCG.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else if (maxAbsValNegBar < minDistanceFromBarOrAxis){
            actionLabelY = msxCG.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else {
            actionLabelY = msxCG.canvasHeight / 2 + maxAbsValNegBar * msxCG.scalingFactor + minDistanceFromBarOrAxis;
        }
        for (var i in chartData.actions){
            var action = chartData.actions[i];
            //X = (groupWidthMargin*2) + (widthAvailableForGroup / 2) **For picked best action**
            //X = widthAvailableForGroup + (groupWidthMargin*2) + (widthAvailableForGroup / 2) **For all other actions**
            var centerXOfLabel;
            if (action.msxMaxValueAction) {
                //action.msxChartGeometry.actionLabelOriginX = (msxCG.groupWidthMargin*2) + (msxCG.widthAvailableForGroup / 2);
                centerXOfLabel = Math.floor(msxCG.groupWidthMargin*2 + msxCG.widthAvailableForRewardBars / 2);
                
            } else {
                //action.msxChartGeometry.actionLabelOriginX = msxCG.widthAvailableForGroup + (msxCG.groupWidthMargin*2) + (msxCG.widthAvailableForGroup / 2); 
                centerXOfLabel = Math.floor(msxCG.widthAvailableForGroup + msxCG.groupWidthMargin + msxCG.widthAvailableForRewardBars / 2);
            }
            action.msxChartGeometry.actionLabelOriginX = centerXOfLabel - 35;
            action.msxChartGeometry.actionLabelOriginY = actionLabelY;
        }
    }
    msxCG.positionValueMarkers = function (numberOfLines) {
        msxCG.positiveMarkerValues = [numberOfLines];
        msxCG.positiveMarkerYPixelsFromXAxis = [numberOfLines];
        var valueMarkers = Math.floor(chartData.getMaxAbsoluteValueReward() / numberOfLines);
        var setValue = valueMarkers;
        for (var i=0; i < numberOfLines; i++) {
            msxCG.positiveMarkerValues[i] = setValue;
            msxCG.positiveMarkerYPixelsFromXAxis[i] = (setValue * msxCG.scalingFactor).toFixed(2);
            setValue += valueMarkers;
        }
    }
    msxCG.positionValueLines = function (numberOfLines) {
        msxCG.positiveLine = [numberOfLines];
        var lineSpacing = Math.floor(chartData.getMaxAbsoluteValueReward() / numberOfLines * msxCG.scalingFactor);
        msxCG.positiveLineLength = msxCG.canvasWidth - 2 * msxCG.groupWidthMargin;
        msxCG.positiveLineOriginX = msxCG.groupWidthMargin;
        for (var i = 0; i < numberOfLines; i++) {
            msxCG.positiveLine[i] = {};
            msxCG.positiveLineOriginY[i] = ((msxCG.canvasHeight / 2) + (1 + Number(i)) * lineSpacing).toFixed(2);
        }
    }

    msxCG.positionTooltips = function(action, actionPositionInGraph) {
        var barsPerAction = action.bars.length;
        //if (action.msxMaxValueAction == false) {
        if (true) {
            for (var j in action.bars) {
                var bar = action.bars[j];
                var calc = Number((Number(actionPositionInGraph) * Number(barsPerAction)) + Number(j));
                // var actionRewardName = chartData.actionRewardNames[calc];

                // if (bar.msxImportantBar == true) {
                //     bar.msxChartGeometry.tooltipOriginX = bar.msxChartGeometry.originX - (msxCG.widthAvailableForRewardBars + (msxCG.groupWidthMargin * 2)) - 10;
                //     bar.msxChartGeometry.tooltipOriginY = (msxCG.canvasHeight - (chartData.getMaxAbsoluteValueReward() * 2 * msxCG.scalingFactor)) / 2
                // } else {
                    bar.msxChartGeometry.tooltipOriginX = bar.msxChartGeometry.originX + msxCG.rewardBarWidth;
                    bar.msxChartGeometry.tooltipOriginY = msxCG.canvasHeight/2 - bar.value * msxCG.scalingFactor * 0.75;
                //}
            }
        }
    }

    msxCG.positionValueTooltips = function(action) {
        for (var i in action.bars){
            var rewardBar = action.bars[i];
            rewardBar.msxChartGeometry.tooltipOriginX = rewardBar.msxChartGeometry.originX - Number(msxCG.rewardBarWidth / 2);
            // (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scalingFactor) * 0.75)
            if (rewardBar.value >= 0) {
                rewardBar.msxChartGeometry.tooltipOriginY = msxCG.canvasHeight/2 - (rewardBar.value + 30) * msxCG.scalingFactor;
            } else {
                rewardBar.msxChartGeometry.tooltipOriginY = msxCG.canvasHeight/2 - (rewardBar.value) * msxCG.scalingFactor;
            }
        }
    }

    msxCG.positionXAxisLine = function(){
        // xAxisLength = width - 2 * groupWidthMargin
        // xAxisOriginX = groupWidthMargin;
        // xAxisOriginY = height / 2
        msxCG.xAxisLength = msxCG.canvasWidth - 2 * msxCG.groupWidthMargin;
        msxCG.xAxisOriginY = msxCG.canvasHeight / 2;
        msxCG.xAxisOriginX = msxCG.groupWidthMargin;
    }

    msxCG.positionYAxisLine = function(){
        // yAxisLength = maxAbsRewardValue * 2 * scalingFactor
        // yAxisOriginX = groupWidthMargin;
        // yAxisOriginY = (canvasHeight - yAxisLength) / 2
        msxCG.yAxisLength = chartData.getMaxAbsoluteValueReward() * 2 * msxCG.scalingFactor;
        msxCG.yAxisOriginY = (msxCG.canvasHeight - msxCG.yAxisLength) / 2;
        msxCG.yAxisOriginX = msxCG.groupWidthMargin;
    }

    msxCG.positionActionSeparatorLines = function() {
        // acitonLinesLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
        // actionLinesOriginX
        // actionLinesOriginY = (canvasHeight - yAxisLength) / 2
        msxCG.actionLinesLength = Math.floor(chartData.getMaxAbsoluteValueReward() * 2 * msxCG.scalingFactor);
        var actionLineBasedOffYAxis = chartData.getMaxAbsoluteValueReward() * 2 * msxCG.scalingFactor;
        msxCG.actionLinesOriginY = (msxCG.canvasHeight - actionLineBasedOffYAxis) / 2;
        msxCG.actionLinesOriginX.push(msxCG.canvasWidth / 2);
    }

    return chartData;
}