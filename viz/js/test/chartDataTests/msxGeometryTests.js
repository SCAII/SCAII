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
    ch = addMsxGeometryFunctions(ch);
    var msxCG = ch.msxChartGeometry;
    msxCG.initChartDimensions(640.0, 816.0, 0.2, 0.0);
    var rewardForName = ch.actionRewardForNameMap;
    if (chartTesting == "seeSaw") {
        //fc.setCase("seeSaw [DETAIL]");
        fc.setCase("msx seeSaw bar positioning");
        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_0"], 0);
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.originX, 448.0, "originX 0.0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.originY, 320.0, "originY 0.0");

        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_1"], 1);
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.originX, 544.0, "originX 0.1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.originY, 320.0, "originY 0.1");

        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_2"], 2);
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.originX, 640.0, "originX 0.2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_0"], 0);
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.originX, 448.0, "originX 1.0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.originY, 320.0, "originY 1.0");

        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_1"], 1);
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.originX, 544.0, "originX 1.1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.originY, 320.0, "originY 1.1");

        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_2"], 2);
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.originX, 640.0, "originX 1.2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_0"], 0);
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.originX, 80.0, "originX 2.0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.originY, 320.0, "originY 2.0");

        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_1"], 1);
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.originX, 176.0, "originX 2.1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.originY, 320.0, "originY 2.1");

        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_2"], 2);
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.originX, 272.0, "originX 2.2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_0"], 0);
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.originX, 448.0, "originX 3.0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.originY, 320.0, "originY 3.0");
        
        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_1"], 1);
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.originX, 544.0, "originX 3.1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.originY, 320.0, "originY 3.1");

        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_2"], 2);
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.originX, 640.0, "originX 3.2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.originY, 320.0, "originY 3.2");

    } else if (chartTesting == "allPositives") {
        fc.setCase("msx allPositives bar positioning");
        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_0"], 0);
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.originX, 448.0, "originX 0.0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.originY, 320.0, "originY 0.0");

        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_1"], 1);
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.originX, 544.0, "originX 0.1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.originY, 320.0, "originY 0.1");

        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_2"], 2);
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.originX, 640.0, "originX 0.2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_0"], 0);
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.originX, 448.0, "originX 1.0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.originY, 320.0, "originY 1.0");

        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_1"], 1);
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.originX, 544.0, "originX 1.1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.originY, 320.0, "originY 1.1");

        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_2"], 2);
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.originX, 640.0, "originX 1.2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_0"], 0);
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.originX, 448.0, "originX 2.0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.originY, 320.0, "originY 2.0");

        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_1"], 1);
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.originX, 544.0, "originX 2.1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.originY, 320.0, "originY 2.1");

        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_2"], 2);
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.originX, 640.0, "originX 2.2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_0"], 0);
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.originX, 80.0, "originX 3.0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.originY, 320.0, "originY 3.0");
        
        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_1"], 1);
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.originX, 176.0, "originX 3.1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.originY, 320.0, "originY 3.1");

        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_2"], 2);
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.originX, 272.0, "originX 3.2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.originY, 320.0, "originY 3.2");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("msx allNegatives bar positioning");
        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_0"], 0);
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.originX, 80.0, "originX 0.0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.originY, 320.0, "originY 0.0");

        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_1"], 1);
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.originX, 176.0, "originX 0.1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.originY, 320.0, "originY 0.1");

        msxCG.positionRewardBar(ch.actions[0].msxMaxValueAction, rewardForName["action_0.reward_2"], 2);
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.originX, 272.0, "originX 0.2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.originY, 320.0, "originY 0.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_0"], 0);
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.originX, 448.0, "originX 1.0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.originY, 320.0, "originY 1.0");

        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_1"], 1);
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.originX, 544.0, "originX 1.1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.originY, 320.0, "originY 1.1");

        msxCG.positionRewardBar(ch.actions[1].msxMaxValueAction, rewardForName["action_1.reward_2"], 2);
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.originX, 640.0, "originX 1.2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.originY, 320.0, "originY 1.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_0"], 0);
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.originX, 448.0, "originX 2.0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.originY, 320.0, "originY 2.0");

        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_1"], 1);
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.originX, 544.0, "originX 2.1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.originY, 320.0, "originY 2.1");

        msxCG.positionRewardBar(ch.actions[2].msxMaxValueAction, rewardForName["action_2.reward_2"], 2);
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.originX, 640.0, "originX 2.2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.originY, 320.0, "originY 2.2");

        //------------------------------------------------------------------------------
        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_0"], 0);
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.originX, 448.0, "originX 3.0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.originY, 320.0, "originY 3.0");
        
        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_1"], 1);
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.originX, 544.0, "originX 3.1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.originY, 320.0, "originY 3.1");

        msxCG.positionRewardBar(ch.actions[3].msxMaxValueAction, rewardForName["action_3.reward_2"], 2);
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.originX, 640.0, "originX 3.2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.originY, 320.0, "originY 3.2");
    }


    //2.55 == this.scalingFactor = ((canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue()).toFixed(2);
    //rewardBar.height = Math.abs(rewardBar.value * this.scalingFactor);
    if (chartTesting == "seeSaw") {
        fc.setCase("bar dimensions seeSaw");
        msxCG.dimensionRewardBar(rewardForName["action_0.reward_0"]);
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.height, 20.0, "originHeight 0.0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.width, 96.0, "originWidth 0.0");

        msxCG.dimensionRewardBar(rewardForName["action_0.reward_1"]);
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.height, 40.0, "originHeight 0.1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.width, 96.0, "originWidth 0");

        msxCG.dimensionRewardBar(rewardForName["action_0.reward_2"]);
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.height, 60.0, "originHeight 0.2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.width, 96.0, "originWidth 0.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_1.reward_0"]);
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.height, 80.0, "originHeight 1.0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.width, 96.0, "originWidth 1.0");

        msxCG.dimensionRewardBar(rewardForName["action_1.reward_1"]);
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.height, 100.0, "originHeight 1.1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.width, 96.0, "originWidth 1.1");

        msxCG.dimensionRewardBar(rewardForName["action_1.reward_2"]);
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.height, 120.0, "originHeight 1.2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.width, 96.0, "originWidth 1.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_2.reward_0"]);
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.height, 140.0, "originHeight 2.0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.width, 96.0, "originWidth 2.0");

        msxCG.dimensionRewardBar(rewardForName["action_2.reward_1"]);
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.height, 160.0, "originHeight 2.1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.width, 96.0, "originWidth 2.1");

        msxCG.dimensionRewardBar(rewardForName["action_2.reward_2"]);
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.height, 180.0, "originHeight 2.2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.width, 96.0, "originWidth 2.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_3.reward_0"]);
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.height, 200.0, "originHeight 3.0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.width, 96.0, "originWidth 3.0");

        msxCG.dimensionRewardBar(rewardForName["action_3.reward_1"]);
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.height, 220.0, "originHeight 3.1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.width, 96.0, "originWidth 3.1");

        msxCG.dimensionRewardBar(rewardForName["action_3.reward_2"]);
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.height, 240.0, "originHeight 3.2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.width, 96.0, "originWidth 3.2");

    } else if (chartTesting == "allPositives") {
        fc.setCase("bar dimensions allPositives");
        msxCG.dimensionRewardBar(rewardForName["action_0.reward_0"]);
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.height, 0.0, "originHeight 0.0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.width, 96.0, "originWidth 0.0");

        msxCG.dimensionRewardBar(rewardForName["action_0.reward_1"]);
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.height, 0.0, "originHeight 0.1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.width, 96.0, "originWidth 0");

        msxCG.dimensionRewardBar(rewardForName["action_0.reward_2"]);
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.height, 0.0, "originHeight 0.2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.width, 96.0, "originWidth 0.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_1.reward_0"]);
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.height, 80.0, "originHeight 1.0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.width, 96.0, "originWidth 1.0");

        msxCG.dimensionRewardBar(rewardForName["action_1.reward_1"]);
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.height, 0.0, "originHeight 1.1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.width, 96.0, "originWidth 1.1");

        msxCG.dimensionRewardBar(rewardForName["action_1.reward_2"]);
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.height, 120.0, "originHeight 1.2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.width, 96.0, "originWidth 1.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_2.reward_0"]);
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.height, 140.0, "originHeight 2.0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.width, 96.0, "originWidth 2.0");

        msxCG.dimensionRewardBar(rewardForName["action_2.reward_1"]);
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.height, 160.0, "originHeight 2.1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.width, 96.0, "originWidth 2.1");

        msxCG.dimensionRewardBar(rewardForName["action_2.reward_2"]);
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.height, 180.0, "originHeight 2.2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.width, 96.0, "originWidth 2.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_3.reward_0"]);
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.height, 200.0, "originHeight 3.0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.width, 96.0, "originWidth 3.0");

        msxCG.dimensionRewardBar(rewardForName["action_3.reward_1"]);
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.height, 220.0, "originHeight 3.1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.width, 96.0, "originWidth 3.1");

        msxCG.dimensionRewardBar(rewardForName["action_3.reward_2"]);
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.height, 240.0, "originHeight 3.2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.width, 96.0, "originWidth 3.2");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("bar dimensions allNegatives");
        msxCG.dimensionRewardBar(rewardForName["action_0.reward_0"]);
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.height, 20.0, "originHeight 0.0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.width, 96.0, "originWidth 0.0");

        msxCG.dimensionRewardBar(rewardForName["action_0.reward_1"]);
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.height, 40.0, "originHeight 0.1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.width, 96.0, "originWidth 0");

        msxCG.dimensionRewardBar(rewardForName["action_0.reward_2"]);
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.height, 60.0, "originHeight 0.2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.width, 96.0, "originWidth 0.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_1.reward_0"]);
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.height, 80.0, "originHeight 1.0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.width, 96.0, "originWidth 1.0");

        msxCG.dimensionRewardBar(rewardForName["action_1.reward_1"]);
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.height, 100.0, "originHeight 1.1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.width, 96.0, "originWidth 1.1");

        msxCG.dimensionRewardBar(rewardForName["action_1.reward_2"]);
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.height, 120.0, "originHeight 1.2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.width, 96.0, "originWidth 1.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_2.reward_0"]);
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.height, 140.0, "originHeight 2.0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.width, 96.0, "originWidth 2.0");

        msxCG.dimensionRewardBar(rewardForName["action_2.reward_1"]);
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.height, 160.0, "originHeight 2.1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.width, 96.0, "originWidth 2.1");

        msxCG.dimensionRewardBar(rewardForName["action_2.reward_2"]);
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.height, 180.0, "originHeight 2.2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.width, 96.0, "originWidth 2.2");

        //------------------------------------------------------------------------------
        msxCG.dimensionRewardBar(rewardForName["action_3.reward_0"]);
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.height, 200.0, "originHeight 3.0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.width, 96.0, "originWidth 3.0");

        msxCG.dimensionRewardBar(rewardForName["action_3.reward_1"]);
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.height, 220.0, "originHeight 3.1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.width, 96.0, "originWidth 3.1");

        msxCG.dimensionRewardBar(rewardForName["action_3.reward_2"]);
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.height, 240.0, "originHeight 3.2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.width, 96.0, "originWidth 3.2");

    }

    //fc.setCase("action labels positioning seeSaw");
            //X = (groupWidthMargin*2) + (widthAvailableForRewardBars / 2) **For picked best action**
            //X = widthAvailableForGroup + groupWidthMargin + (widthAvailableForRewardBars / 2) **For all other actions**
        // y == canvasHeight/2 + maxAbsNegativeRewardValue * scalingFactor + 20
    
    //Need to be a msxCG.positionActionLabels(minDistanceFromBarOrAxis) minDistance should be 20
    if (chartTesting == "seeSaw") {
        fc.setCase("action labels positioning seeSaw");
        msxCG.positionActionLabels(20);
                                                                                        // fudgeFactor == -35
        fc.assert(ch.actions[0].msxChartGeometry.actionLabelOriginX, 557.0, "actions_0.X");// 408 + 40 + 288/2 = 592 - 35
        fc.assert(ch.actions[0].msxChartGeometry.actionLabelOriginY, 580.0, "actions_0.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[1].msxChartGeometry.actionLabelOriginX, 557.0, "actions_1.X");// 408 + 40 + 288/2 = 592 - 35
        fc.assert(ch.actions[1].msxChartGeometry.actionLabelOriginY, 580.0, "actions_1.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[2].msxChartGeometry.actionLabelOriginX, 189.0, "actions_2.X");//       40*2 + 288/2 = 224 - 35
        fc.assert(ch.actions[2].msxChartGeometry.actionLabelOriginY, 580.0, "actions_2.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[3].msxChartGeometry.actionLabelOriginX, 557.0, "actions_3.X");// 408 + 40 + 288/2 = 592 - 35
        fc.assert(ch.actions[3].msxChartGeometry.actionLabelOriginY, 580.0, "actions_3.Y");//  320 + 120*2 + 20 = 580

    } else if (chartTesting == "allPositives") {
        fc.setCase("action labels positioning allPositives");
        msxCG.positionActionLabels(20);

        fc.assert(ch.actions[0].msxChartGeometry.actionLabelOriginX, 557.0, "actions_0.X");// 408 + 40 + 288/2 =  - 35
        fc.assert(ch.actions[0].msxChartGeometry.actionLabelOriginY, 340.0, "actions_0.Y");//  320 + 0*2 + 20 = 340

        fc.assert(ch.actions[1].msxChartGeometry.actionLabelOriginX, 557.0, "actions_1.X");// 408 + 40 + 288/2 =  - 35
        fc.assert(ch.actions[1].msxChartGeometry.actionLabelOriginY, 340.0, "actions_1.Y");//  320 + 0*2 + 20 = 340

        fc.assert(ch.actions[2].msxChartGeometry.actionLabelOriginX, 557.0, "actions_2.X");// 408 + 40 + 288/2 =  - 35
        fc.assert(ch.actions[2].msxChartGeometry.actionLabelOriginY, 340.0, "actions_2.Y");//  320 + 0*2 + 20 = 340

        fc.assert(ch.actions[3].msxChartGeometry.actionLabelOriginX, 189.0, "actions_3.X");// 40*2 + 288/2 =  - 35
        fc.assert(ch.actions[3].msxChartGeometry.actionLabelOriginY, 340.0, "actions_3.Y");//  320 + 0*2 + 20 = 340

    } else if (chartTesting == "allNegatives") {
        fc.setCase("action labels positioning allNegatives");
        msxCG.positionActionLabels(20);

        fc.assert(ch.actions[0].msxChartGeometry.actionLabelOriginX, 189.0, "actions_0.X");// 40*2 + 288/2 =  - 35
        fc.assert(ch.actions[0].msxChartGeometry.actionLabelOriginY, 580.0, "actions_0.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[1].msxChartGeometry.actionLabelOriginX, 557.0, "actions_1.X");// 408 + 40 + 288/2 =  - 35
        fc.assert(ch.actions[1].msxChartGeometry.actionLabelOriginY, 580.0, "actions_1.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[2].msxChartGeometry.actionLabelOriginX, 557.0, "actions_2.X");// 408 + 40 + 288/2 =  - 35
        fc.assert(ch.actions[2].msxChartGeometry.actionLabelOriginY, 580.0, "actions_2.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[3].msxChartGeometry.actionLabelOriginX, 557.0, "actions_3.X");// 408 + 40 + 288/2 =  - 35
        fc.assert(ch.actions[3].msxChartGeometry.actionLabelOriginY, 580.0, "actions_3.Y");//  320 + 120*2 + 20 = 580

    }

    if (chartTesting == "seeSaw") {
        fc.setCase("value markers positioning seeSaw");
        // value  i * maxAbsValue / 4
        // pixel distance 
        // assume scaling factor of 2 pixels per 1 value, so value of 120 is 240 pixels
        msxCG.positionValueMarkers(4); //give something with maxPosValue and maxNegValue
        fc.assert(msxCG.positiveMarkerValues[0], 30.0, "line 1 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[1], 60.0, "line 2 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[2], 90.0, "line 3 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[3], 120.0, "line 4 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");

    } else if (chartTesting == "allPositives") {
        fc.setCase("value markers positioning allPositives");

        msxCG.positionValueMarkers(4);
        fc.assert(msxCG.positiveMarkerValues[0], 30.0, "line 1 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[1], 60.0, "line 2 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[2], 90.0, "line 3 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[3], 120.0, "line 4 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("value markers positioning allNegatives");

        msxCG.positionValueMarkers(4);
        fc.assert(msxCG.positiveMarkerValues[0], 30.0, "line 1 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[1], 60.0, "line 2 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[2], 90.0, "line 3 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
        fc.assert(msxCG.positiveMarkerValues[3], 120.0, "line 4 value");
        fc.assert(msxCG.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");

    }

    if (chartTesting == "seeSaw") {
        fc.setCase("value line positioning seeSaw");
        // x = groupWidthMargin = 20
        //scalingFactor = (canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue();
        // 60 == lineSpacing = maxAbsoluteValue * scaling factor / 4
        // y = (canvasHeight / 2) + (1 + Number(i)) * linSpacing
        msxCG.positionValueLines(4);
        fc.assert(msxCG.positiveLineLength, 736.0, "line distance" + msxCG.positiveLineLength);
        fc.assert(msxCG.positiveLineOriginX, 40.0, "line originX");
        fc.assert(msxCG.positiveLineOriginY[0], 380.0, "line 0 positionY"); //320 + 60
        fc.assert(msxCG.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 120
        fc.assert(msxCG.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 180
        fc.assert(msxCG.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 240
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("value line positioning allPositives");
        msxCG.positionValueLines(4);
        fc.assert(msxCG.positiveLineLength, 736.0, "line distance" + msxCG.positiveLineLength);
        fc.assert(msxCG.positiveLineOriginX, 40.0, "line originX");
        fc.assert(msxCG.positiveLineOriginY[0], 380.0, "line 0 positionY" + msxCG.positiveLineOriginY[0]); //320 + 60
        fc.assert(msxCG.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 120
        fc.assert(msxCG.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 180
        fc.assert(msxCG.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 240
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("value line positioning allNegatives");
        msxCG.positionValueLines(4);
        fc.assert(msxCG.positiveLineLength, 736.0, "line distance" + msxCG.positiveLineLength);
        fc.assert(msxCG.positiveLineOriginX, 40.0, "line originX");
        fc.assert(msxCG.positiveLineOriginY[0], 380.0, "line 0 positionY"); //320 + 60
        fc.assert(msxCG.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 120
        fc.assert(msxCG.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 180
        fc.assert(msxCG.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 240
    }

    fc.setCase("xAxisLine positioning");
    // xAxisLength = width - 2 * groupWidthMargin
    // xAxisOriginX = groupWidthMargin;
    // xAxisOriginY = height / 2
    msxCG.positionXAxisLine();
    fc.assert(msxCG.xAxisOriginX, 40.0, "xAxisOriginX");
    fc.assert(msxCG.xAxisOriginY, 320.0, "xAxisOriginY");
    fc.assert(msxCG.xAxisLength, 736.0, "xAxisLength");

    fc.setCase("yAxisLine positioning");
    // yAxisLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
    // yAxisOriginX = groupWidthMargin;
    // yAxisOriginY = (canvasHeight - yAxisLength) / 2
    msxCG.positionYAxisLine();
    fc.assert(msxCG.yAxisOriginX, 40.0, "yAxisOriginX");
    fc.assert(msxCG.yAxisOriginY, 80.0, "yAxisOriginY");
    fc.assert(msxCG.yAxisLength, 480.0, "yAxisLength");

    fc.setCase("position Action Separators seeSaw");
    msxCG.positionActionSeparatorLines();
    fc.assert(msxCG.actionLinesOriginX[0], 408.0, "actionLineOriginX 0");
    fc.assert(msxCG.actionLinesOriginY, 80.0, "actionLineOriginY");
    fc.assert(msxCG.actionLinesLength, 480.0, "actionLineLength");

    // tooltip placement 
    /*
    if (importantBar)
        tooltips will assume sit at top of chart (where Y-axis line starts) and stretch length of the distance
        between the two rewardBars plus a little bit more.
        There will be two arrows pointing downward towards the bar these also need to be positioned but difficult
        since can't see them.
            The bar for the arrow will be at Xpos of the Bar. Ypos will be slightly below where Y-axis line starts
            Length will be based on reward bar.
                if (rewardBar.value < 0)
                    Length will be to the X-axis line
                else
                    Length will be to the (x-axis line - rewardBar.value * scale factor - (extra bit so values can still display))
            Arrows will follow their Xpos based off the length of the bar for the arrow
            Hard to judge this one since not solid on how arrows work in DOM
    else
        Tooltips will assume sit at 3/4 the height of bar
        tooltipHeight = 50;
        tooltipWidth = 75;
        ch.toolTip.originX = rewardForName["action_i.reward_j"].basicChartGeometry.originX + rewardBarWidth
        ch.toolTip.originY = (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scallingFactor) * 0.75)
    */
    if (chartTesting == "seeSaw") {
        fc.setCase("tooltips positioning seeSaw");
        msxCG.positionTooltips();
        //MATH for originX is semi-same for all but picked action
        // 408 + 40 + (reward# * 96)

        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.tooltipOriginX, 70.0, "tooltip X action_0.reward_0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_0.reward_0");// (640 - (120 * 2 * 2)) / 2
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_0.reward_1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.tooltipOriginY, 350.0, "tooltip Y action_0.reward_1");// 320 - (-20) * 2 * 0.75
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.tooltipOriginX, 262.0, "tooltip X action_0.reward_2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_0.reward_2");// (640 - (120 * 2 * 2)) / 2

        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.tooltipOriginX, 544.0, "tooltip X action_1.reward_0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.tooltipOriginY, 380.0, "tooltip Y action_1.reward_0");// 320 - (-40) * 2 * 0.75
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_1.reward_1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.tooltipOriginY, 245.0, "tooltip Y action_1.reward_1");// 320 - 50 * 2 * 0.75
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.tooltipOriginX, 262.0, "tooltip X action_1.reward_2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_1.reward_2");// (640 - (120 * 2 * 2)) / 2

        // fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.tooltipOriginX, 536.0, "tooltip X action_2.reward_1");
        // fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.tooltipOriginY, 440.0, "tooltip Y action_2.reward_1"); //  70
        // fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.tooltipOriginX, 536.0, "tooltip X action_2.reward_1");
        // fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.tooltipOriginY, 440.0, "tooltip Y action_2.reward_1"); // -80
        // fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.tooltipOriginX, 536.0, "tooltip X action_2.reward_1");
        // fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.tooltipOriginY, 440.0, "tooltip Y action_2.reward_1"); //  90

        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.tooltipOriginX, 544.0, "tooltip X action_3.reward_0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.tooltipOriginY, 470.0, "tooltip Y action_3.reward_0");// 320 - (-100) * 2 * 0.75
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_3.reward_1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.tooltipOriginY, 155.0, "tooltip Y action_3.reward_1");// 320 - 110 * 2 * 0.75
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.tooltipOriginX, 262.0, "tooltip X action_3.reward_2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_3.reward_2");// (640 - (120 * 2 * 2)) / 2

    } else if (chartTesting == "allPositives") {
        fc.setCase("tooltips positioning allPositives");
        msxCG.positionTooltips();
        //MATH for originX is semi-same for all but picked action
        // 408 + 40 + (reward# * 96)

        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.tooltipOriginX, 544.0, "tooltip X action_0.reward_0");
        fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.tooltipOriginY, 320.0, "tooltip Y action_0.reward_0");// 320 - 0 * 2 * 0.75
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_0.reward_1");
        fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.tooltipOriginY, 320.0, "tooltip Y action_0.reward_1");// 320 - 0 * 2 * 0.75
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.tooltipOriginX, 262.0, "tooltip X action_0.reward_2");
        fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_0.reward_2");// (640 - (120 * 2 * 2)) / 2

        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.tooltipOriginX, 544.0, "tooltip X action_1.reward_0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.tooltipOriginY, 260.0, "tooltip Y action_1.reward_0");// 320 - 40 * 2 * 0.75
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.tooltipOriginX, 166.0, "tooltip X action_1.reward_1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_1.reward_1");// (640 - (120 * 2 * 2)) / 2
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.tooltipOriginX, 736.0, "tooltip X action_1.reward_2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.tooltipOriginY, 230.0, "tooltip Y action_1.reward_2");// 320 - 60 * 2 * 0.75

        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.tooltipOriginX, 70.0, "tooltip X action_2.reward_0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_2.reward_0");// (640 - (120 * 2 * 2)) / 2
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_2.reward_1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.tooltipOriginY, 200.0, "tooltip Y action_2.reward_1");// 320 - 80 * 2 * 0.75
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.tooltipOriginX, 736.0, "tooltip X action_2.reward_2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.tooltipOriginY, 185.0, "tooltip Y action_2.reward_2");// 320 - 90 * 2 * 0.75

        // fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.tooltipOriginX, 794.0, "tooltip X action_3.reward_2");
        // fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.tooltipOriginY, 500.0, "tooltip Y action_3.reward_2"); // 100
        // fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.tooltipOriginX, 794.0, "tooltip X action_3.reward_2");
        // fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.tooltipOriginY, 500.0, "tooltip Y action_3.reward_2"); // 110
        // fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.tooltipOriginX, 794.0, "tooltip X action_3.reward_2");
        // fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.tooltipOriginY, 500.0, "tooltip Y action_3.reward_2"); // 120

    } else if (chartTesting == "allNegatives") {
        fc.setCase("tooltips positioning allNegatives");
        msxCG.positionTooltips();
        //MATH for originX is semi-same for all but picked action
        // 408 + 40 + (reward# * 96)

        // fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.tooltipOriginX, 74.0, "tooltip X action_0.reward_0");
        // fc.assert(rewardForName["action_0.reward_0"].msxChartGeometry.tooltipOriginY, 305.0, "tooltip Y action_0.reward_0"); // -10
        // fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.tooltipOriginX, 128.0, "tooltip X action_0.reward_1");
        // fc.assert(rewardForName["action_0.reward_1"].msxChartGeometry.tooltipOriginY, 350.0, "tooltip Y action_0.reward_1"); // -20
        // fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.tooltipOriginX, 182.0, "tooltip X action_0.reward_2");
        // fc.assert(rewardForName["action_0.reward_2"].msxChartGeometry.tooltipOriginY, 275.0, "tooltip Y action_0.reward_2"); // -30

        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.tooltipOriginX, 70.0, "tooltip X action_1.reward_0");
        fc.assert(rewardForName["action_1.reward_0"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_1.reward_0");// (640 - (120 * 2 * 2)) / 2
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_1.reward_1");
        fc.assert(rewardForName["action_1.reward_1"].msxChartGeometry.tooltipOriginY, 395.0, "tooltip Y action_1.reward_1");// 320 - -50 * 2 * 0.75
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.tooltipOriginX, 736.0, "tooltip X action_1.reward_2");
        fc.assert(rewardForName["action_1.reward_2"].msxChartGeometry.tooltipOriginY, 410.0, "tooltip Y action_1.reward_2");// 320 - -60 * 2 * 0.75

        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.tooltipOriginX, 70.0, "tooltip X action_2.reward_0");
        fc.assert(rewardForName["action_2.reward_0"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_2.reward_0");// (640 - (120 * 2 * 2)) / 2
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_2.reward_1");
        fc.assert(rewardForName["action_2.reward_1"].msxChartGeometry.tooltipOriginY, 440.0, "tooltip Y action_2.reward_1");// 320 - -80 * 2 * 0.75
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.tooltipOriginX, 736.0, "tooltip X action_2.reward_2");
        fc.assert(rewardForName["action_2.reward_2"].msxChartGeometry.tooltipOriginY, 455.0, "tooltip Y action_2.reward_2");// 320 - -90 * 2 * 0.75

        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.tooltipOriginX, 70.0, "tooltip X action_3.reward_0");
        fc.assert(rewardForName["action_3.reward_0"].msxChartGeometry.tooltipOriginY, 80.0, "tooltip Y action_3.reward_0");// (640 - (120 * 2 * 2)) / 2
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.tooltipOriginX, 640.0, "tooltip X action_3.reward_1");
        fc.assert(rewardForName["action_3.reward_1"].msxChartGeometry.tooltipOriginY, 485.0, "tooltip Y action_3.reward_1");// 320 - -110 * 2 * 0.75
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.tooltipOriginX, 736.0, "tooltip X action_3.reward_2");
        fc.assert(rewardForName["action_3.reward_2"].msxChartGeometry.tooltipOriginY, 500.0, "tooltip Y action_3.reward_2");// 320 - -120 * 2 * 0.75

    }
    // NEED TO DO
    // (tooltip values position same)
}