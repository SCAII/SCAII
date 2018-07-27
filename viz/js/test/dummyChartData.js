function buildDummyChart(rewardCount) {
    var chart = {};
    chart.actions = [];
    chart.actionBars = {};
    chart.actionBarNames = [];
    chart.rewardBars = {};
    chart.rewardBarNames = [];
    var posOrNeg = 0;
    for (var i = 0; i < 4; i++){
        var action = {};
        action.bars = [];
        action.name = "action_"+ i;
        action.value = Number(0);
        for (var j = 0; j < rewardCount; j++){
            var bar = {};
            bar.name = "action_"+ i+ ".reward_" + j;
            bar.rName = "reward_" + j;
            if (posOrNeg % 2 == 0){
                bar.value = ((Number(i) + 1) * (Number(j)+ 1)) * 10;
            }
            else {
                bar.value = -((Number(i) + 1) * (Number(j)+ 1)) * 10;
            }
            action.value = Number(action.value) + Number(bar.value);
            action.bars.push(bar);
            chart.rewardBars[bar.name] = bar;
            if (chart.rewardBarNames.length < rewardCount) {
                chart.rewardBarNames.push(bar.rName);
            }
            posOrNeg++;
        }
        chart.actions.push(action);
        chart.actionBars[action.name] = action;
        chart.actionBarNames.push(action.name);
    }
    return chart;
}