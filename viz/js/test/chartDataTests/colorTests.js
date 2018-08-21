function runChartDataColorTests(failureChecker) {
    // color assignment tests
    //rd.colors = ['#7293CB','#E1974C',  '#84BA5B','#D35E60', '#9067A7', '#AB6857',  '#CCC210',  '#000044']
    var fc = failureChecker;
    fc.setTestName("chartDataColorTests");
    var ch = addUtilityFunctions(buildDummyChart(3));

    ch = addColorToBars(ch);

    fc.setCase("color test");
    //assign bars colors????

    fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].color, "#7293CB", "color 0.0");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].color, "#E1974C", "color 0.1");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].color, "#84BA5B", "color 0.2");

    fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].color, "#7293CB", "color 1.0");

    fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].color, "#E1974C", "color 2.1");

    fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].color, "#84BA5B", "color 3.2");

}