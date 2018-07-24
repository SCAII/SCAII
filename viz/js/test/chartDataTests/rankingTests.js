function runChartDataRankingTests(failureChecker) {

    fc.assert(cm.getBar("Q1.combined").rank,0);
}

function rankThings(things, maxFunction){
    var result = [];
    while (things.length > 0){
        var maxThing = maxFunction(things);
        result.push(maxThing);
        var fewerThings = [];
        for (var i in things){
            var thing = things[i];
            if (thing != maxThing) {
                fewerThings.push(thing);
            }
        }
        things = fewerThings;
    }
    return result;
}

function maxFunction(things) {
    var maxPosValue = 0;
    var maxNegValue = 0;
    var maxValue = 0;
    for (var i in things) {
        for (var j in things[i]) {
            if (things[i][j] >= 0) {
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
    return maxValue;
}
