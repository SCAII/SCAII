function runMsxChartDataColorTests (failureChecker, chartType, chartTesting) {
    //rd.colors = ['#7293CB','#E1974C',  '#84BA5B','#D35E60', '#9067A7', '#AB6857',  '#CCC210',  '#000044']
    var fc = failureChecker;
    fc.setTestName("MsxChartDataColorTests");
    var ch = chartType;
    ch = addUtilityFunctions(ch);

    ch = addMsxToBars(ch);

    fc.setCase("MSX color test");

    if (chartTesting == "seeSaw") {
        fc.setCase("seeSaw Color");

        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].msxColor, "#7293CB", "color 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].msxColor, "grey", "color 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].msxColor, "#84BA5B", "color 0.2");

        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].msxColor, "grey", "color 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].msxColor, "grey", "color 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].msxColor, "#84BA5B", "color 1.2");

        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].msxColor, "grey", "color 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].msxColor, "grey", "color 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].msxColor, "grey", "color 2.2");

        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].msxColor, "grey", "color 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].msxColor, "grey", "color 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].msxColor, "#84BA5B", "color 3.2");

    } else if (chartTesting == "allPositives") {
        fc.setCase("allPositives Color");

        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].msxColor, "grey", "color 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].msxColor, "grey", "color 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].msxColor, "#84BA5B", "color 0.2");
    
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].msxColor, "grey", "color 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].msxColor, "#E1974C", "color 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].msxColor, "grey", "color 1.2");

        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].msxColor, "#7293CB", "color 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].msxColor, "grey", "color 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].msxColor, "grey", "color 2.2");

        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].msxColor, "grey", "color 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].msxColor, "grey", "color 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].msxColor, "grey", "color 3.2");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("allNegatives Color");

        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].msxColor, "grey", "color 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].msxColor, "grey", "color 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].msxColor, "grey", "color 0.2");

        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].msxColor, "#7293CB", "color 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].msxColor, "grey", "color 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].msxColor, "grey", "color 1.2");

        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].msxColor, "#7293CB", "color 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].msxColor, "grey", "color 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].msxColor, "grey", "color 2.2");

        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].msxColor, "#7293CB", "color 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].msxColor, "grey", "color 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].msxColor, "grey", "color 3.2");
    }

}