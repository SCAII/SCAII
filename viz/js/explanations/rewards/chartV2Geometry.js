
function addGeometryFunctions(rawChartData) {
    var rd = rawChartData;

    //added variables here
    rd.canvasHeight                 = undefined;
    rd.canvasWidth                  = undefined;
    rd.scalingFactor                = undefined;
    rd.widthAvailableForGroup       = undefined;
    rd.groupWidthMargin             = undefined;
    rd.widthAvailableForRewardBars  = undefined;
    rd.widthAvailableForRewardBar      = undefined;
    rd.rewardSpacerWidth            = undefined;
    rd.rewardBarWidth               = undefined;

    rd.initChartDimensions = function (canvasHeight, canvasWidth, groupWidthMarginFactor, rewardSpacerWidth) {
        this.rewardSpacerWidth = rewardSpacerWidth;
        this.canvasHeight = canvasHeight;
        this.canvasWidth = canvasWidth;
        this.widthAvailableForGroup = Math.floor(this.canvasWidth / this.actions.length);
        this.groupWidthMargin = Math.floor((this.widthAvailableForGroup * groupWidthMarginFactor) / 2);
        this.widthAvailableForRewardBars = Math.floor(this.widthAvailableForGroup - 2 * this.groupWidthMargin);
        this.widthAvailableForRewardBar = Math.floor(this.widthAvailableForRewardBars / this.rewardNames.length);
        this.rewardBarWidth = Math.floor(this.widthAvailableForRewardBar - 2 * rewardSpacerWidth);
        var maxAbsRewardValue = this.getMaxAbsoluteValueReward();
        this.scalingFactor = (canvasHeight / 2) * 0.75 / maxAbsRewardValue;
    }

    rd.positionRewardBar = function (rewardBar, actionIndex, rewardIndex) {
        //what is passed: ch.actionRewardForNameMap["action_0.reward_0"] & action number
        //204 widthAvailableForGroup == canvasWidth / actionCount 
        //groupWidthMargin = (widthAvailableForGroup * .2) / 2
        //bar.originX = i*widthAvailableForGroup + groupWidthMargin + j *(rewardBarWidth)
        //bar.originY = canvasHeight/2 ==> constant 320.0
<<<<<<< HEAD
        rewardBar.originX = action * widthAvailableForGroup + groupWidthMargin + (reward * rewardBarWidthAvailable);
        rewardBar.originY = rd.canvasHeight / 2;
=======
        rewardBar.originX = Math.floor(actionIndex * this.widthAvailableForGroup + this.groupWidthMargin + rewardIndex * this.rewardBarWidth);
        rewardBar.originY = this.canvasHeight / 2;
>>>>>>> 8769b80ead49f1bfd0e124b1350da0c36d11465b
    }


    rd.dimensionRewardBar = function (rewardBar) {
        //ch.actionRewardForNameMap["action_0.reward_0"]
        //widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        //widthAvailableForRewardBar = widthAvailableForRewardBars / rewardBarCount
        rewardBar.height = rewardBar.value * this.scalingFactor;
        rewardBar.width = this.rewardBarWidth;
    }


    rd.positionActionBar = function (actionBar, action) {
        //ch.actionForNameMap["action_0"]
        actionBar.originX = this.groupWidthMargin + action * this.widthAvailableForGroup;
        actionBar.originY = this.canvasHeight / 2;
    }


    rd.dimensionActionBar = function (actionBar) {
        //ch.actionForNameMap["action_0"]
        var total = 0;
        for (var i in actionBar.bars) {
            total += actionBar.bars[i].value;
        }
        actionBar.height = total * this.scalingFactor;
        actionBar.width = this.widthAvailableForRewardBars;
    }

    rd.positionActionLabels = function () {
        var minDistanceFromBarOrAxis = 20;
        var maxNegReward = this.getMaxNegativeReward();
        var actionLabelY = undefined;
        if (maxNegReward == undefined){
            actionLabelY = this.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else if (maxNegReward > -minDistanceFromBarOrAxis){
            actionLabelY = this.canvasHeight / 2 + minDistanceFromBarOrAxis;
        }
        else {
            actionLabelY = this.canvasHeight / 2 + Math.abs(maxNegReward) * this.scalingFactor + minDistanceFromBarOrAxis;
        }
        for (var i in this.actions){
            var action = this.actions[i];
            //groupWidthMargin + i * widthAvailableForGroup +  widthAvailableForRewardBars / 2
            action.actionLabelOriginX = this.groupWidthMargin + Number(i)* this.widthAvailableForGroup + this.widthAvailableForRewardBars / 2;
            action.actionLabelOriginY = actionLabelY;
        }
    }

    rd.positionValueMarkers = function (numberOfLines) {
        this.positiveMarkerValues = [numberOfLines];
        this.positiveMarkerYPixelsFromXAxis = [numberOfLines];
        var valueMarkers = this.getMaxAbsoluteValueReward() / 4;
        var setValue = valueMarkers;
        for (var i=0; i < numberOfLines; i++) {
            this.positiveMarkerValues[i] = setValue;
            this.positiveMarkerYPixelsFromXAxis[i] = setValue * this.scalingFactor;
            setValue += valueMarkers;
        }
    }

    rd.positionValueLines = function (numberOfLines) {
        var length = this.canvasWidth - this.groupWidthMargin * 2
        this.positiveLine = [numberOfLines];
        // TODO: make variable names for this funciton and one above better
        var lineSpacing = this.getMaxAbsoluteValueReward() / numberOfLines * this.scalingFactor;
        for (var i = 0; i < numberOfLines; i++) {
            this.positiveLine[i] = {};
            this.positiveLine[i].originX = this.groupWidthMargin;
            this.positiveLine[i].originY = (this.canvasHeight / 2) + (1 + Number(i)) * lineSpacing;
            this.positiveLine[i].length = length;
        }
    }
    rd.positionTooltips = function(rewardBars){
        var keys = Object.keys(rewardBars);
        for (var i in keys) {
            var key = keys[i];
            var rewardBar = rewardBars[key];
            //originX + rewardBarWidth

            rewardBar.tooltipOriginX = rewardBar.originX + this.rewardBarWidth;
            // (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scallingFactor) * 0.75)
            rewardBar.tooltipOriginY = this.canvasHeight/2 - rewardBar.value * this.scalingFactor * 0.75; 
        }
    }
    return rd;
}