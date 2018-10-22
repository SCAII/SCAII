function addMsxGeometryFunctions(rawChartData) {
    var rd = rawChartData

    rd.initMsxChartDimensions = function (canvasHeight, canvasWidth, groupWidthMarginFactor, rewardSpacerWidth) {
            rd.canvasHeight = canvasHeight;
            rd.canvasWidth = canvasWidth;
            rd.widthAvailableForGroup = Math.floor(rd.canvasWidth / 2);
            rd.groupWidthMargin = Math.floor((rd.widthAvailableForGroup * groupWidthMarginFactor) / 2);
            rd.widthAvailableForRewardBars = Math.floor(rd.widthAvailableForGroup - (3 * rd.groupWidthMargin));
            rd.widthAvailableForRewardBar = Math.floor(rd.widthAvailableForRewardBars / rd.rewardNames.length);
            rd.rewardBarWidth = Math.floor(rd.widthAvailableForRewardBar - (rewardSpacerWidth));
            //biggest bar should take up .75 of canvasHeight/2  (120 * scalingFactor == 3/4 * canvasHeight/2) (we assumed scalingFactor == 2)
            rd.scalingFactor = ( ((rd.canvasHeight / 2) * 0.75) / rd.getMaxAbsoluteValueReward() ).toFixed(2);
    }

    rd.positionMsxRewardBar = function (maxValueAction, rewardBar, actionIndex, rewardIndex) {
            //bar.originX = (groupWidthMargin*2) + j *(rewardBarWidth) **For picked best action**
            //bar.originX = widthAvailableForGroup + (groupWidthMargin*2) + j *(rewardBarWidth) **For all other actions**
            //bar.originY = canvasHeight/2 ==> constant 320.0

            if (maxValueAction == true) {
                rewardBar.originX = Math.floor((rd.groupWidthMargin * 2) + (rewardIndex * rd.rewardBarWidth));
            } else {
                rewardBar.originX = Math.floor(rd.widthAvailableForGroup + rd.groupWidthMargin + (rewardIndex * rd.rewardBarWidth));
            }
            rewardBar.originY = rd.canvasHeight / 2;

        }
    
    rd.positionMsxActionLabels = function(minDistanceFromBarOrAxis) {
        var maxAbsValNegBar = rd.getMaxAbsValNegativeReward();
        var actionLabelY = undefined;
        if (maxAbsValNegBar == undefined){
            actionLabelY = rd.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else if (maxAbsValNegBar < minDistanceFromBarOrAxis){
            actionLabelY = rd.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else {
            actionLabelY = rd.canvasHeight / 2 + maxAbsValNegBar * rd.scalingFactor + minDistanceFromBarOrAxis;
        }
        for (var i in rd.actions){
            var action = rd.actions[i];
            //X = (groupWidthMargin*2) + (widthAvailableForGroup / 2) **For picked best action**
            //X = widthAvailableForGroup + (groupWidthMargin*2) + (widthAvailableForGroup / 2) **For all other actions**
            if (action.msxMaxValueAction) {
                action.actionLabelOriginX = (rd.groupWidthMargin*2) + (rd.widthAvailableForGroup / 2);
            } else {
                action.actionLabelOriginX = rd.widthAvailableForGroup + (rd.groupWidthMargin*2) + (rd.widthAvailableForGroup / 2);
            }
            action.actionLabelOriginY = actionLabelY;
        }

    }
    rd.positionMsxValueMarkers = function (numberOfLines) {
        rd.positiveMarkerValues = [numberOfLines];
        rd.positiveMarkerYPixelsFromXAxis = [numberOfLines];
        var valueMarkers = Math.floor(rd.getMaxAbsoluteValueReward() / numberOfLines);
        var setValue = valueMarkers;
        for (var i=0; i < numberOfLines; i++) {
            rd.positiveMarkerValues[i] = setValue;
            rd.positiveMarkerYPixelsFromXAxis[i] = (setValue * rd.scalingFactor).toFixed(2);
            setValue += valueMarkers;
        }
    }
    rd.positionMsxValueLines = function (numberOfLines) {
        rd.positiveLine = [numberOfLines];
        var lineSpacing = Math.floor(rd.getMaxAbsoluteValueReward() / numberOfLines * rd.scalingFactor);
        rd.positiveLineLength = rd.canvasWidth - 2 * rd.groupWidthMargin;
        rd.positiveLineOriginX = rd.groupWidthMargin;
        for (var i = 0; i < numberOfLines; i++) {
            rd.positiveLine[i] = {};
            rd.positiveLineOriginY[i] = ((rd.canvasHeight / 2) + (1 + Number(i)) * lineSpacing).toFixed(2);
        }
    }

    rd.positionMsxXAxisLine = function(){
        // xAxisLength = width - 2 * groupWidthMargin
        // xAxisOriginX = groupWidthMargin;
        // xAxisOriginY = height / 2
        rd.xAxisLength = rd.canvasWidth - 2 * rd.groupWidthMargin;
        rd.xAxisOriginY = rd.canvasHeight / 2;
        rd.xAxisOriginX = rd.groupWidthMargin;
    }

    rd.positionMsxYAxisLine = function(){
        // yAxisLength = maxAbsRewardValue * 2 * scalingFactor
        // yAxisOriginX = groupWidthMargin;
        // yAxisOriginY = (canvasHeight - yAxisLength) / 2
        rd.yAxisLength = rd.getMaxAbsoluteValueReward() * 2 * rd.scalingFactor;
        rd.yAxisOriginY = (rd.canvasHeight - rd.yAxisLength) / 2;
        rd.yAxisOriginX = rd.groupWidthMargin;
    }

    rd.positionMsxActionSeparatorLines = function() {
        // acitonLinesLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
        // actionLinesOriginX
        // actionLinesOriginY = (canvasHeight - yAxisLength) / 2
        rd.actionLinesLength = Math.floor(rd.getMaxAbsoluteValueReward() * 2 * rd.scalingFactor);
        var actionLineBasedOffYAxis = rd.getMaxAbsoluteValueReward() * 2 * rd.scalingFactor;
        rd.actionLinesOriginY = (rd.canvasHeight - actionLineBasedOffYAxis) / 2;
        rd.actionLinesOriginX.push(rd.canvasWidth / 2);
    }

    return rd;
}