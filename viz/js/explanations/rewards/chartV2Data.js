function addUtilityFunctions(rawChartData) {
    var rd = rawChartData;

    rd.positiveMarkerValues = [];
    rd.positiveMarkerPixelsFromOrigin = [];
    rd.getActionForName = function (actionName) {
        for (var i in rd.actions) {
            if (rd.actions[i].actionBarName == actionName) {
                return rd.actions[i];
            }
        }
    }
    rd.getRewardForName = function (actionName, rewardName) {
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
    rd.getMaxAbsoluteValueReward = function(){
        //WHERE DO I ADD THIS INFORMATION?
        var addFive = 0; //sits at 160
        var i = 0;
        for (var i in this.options.data) {
            for (var j in this.options.data[i]) {
                if (this.options.data[i][j] >= 0) {
                    maxPosValue = Math.max(maxValue, this.options.data[i][j]);
                } else {
                    maxNegValue = Math.max(maxNegValue, Math.abs(this.options.data[i][j]));
                }
            }
        }
        if (maxPosValue > maxNegValue) {
            maxValue = maxPosValue;
        } else {
            maxValue = maxNegValue;
        }
        maxNegValue = -maxNegValue;
        //?????
        for (i = 0; i < ch.maxBar; i++) {
            fc.assert()
            addFive += 5;
        }
    }
    rd.getMaxPositiveReward = function(){
        
    }
    rd.getMaxNegativeReward = function(){
        
    }
    return rd;
}







function rankThings(things, maxFunction) {
    var result = [];
    while (things.length > 0) {
        var maxThing = maxFunction(things);
        result.push(maxThing);
        var fewerThings = [];
        for (var i in things) {
            var thing = things[i];
            if (thing != maxThing) {
                fewerThings.push(thing);
            }
        }
        things = fewerThings;
    }
    return result;
}
