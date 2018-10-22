function runMsxGeometryTests (failureChecker, chartTesting) {

    var fc = failureChecker;
    if (chartTesting == "seeSaw") {
        fc.setTestName("MsxGeometryTests - seeSaw");
        var ch = getSeeSawChart();
    } else if (chartTesting == "allPositives") {
        fc.setTestName("MsxGeometryTests -  allPos");
        var ch = getAllPositivesChart();
    } else {
        fc.setTestName("MsxGeometryTests - allNeg");
        var ch = getAllNegativesChart();
    }
    ch = addUtilityFunctions(ch);

    ch = addMsxToBars(ch);

    /*
        640 == canvasHeight
        816 == canvasWidth
        408 == widthAvailableForGroup == (canvasWidth / 2)
        scalingFactor == 2
        x axis of chart sits at y == canvasHeight/2
        biggest bar should take up .75 of canvasHeight/2  (120 * scalingFactor == 3/4 * canvasHeight/2) (we assumed scalingFactor == 2)
        biggest bar for seeSaw: -120
        biggest bar for allPositives: 120
        biggest bar for allNegatives: -120

        groupWidthMargin = 40

        54 == rewardBarWidth = widthAvailableForGroup / rewardBarCount   (assume rewardBarCount == 3)

        bar.originX = i*widthAvailableForGroup + ((groupWidthMargin*2) * (i+1)) + j *(rewardBarWidth)
        bar.originY = canvasHeight/2 ==> constant 320.0

        ????fc.setCase("tooltips positioning seeSaw");
        fc.setCase("isPointInBox");
        fc.setCase("bar click/mouse move detection seeSaw");
    */
    ch = addGeometryFunctions(ch);
    ch = addMsxGeometryFunctions(ch);
    ch.initMsxChartDimensions(640.0, 816.0, 0.2, 0.0);

    if (chartTesting == "seeSaw") {
        //fc.setCase("seeSaw [DETAIL]");
        fc.setCase("msx seeSaw bar positioning");
        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_0"], 0, 0);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originX, 448.0, "originX 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originY, 320.0, "originY 0.0");

        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_1"], 0, 1);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originX, 544.0, "originX 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originY, 320.0, "originY 0.1");

        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_2"], 0, 2);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originX, 640.0, "originX 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_0"], 1, 0);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originX, 448.0, "originX 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originY, 320.0, "originY 1.0");

        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_1"], 1, 1);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originX, 544.0, "originX 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originY, 320.0, "originY 1.1");

        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_2"], 1, 2);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originX, 640.0, "originX 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_0"], 2, 0);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originX, 80.0, "originX 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originY, 320.0, "originY 2.0");

        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_1"], 2, 1);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originX, 176.0, "originX 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originY, 320.0, "originY 2.1");

        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_2"], 2, 2);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originX, 272.0, "originX 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_0"], 3, 0);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originX, 448.0, "originX 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originY, 320.0, "originY 3.0");
        
        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_1"], 3, 1);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originX, 544.0, "originX 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originY, 320.0, "originY 3.1");

        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_2"], 3, 2);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originX, 640.0, "originX 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originY, 320.0, "originY 3.2");

    } else if (chartTesting == "allPositives") {
        fc.setCase("msx allPositives bar positioning");
        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_0"], 0, 0);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originX, 448.0, "originX 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originY, 320.0, "originY 0.0");

        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_1"], 0, 1);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originX, 544.0, "originX 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originY, 320.0, "originY 0.1");

        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_2"], 0, 2);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originX, 640.0, "originX 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_0"], 1, 0);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originX, 448.0, "originX 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originY, 320.0, "originY 1.0");

        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_1"], 1, 1);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originX, 544.0, "originX 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originY, 320.0, "originY 1.1");

        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_2"], 1, 2);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originX, 640.0, "originX 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_0"], 2, 0);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originX, 448.0, "originX 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originY, 320.0, "originY 2.0");

        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_1"], 2, 1);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originX, 544.0, "originX 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originY, 320.0, "originY 2.1");

        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_2"], 2, 2);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originX, 640.0, "originX 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_0"], 3, 0);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originX, 80.0, "originX 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originY, 320.0, "originY 3.0");
        
        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_1"], 3, 1);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originX, 176.0, "originX 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originY, 320.0, "originY 3.1");

        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_2"], 3, 2);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originX, 272.0, "originX 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originY, 320.0, "originY 3.2");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("msx allNegatives bar positioning");
        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_0"], 0, 0);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originX, 80.0, "originX 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originY, 320.0, "originY 0.0");

        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_1"], 0, 1);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originX, 176.0, "originX 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originY, 320.0, "originY 0.1");

        ch.positionMsxRewardBar(ch.actions[0].msxMaxValueAction, ch.actionRewardForNameMap["action_0.reward_2"], 0, 2);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originX, 272.0, "originX 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_0"], 1, 0);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originX, 448.0, "originX 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originY, 320.0, "originY 1.0");

        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_1"], 1, 1);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originX, 544.0, "originX 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].originY, 320.0, "originY 1.1");

        ch.positionMsxRewardBar(ch.actions[1].msxMaxValueAction, ch.actionRewardForNameMap["action_1.reward_2"], 1, 2);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originX, 640.0, "originX 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_0"], 2, 0);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originX, 448.0, "originX 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].originY, 320.0, "originY 2.0");

        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_1"], 2, 1);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originX, 544.0, "originX 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originY, 320.0, "originY 2.1");

        ch.positionMsxRewardBar(ch.actions[2].msxMaxValueAction, ch.actionRewardForNameMap["action_2.reward_2"], 2, 2);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originX, 640.0, "originX 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_0"], 3, 0);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originX, 448.0, "originX 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].originY, 320.0, "originY 3.0");
        
        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_1"], 3, 1);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originX, 544.0, "originX 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].originY, 320.0, "originY 3.1");

        ch.positionMsxRewardBar(ch.actions[3].msxMaxValueAction, ch.actionRewardForNameMap["action_3.reward_2"], 3, 2);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originX, 640.0, "originX 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originY, 320.0, "originY 3.2");
    }


    //2.55 == this.scalingFactor = ((canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue()).toFixed(2);
    //rewardBar.height = Math.abs(rewardBar.value * this.scalingFactor);
    if (chartTesting == "seeSaw") {
        fc.setCase("bar dimensions seeSaw");
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].height, 20.0, "originHeight 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].width, 96.0, "originWidth 0.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].height, 40.0, "originHeight 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].width, 96.0, "originWidth 0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].height, 60.0, "originHeight 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].width, 96.0, "originWidth 0.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].height, 80.0, "originHeight 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].width, 96.0, "originWidth 1.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].height, 100.0, "originHeight 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].width, 96.0, "originWidth 1.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].height, 120.0, "originHeight 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].width, 96.0, "originWidth 1.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].height, 140.0, "originHeight 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].width, 96.0, "originWidth 2.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].height, 160.0, "originHeight 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].width, 96.0, "originWidth 2.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].height, 180.0, "originHeight 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].width, 96.0, "originWidth 2.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].height, 200.0, "originHeight 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].width, 96.0, "originWidth 3.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].height, 220.0, "originHeight 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].width, 96.0, "originWidth 3.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].height, 240.0, "originHeight 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].width, 96.0, "originWidth 3.2");

    } else if (chartTesting == "allPositives") {
        fc.setCase("bar dimensions allPositives");
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].height, 0.0, "originHeight 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].width, 96.0, "originWidth 0.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].height, 0.0, "originHeight 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].width, 96.0, "originWidth 0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].height, 0.0, "originHeight 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].width, 96.0, "originWidth 0.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].height, 80.0, "originHeight 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].width, 96.0, "originWidth 1.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].height, 0.0, "originHeight 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].width, 96.0, "originWidth 1.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].height, 120.0, "originHeight 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].width, 96.0, "originWidth 1.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].height, 140.0, "originHeight 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].width, 96.0, "originWidth 2.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].height, 160.0, "originHeight 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].width, 96.0, "originWidth 2.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].height, 180.0, "originHeight 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].width, 96.0, "originWidth 2.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].height, 200.0, "originHeight 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].width, 96.0, "originWidth 3.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].height, 220.0, "originHeight 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].width, 96.0, "originWidth 3.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].height, 240.0, "originHeight 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].width, 96.0, "originWidth 3.2");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("bar dimensions allNegatives");
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].height, 20.0, "originHeight 0.0");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].width, 96.0, "originWidth 0.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].height, 40.0, "originHeight 0.1");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].width, 96.0, "originWidth 0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].height, 60.0, "originHeight 0.2");
        fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].width, 96.0, "originWidth 0.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].height, 80.0, "originHeight 1.0");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].width, 96.0, "originWidth 1.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].height, 100.0, "originHeight 1.1");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_1"].width, 96.0, "originWidth 1.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].height, 120.0, "originHeight 1.2");
        fc.assert(ch.actionRewardForNameMap["action_1.reward_2"].width, 96.0, "originWidth 1.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].height, 140.0, "originHeight 2.0");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_0"].width, 96.0, "originWidth 2.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].height, 160.0, "originHeight 2.1");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].width, 96.0, "originWidth 2.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].height, 180.0, "originHeight 2.2");
        fc.assert(ch.actionRewardForNameMap["action_2.reward_2"].width, 96.0, "originWidth 2.2");

        //------------------------------------------------------------------------------
        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].height, 200.0, "originHeight 3.0");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_0"].width, 96.0, "originWidth 3.0");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].height, 220.0, "originHeight 3.1");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_1"].width, 96.0, "originWidth 3.1");

        ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"]);
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].height, 240.0, "originHeight 3.2");
        fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].width, 96.0, "originWidth 3.2");

    }

    //fc.setCase("action labels positioning seeSaw");
            //X = (groupWidthMargin*2) + (widthAvailableForGroup / 2) **For picked best action**
            //X = widthAvailableForGroup + (groupWidthMargin*2) + (widthAvailableForGroup / 2) **For all other actions**
        // y == canvasHeight/2 + maxAbsNegativeRewardValue * scalingFactor + 20
    
    //Need to be a ch.positionActionLabelsMsx(minDistanceFromBarOrAxis) minDistance should be 20
    if (chartTesting == "seeSaw") {
        fc.setCase("action labels positioning seeSaw");
        ch.positionMsxActionLabels(20);

        fc.assert(ch.actions[0].actionLabelOriginX, 692.0, "actions_0.X");// 40*2 + 408/2 = 692
        fc.assert(ch.actions[0].actionLabelOriginY, 580.0, "actions_0.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[1].actionLabelOriginX, 692.0, "actions_1.X");// 40*2 + 408/2 = 692
        fc.assert(ch.actions[1].actionLabelOriginY, 580.0, "actions_1.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[2].actionLabelOriginX, 284.0, "actions_2.X");// 40*2 + 408/2 = 284
        fc.assert(ch.actions[2].actionLabelOriginY, 580.0, "actions_2.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[3].actionLabelOriginX, 692.0, "actions_3.X");// 40*2 + 408/2 = 692
        fc.assert(ch.actions[3].actionLabelOriginY, 580.0, "actions_3.Y");//  320 + 120*2 + 20 = 580

    } else if (chartTesting == "allPositives") {
        fc.setCase("action labels positioning allPositives");
        ch.positionMsxActionLabels(20);

        fc.assert(ch.actions[0].actionLabelOriginX, 692.0, "actions_0.X");// 408 + 40*2 + 408/2 = 692
        fc.assert(ch.actions[0].actionLabelOriginY, 340.0, "actions_0.Y");//  320 + 0*2 + 20 = 340

        fc.assert(ch.actions[1].actionLabelOriginX, 692.0, "actions_1.X");// 408 + 40*2 + 408/2 = 692
        fc.assert(ch.actions[1].actionLabelOriginY, 340.0, "actions_1.Y");//  320 + 0*2 + 20 = 340

        fc.assert(ch.actions[2].actionLabelOriginX, 692.0, "actions_2.X");// 408 + 40*2 + 408/2 = 692
        fc.assert(ch.actions[2].actionLabelOriginY, 340.0, "actions_2.Y");//  320 + 0*2 + 20 = 340

        fc.assert(ch.actions[3].actionLabelOriginX, 284.0, "actions_3.X");// 40*2 + 408/2 = 284
        fc.assert(ch.actions[3].actionLabelOriginY, 340.0, "actions_3.Y");//  320 + 0*2 + 20 = 340

    } else if (chartTesting == "allNegatives") {
        fc.setCase("action labels positioning allNegatives");
        ch.positionMsxActionLabels(20);

        fc.assert(ch.actions[0].actionLabelOriginX, 284.0, "actions_0.X");// 40*2 + 408/2 = 284
        fc.assert(ch.actions[0].actionLabelOriginY, 580.0, "actions_0.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[1].actionLabelOriginX, 692.0, "actions_1.X");// 408 + 40*2 + 408/2 = 692
        fc.assert(ch.actions[1].actionLabelOriginY, 580.0, "actions_1.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[2].actionLabelOriginX, 692.0, "actions_2.X");// 408 + 40*2 + 408/2 = 692
        fc.assert(ch.actions[2].actionLabelOriginY, 580.0, "actions_2.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[3].actionLabelOriginX, 692.0, "actions_3.X");// 408 + 4-*2 + 408/2 = 692
        fc.assert(ch.actions[3].actionLabelOriginY, 580.0, "actions_3.Y");//  320 + 120*2 + 20 = 580

    }

    if (chartTesting == "seeSaw") {
        fc.setCase("value markers positioning seeSaw");
        // value  i * maxAbsValue / 4
        // pixel distance 
        // assume scaling factor of 2 pixels per 1 value, so value of 120 is 240 pixels
        ch.positionMsxValueMarkers(4); //give something with maxPosValue and maxNegValue
        fc.assert(ch.positiveMarkerValues[0], 30.0, "line 1 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
        fc.assert(ch.positiveMarkerValues[1], 60.0, "line 2 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
        fc.assert(ch.positiveMarkerValues[2], 90.0, "line 3 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
        fc.assert(ch.positiveMarkerValues[3], 120.0, "line 4 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");

    } else if (chartTesting == "allPositives") {
        fc.setCase("value markers positioning allPositives");

        ch.positionMsxValueMarkers(4);
        fc.assert(ch.positiveMarkerValues[0], 30.0, "line 1 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
        fc.assert(ch.positiveMarkerValues[1], 60.0, "line 2 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
        fc.assert(ch.positiveMarkerValues[2], 90.0, "line 3 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
        fc.assert(ch.positiveMarkerValues[3], 120.0, "line 4 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("value markers positioning allNegatives");

        ch.positionMsxValueMarkers(4);
        fc.assert(ch.positiveMarkerValues[0], 30.0, "line 1 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
        fc.assert(ch.positiveMarkerValues[1], 60.0, "line 2 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
        fc.assert(ch.positiveMarkerValues[2], 90.0, "line 3 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
        fc.assert(ch.positiveMarkerValues[3], 120.0, "line 4 value");
        fc.assert(ch.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");

    }

    if (chartTesting == "seeSaw") {
        fc.setCase("value line positioning seeSaw");
        // x = groupWidthMargin = 20
        //scalingFactor = (canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue();
        // 60 == lineSpacing = maxAbsoluteValue * scaling factor / 4
        // y = (canvasHeight / 2) + (1 + Number(i)) * linSpacing
        ch.positionMsxValueLines(4);
        fc.assert(ch.positiveLineLength, 736.0, "line distance" + ch.positiveLineLength);
        fc.assert(ch.positiveLineOriginX, 40.0, "line originX");
        fc.assert(ch.positiveLineOriginY[0], 380.0, "line 0 positionY"); //320 + 60
        fc.assert(ch.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 120
        fc.assert(ch.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 180
        fc.assert(ch.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 240
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("value line positioning allPositives");
        ch.positionMsxValueLines(4);
        fc.assert(ch.positiveLineLength, 736.0, "line distance" + ch.positiveLineLength);
        fc.assert(ch.positiveLineOriginX, 40.0, "line originX");
        fc.assert(ch.positiveLineOriginY[0], 380.0, "line 0 positionY" + ch.positiveLineOriginY[0]); //320 + 60
        fc.assert(ch.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 120
        fc.assert(ch.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 180
        fc.assert(ch.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 240
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("value line positioning allNegatives");
        ch.positionMsxValueLines(4);
        fc.assert(ch.positiveLineLength, 736.0, "line distance" + ch.positiveLineLength);
        fc.assert(ch.positiveLineOriginX, 40.0, "line originX");
        fc.assert(ch.positiveLineOriginY[0], 380.0, "line 0 positionY"); //320 + 60
        fc.assert(ch.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 120
        fc.assert(ch.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 180
        fc.assert(ch.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 240
    }

    fc.setCase("xAxisLine positioning");
    // xAxisLength = width - 2 * groupWidthMargin
    // xAxisOriginX = groupWidthMargin;
    // xAxisOriginY = height / 2
    ch.positionMsxXAxisLine();
    fc.assert(ch.xAxisOriginX, 40.0, "xAxisOriginX");
    fc.assert(ch.xAxisOriginY, 320.0, "xAxisOriginY");
    fc.assert(ch.xAxisLength, 736.0, "xAxisLength");

    fc.setCase("yAxisLine positioning");
    // yAxisLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
    // yAxisOriginX = groupWidthMargin;
    // yAxisOriginY = (canvasHeight - yAxisLength) / 2
    ch.positionMsxYAxisLine();
    fc.assert(ch.yAxisOriginX, 40.0, "yAxisOriginX");
    fc.assert(ch.yAxisOriginY, 80.0, "yAxisOriginY");
    fc.assert(ch.yAxisLength, 480.0, "yAxisLength");

    fc.setCase("position Action Separators seeSaw");
    ch.positionMsxActionSeparatorLines();
    fc.assert(ch.actionLinesOriginX[0], 408.0, "actionLineOriginX 0");
    fc.assert(ch.actionLinesOriginY, 80.0, "actionLineOriginY");
    fc.assert(ch.actionLinesLength, 480.0, "actionLineLength");

}