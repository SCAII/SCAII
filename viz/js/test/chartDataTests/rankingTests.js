function runChartDataRankingTests(failureChecker) {
    var fc = failureChecker;
    var cm = addUtilityFunctions(buildDummyChart(3));

    cm = addRankingFunctions(cm);

    //cm.newVar = cm.rankThings(cm.rewardBars)
    fc.assert(cm.rewardBars["action_0.reward_0"].rank, 0, "0.0 rank");
}