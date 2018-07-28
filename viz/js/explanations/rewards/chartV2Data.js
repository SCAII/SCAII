function addUtilityFunctions(chart) {
    var ch = chart;

    ch.positiveMarkerValues = [];

    ch.positiveMarkerPixelsFromOrigin = [];

    ch.getActionForName = function (actionName) {
        for (var i in rd.actions) {
            if (rd.actions[i].actionBarName == actionName) {
                return rd.actions[i];
            }
        }
    }

    ch.getRewardForName = function (actionName, rewardName) {
        for (var i in rd.actions) {
            if (rd.actions[i].actionBarName == actionName) {
                for (var j in rd.actions[i].bars) {
                    if (rd.actions[i].bars[j].rewardBarNames == rewardName) {
                        return rd.actions[i].bars[j];
                    }
                }
            }
        }
    }
    ch.getMaxBar = function () {
        var maxBar = 0;
        maxBar = Math.max(this.getMaxAbsoluteValueReward(), this.getMaxActionValue());
        return maxBar;
    }
    ch.getMaxActionValue = function () {
        var maxTotal = 0;
        for (var i in ch.actionBars) {
            maxTotal = Math.max(maxValue, Math.abs(ch.actionsBars[i]));
        }
        return maxTotal;
    }
    ch.getMaxAbsoluteValueReward = function () {
        var maxValue;
        for (var i in ch.actionsBars) {
            for (var j in ch.actionBars[i].bars) {
                maxValue = Math.max(maxValue, Math.abs(ch.actionBars[i].bars[j]));
            }
        }
        return maxValue;
    }
    ch.getMaxPositiveReward = function () {
        var maxPosValue;
        for (var i in ch.actionBars) {
            for (var j in ch.actionBars[i].bars) {
                if (ch.actionsBars[i].bars[j] >= 0) {
                    maxPosValue = Math.max(maxPosValue, ch.actionBars[i].bars[j]);
                }
            }
        }
        return maxPosValue;
    }
    ch.getMaxNegativeReward = function () {
        var maxNegValue;
        for (var i in ch.actionBars) {
            for (var j in ch.actionBars[i].bars) {
                if (ch.actionsBars[i].bars[j] <= 0) {
                    maxNegValue = Math.max(maxNegValue, Math.abs(ch.actionBars[i].bars[j]));
                }
            }
        }
        return maxNegValue;
    }
    return ch;
}