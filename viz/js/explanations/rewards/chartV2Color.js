function addColorToBars(rawChartData) {
    var rd = rawChartData;
    //possible issue: if rawChartData has different number of bars for each action colors will NOT be consistent
    //possible solution: base it off of rName variable?
    //possible solution: don't use ch.actionRewardForNameMap variable in colorTests?
    rd.colors = ['#00AAAA', '#0055CC', '#00CC00', '#004400', '#0000AA', '#006666', '#002222', '#000044']

    for (var i in rd.actions) {
        for (var j in rd.actions[i].bars) {
            rd.actions[i].bars[j].color = rd.colors[j];
        }
        rd.actions[i].color = "lightgray";
    }

    return rd;
}