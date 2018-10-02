function runMsxGeometryTests (failureChecker, chartTesting) {

    var fc = failureChecker;
    fc.setTestName("MsxGeometryTests");
    if (chartTesting == "seeSaw") {
        var ch = getSeeSawChart();
    } else if (chartTesting == "allPositives") {
        var ch = getAllPositivesChart();
    } else {
        var ch = getAllNegativesChart();
    }
    ch = addUtilityFunctions(ch);

    ch = addMsxToBars(ch);

    /*
        640 == canvasHeight
        816 == canvasWidth
        348 == widthAvailableForGroup == (canvasWidth / 2) - (groupWidthMargin * 3) 
        scalingFactor == 2
        x axis of chart sits at y == canvasHeight/2
        biggest bar should take up .75 of canvasHeight/2  (120 * scalingFactor == 3/4 * canvasHeight/2) (we assumed scalingFactor == 2)
        biggest bar for seeSaw: -120
        biggest bar for allPositives: 120
        biggest bar for allNegatives: -120

        groupWidthMargin = 20

        54 == rewardBarWidth = widthAvailableForGroup / rewardBarCount   (assume rewardBarCount == 3)

        bar.originX = i*widthAvailableForGroup + ((groupWidthMargin*2) * (i+1)) + j *(rewardBarWidth)
        bar.originY = canvasHeight/2 ==> constant 320.0


        fc.setCase("bar dimensions allNegatives");
        fc.setCase("action labels positioning seeSaw");
        fc.setCase("value markers positioning seeSaw");
        fc.setCase("value line positioning seeSaw");
        ????fc.setCase("tooltips positioning seeSaw");
        fc.setCase("xAxisLine positioning");
        fc.setCase("yAxisLine positioning");
        fc.setCase("isPointInBox");
        fc.setCase("bar click/mouse move detection seeSaw");
    */
    

    if (chartTesting == "seeSaw") {
        //fc.setCase("seeSaw [DETAIL]");
        fc.setCase("msx seeSaw bar positioning");
        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"], 0, 0);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originX, 428.0, "originX 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originY, 320.0, "originY 0.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"], 0, 1);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originX, 544.0, "originX 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originY, 320.0, "originY 0.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"], 0, 2);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originX, 660.0, "originX 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"], 1, 0);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originX, 428.0, "originX 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originY, 320.0, "originY 1.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"], 1, 1);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originX, 544.0, "originX 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originY, 320.0, "originY 1.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"], 1, 2);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originX, 660.0, "originX 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"], 2, 0);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originX, 40.0, "originX 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originY, 320.0, "originY 2.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"], 2, 1);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originX, 156.0, "originX 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originY, 320.0, "originY 2.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"], 2, 2);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originX, 272.0, "originX 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"], 3, 0);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originX, 428.0, "originX 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originY, 320.0, "originY 3.0");
        
        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"], 3, 1);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originX, 544.0, "originX 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originY, 320.0, "originY 3.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"], 3, 2);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originX, 660.0, "originX 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originY, 320.0, "originY 3.2");

    } else if (chartTesting == "allPositives") {
        fc.setCase("msx allPositives bar positioning");
        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"], 0, 0);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originX, 428.0, "originX 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originY, 320.0, "originY 0.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"], 0, 1);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originX, 544.0, "originX 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originY, 320.0, "originY 0.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"], 0, 2);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originX, 660.0, "originX 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"], 1, 0);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originX, 428.0, "originX 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originY, 320.0, "originY 1.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"], 1, 1);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originX, 544.0, "originX 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originY, 320.0, "originY 1.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"], 1, 2);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originX, 660.0, "originX 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"], 2, 0);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originX, 428.0, "originX 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originY, 320.0, "originY 2.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"], 2, 1);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originX, 544.0, "originX 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originY, 320.0, "originY 2.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"], 2, 2);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originX, 660.0, "originX 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"], 3, 0);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originX, 40.0, "originX 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originY, 320.0, "originY 3.0");
        
        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"], 3, 1);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originX, 156.0, "originX 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originY, 320.0, "originY 3.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"], 3, 2);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originX, 272.0, "originX 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originY, 320.0, "originY 3.2");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("msx allNegatives bar positioning");
        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"], 0, 0);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originX, 40.0, "originX 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originY, 320.0, "originY 0.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"], 0, 1);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originX, 156.0, "originX 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originY, 320.0, "originY 0.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"], 0, 2);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originX, 272.0, "originX 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"], 1, 0);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originX, 428.0, "originX 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originY, 320.0, "originY 1.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"], 1, 1);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originX, 544.0, "originX 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originY, 320.0, "originY 1.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"], 1, 2);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originX, 660.0, "originX 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"], 2, 0);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originX, 428.0, "originX 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originY, 320.0, "originY 2.0");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"], 2, 1);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originX, 544.0, "originX 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originY, 320.0, "originY 2.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"], 2, 2);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originX, 660.0, "originX 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"], 3, 0);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originX, 428.0, "originX 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originY, 320.0, "originY 3.0");
        
        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"], 3, 1);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originX, 544.0, "originX 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originY, 320.0, "originY 3.1");

        ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"], 3, 2);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originX, 660.0, "originX 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originY, 320.0, "originY 3.2");
    }

}