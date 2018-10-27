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


    msxCG.initMsxChartDimensions = function (canvasHeight, canvasWidth, groupWidthMarginFactor, rewardSpacerWidth) {
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

    msxCG.positionMsxRewardBar = function (maxValueAction, rewardBar, actionIndex, rewardIndex) {
            //bar.originX = (groupWidthMargin*2) + j *(rewardBarWidth) **For picked best action**
            //bar.originX = widthAvailableForGroup + (groupWidthMargin*2) + j *(rewardBarWidth) **For all other actions**
            //bar.originY = canvasHeight/2 ==> constant 320.0

            if (maxValueAction == true) {
                rewardBar.originX = Math.floor((msxCG.groupWidthMargin * 2) + (rewardIndex * msxCG.rewardBarWidth));
            } else {
                rewardBar.originX = Math.floor(msxCG.widthAvailableForGroup + msxCG.groupWidthMargin + (rewardIndex * msxCG.rewardBarWidth));
            }
            rewardBar.originY = msxCG.canvasHeight / 2;

        }
    
    msxCG.positionMsxActionLabels = function(minDistanceFromBarOrAxis) {
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
            if (action.msxMaxValueAction) {
                action.actionLabelOriginX = (msxCG.groupWidthMargin*2) + (msxCG.widthAvailableForGroup / 2);
            } else {
                action.actionLabelOriginX = msxCG.widthAvailableForGroup + (msxCG.groupWidthMargin*2) + (msxCG.widthAvailableForGroup / 2);
            }
            action.actionLabelOriginY = actionLabelY;
        }

    }
    msxCG.positionMsxValueMarkers = function (numberOfLines) {
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
    msxCG.positionMsxValueLines = function (numberOfLines) {
        msxCG.positiveLine = [numberOfLines];
        var lineSpacing = Math.floor(chartData.getMaxAbsoluteValueReward() / numberOfLines * msxCG.scalingFactor);
        msxCG.positiveLineLength = msxCG.canvasWidth - 2 * msxCG.groupWidthMargin;
        msxCG.positiveLineOriginX = msxCG.groupWidthMargin;
        for (var i = 0; i < numberOfLines; i++) {
            msxCG.positiveLine[i] = {};
            msxCG.positiveLineOriginY[i] = ((msxCG.canvasHeight / 2) + (1 + Number(i)) * lineSpacing).toFixed(2);
        }
    }

    msxCG.positionMsxXAxisLine = function(){
        // xAxisLength = width - 2 * groupWidthMargin
        // xAxisOriginX = groupWidthMargin;
        // xAxisOriginY = height / 2
        msxCG.xAxisLength = msxCG.canvasWidth - 2 * msxCG.groupWidthMargin;
        msxCG.xAxisOriginY = msxCG.canvasHeight / 2;
        msxCG.xAxisOriginX = msxCG.groupWidthMargin;
    }

    msxCG.positionMsxYAxisLine = function(){
        // yAxisLength = maxAbsRewardValue * 2 * scalingFactor
        // yAxisOriginX = groupWidthMargin;
        // yAxisOriginY = (canvasHeight - yAxisLength) / 2
        msxCG.yAxisLength = chartData.getMaxAbsoluteValueReward() * 2 * msxCG.scalingFactor;
        msxCG.yAxisOriginY = (msxCG.canvasHeight - msxCG.yAxisLength) / 2;
        msxCG.yAxisOriginX = msxCG.groupWidthMargin;
    }

    msxCG.positionMsxActionSeparatorLines = function() {
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