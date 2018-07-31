function addUtilityFunctions(chart) {
    var ch = chart;

    ch.positiveMarkerValues = [];

    ch.positiveMarkerYPixelsFromXAxis = [];

    ch.getActionForName = function (actionName) {
        for (var i in rd.actions) {
            if (rd.actions[i].actionBarName == actionName) {
                return rd.actions[i];
            }
        }
    }

    // ch.getActionRewardForName = function (actionRewardName) {
    //     return ch.actionRewardForNameMap[rewardName];
    //     // for (var i in rd.actions) {
    //     //     if (rd.actions[i].actionBarName == actionName) {
    //     //         for (var j in rd.actions[i].bars) {
    //     //             if (rd.actions[i].bars[j].actionRewardNames == rewardName) {
    //     //                 return rd.actions[i].bars[j];
    //     //             }
    //     //         }
    //     //     }
    //     // }
    // }
    ch.getMaxBar = function () {
        var maxBar = 0;
        maxBar = Math.max(this.getMaxAbsoluteValueReward(), this.getMaxActionValue());
        return maxBar;
    }
    ch.getMaxActionValue = function () {
        var maxTotal = 0;
        for (var i in ch.actionForNameMap) {
            maxTotal = Math.max(maxTotal, Math.abs(ch.actionForNameMap[i].value));
        }
        return maxTotal;
    }
    ch.getMaxAbsoluteValueReward = function () {
        var maxValue = undefined;
        for (var i in ch.actions) {
            for (var j in ch.actions[i].bars) {
                if (maxValue == undefined) {
                    maxValue = ch.actions[i].bars[j].value;
                }
                else {
                    maxValue = Math.max(maxValue, Math.abs(ch.actions[i].bars[j].value));
                }
            }
        }
        return maxValue;
    }
    ch.getMaxPositiveReward = function () {
        var maxPosValue = undefined;
        for (var i in ch.actions) {
            for (var j in ch.actions[i].bars) {
                if (ch.actions[i].bars[j].value >= 0) {
                    if (maxPosValue == undefined) {
                        maxPosValue = ch.actions[i].bars[j].value;
                    }
                    else {
                        maxPosValue = Math.max(maxPosValue, ch.actions[i].bars[j].value);
                    }
                }
            }
        }
        return maxPosValue;
    }
    // get the negative reward with the largest absolute value
    ch.getMaxNegativeReward = function () {
        var maxNegValue = undefined;
        for (var i in ch.actions) {
            for (var j in ch.actions[i].bars) {
                if (ch.actions[i].bars[j].value <= 0) {
                    if (maxNegValue == undefined) {
                        maxNegValue = ch.actions[i].bars[j].value;
                    }
                    else {
                        maxNegValue = Math.min(maxNegValue, ch.actions[i].bars[j].value);
                    }
                }
            }
        }
        return maxNegValue;
    }
    return ch;
}