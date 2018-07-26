function runChartDataColorTests(failureChecker) {
    // color assignment tests
    //colors: ['#00AAAA', '#0055CC', '#00CC00']
    //colors: ['#00AAAA', '#0055CC', '#00CC00', '#004400', '#0000AA', '#006666', '#002222', '#000044']
    var fc = failureChecker;
    var ch = addUtilityFunctions(buildDummyChart(3));

    ch = addColorToBars(ch);

    fc.setCase("color test");
    //assign bars colors????

    fc.assert(ch.rewardBars["action_0.reward_0"].color, "#00AAAA", "color 0.0");
    fc.assert(ch.rewardBars["action_0.reward_1"].color, "#0055CC", "color 0.1");
    fc.assert(ch.rewardBars["action_0.reward_2"].color, "#00CC00", "color 0.2");

    fc.assert(ch.rewardBars["action_1.reward_0"].color, "#00AAAA", "color 1.0");

    fc.assert(ch.rewardBars["action_2.reward_1"].color, "#0055CC", "color 2.1");

    fc.assert(ch.rewardBars["action_3.reward_2"].color, "#00CC00", "color 3.2");

}