function addRankingFunctions(rawChartData) {
    var rd = rawChartData;

    rd.rank = [];
    for (var i in rd.actions) {
        for (var j in rd.actions[i].bars) {
            rd.actions[i].bars[j].rank = 0;
        }
    }
    rd.rank = this.rankThings(rd.actions[i].bars[j], this.maxFunction());

    rd.maxFunction = function (things) {
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

    return rd;
}