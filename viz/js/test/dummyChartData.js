function buildDummyChart(rewardCount) {
    var chart = {};
    chart.actions = [];
    chart.actionBars = {};
    chart.actionBarNames = [];
    chart.rewardBars = {};
    chart.rewardBarNames = [];
    for (var i = 0; i < 4; i++){
        var action = {};
        action.bars = [];
        action.name = "action_"+ i;
        action.value = Number(0);
        for (var j = 0; j < rewardCount; j++){
            var bar = {};
            bar.name = "action_"+ i+ ".reward_" + j;
            if (j % 1 == 0){
                bar.value = (Number(i) + 1) * (Number(j)+ 1);
            }
            else {
                bar.value = -1 * (Number(i) + 1) * (Number(j)+ 1);
            }
            action.value = Number(action.value) + Number(bar.value);
            action.bars.push(bar);
            chart.rewardBars[bar.name] = bar;
            chart.rewardBarNames.push(bar.name);
        }
        chart.actions.push(action);
        chart.actionBars[action.name] = action;
        chart.actionBarNames.push(action.name);
    }
    return chart;
}