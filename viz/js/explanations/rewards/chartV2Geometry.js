
function geometryImplementation(rawChartData) {
    var rd = rawChartData;

    //added variables here
    rd.scallingFactor = 2;
    var widthAvailableForGroup = rd.canvasWidth / rd.actions.length;
    var groupWidthMargin = (widthAvailableForGroup * 0.2) / 2;
    var widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin;
    var rewardBarWidthAvailable = widthAvailableForRewardBars / rd.actions.length;

    rd.setCanvasDimensions = function (height, width) {
        rd.canvasHeight = height;
        rd.canvasWidth = width;
    }

    rd.positionRewardBar = function (rewardBar, action) {
        //what is passed: ch.rewardBars["action_0.reward_0"] & action number
        //204 widthAvailableForGroup == canvasWidth / actionCount 
        //groupWidthMargin = (widthAvailableForGroup * .2) / 2
        //bar.originX = i*widthAvailableForGroup + groupWidthMargin 
        //bar.originY = canvasHeight/2 ==> constant 320.0
        rewardBar.originX = action * widthAvailableForGroup + groupWidthMargin + (reward * rewardBarWidthAvailable);
        rewardBar.originY = rd.canvasHeight / 2;
    }


    rd.dimensionRewardBar = function (rewardBar) {
        //ch.rewardBars["action_0.reward_0"]
        //widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        //rewardBarWidthAvailable = widthAvailableForRewardBars / rewardBarCount
        rewardBar.height = rewardBar.value * rd.scallingFactor;
        rewardBar.width = widthAvailableForRewardBars / rewardBarWidthAvailable;
    }


    rd.positionActionBar = function (actionBar, action) {
        //ch.actionBars["action_0"]
        actionBar.originX = rd.groupWidthMargin + action * widthAvailableForGroup;
        actionBar.originY = rd.canvasHeight / 2;
    }


    rd.dimensionActionBar = function (actionBar) {
        //ch.actionBars["action_0"]
        var total = 0;
        for (var i in actionBar.bars) {
            total += actionBar.bars[i];
        }
        actionBar.height = total * rd.scallingFactor;
        actionBar.width = widthAvailableForRewardBars;
    }

    rd.positionActionLabels = function (actionBarNames) {
        //ch.actionBarNames
        actionBarNames.originX = groupWidthMargin
        // TODO: add function to getMaxNegBar 
        //      (see if totalNegBar is greater than maxNegRewardBar)
        actionBarNames.originY = rd.canvasHeight / 2 + rd.getMaxNegReward;
    }

    rd.positionValueMarkers = function (numberOfLines) {

        rd.positiveMarkerValues = [numberOfLines];
        rd.positiveMarkerPixelsFromOrigin = [numberOfLines];
        var valueMarkers = rd.getMaxAbsoluteValueReward() / 4;
        var setValue = valueMarkers;
        for (var i=0; i < numberOfLines; i++) {
            rd.positiveMarkerValues[i] = setValue;
            rd.positiveMarkerPixelsFromOrigin[i] = setValue * rd.scallingFactor;
            setValue += valueMarkers;
        }
    }

    rd.positionValueLines = function (numberOfLines) {
        // TODO: make variable names for this funciton and one above better
        var maxAbs = rd.getMaxAbsoluteValueReward() / numberOfLines;
        for (var i = 0; i < numberOfLines; i++) {
            rd.positiveLine[i].originX = groupWidthMargin;
            rd.positiveLine[i].originY = (rd.canvasHeight / 2) + maxAbs * rd.scallingFactor;
        }
    }

    return rd;
}