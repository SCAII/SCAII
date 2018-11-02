function runBasicChartGeometryTests(failureChecker, chartTesting) {
    // test geometry
    var fc = failureChecker;
    if (chartTesting == "seeSaw") {
        fc.setTestName("chart data geometry test - seesaw");
        var ch = getSeeSawChart();
    } else if (chartTesting == "allPositives") {
        fc.setTestName("chart data geometry test - all Pos");
        var ch = getAllPositivesChart();
    } else {
        fc.setTestName("chart data geometry test - all Neg");
        var ch = getAllNegativesChart();
    }
    ch = addUtilityFunctions(ch);
    

    
    // action names are action_0, action_1...action_3
    // rewardnames are action action_0.reward_0, action_0.reward_1

    /*

    Evan will add scaling factor of 2 (so each value will take up 2 pixels)
    Evan NOTE / possible issue: biggest bar could be the total bar

        640 == canvasHeight
        816 == canvasWidth
        204 widthAvailableForGroup == canvasWidth / actionCount 
        x axis of chart sits at y == canvasHeight/2
        biggest bar should take up .75 of canvasHeight/2  (120 * scalingFactor == 3/4 * canvasHeight/2) (we assumed scalingFactor == 2)
        
        20.0 == groupWidthMargin = Math.floor((widthAvailableForGroup * groupWidthMarginFactor) / 2)
        0.2 == groupWidthMarginFactor

        164 == widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        54 == widthAvailableForRewardBar = widthAvailableForRewardBars / rewardBarCount   (assume rewardBarCount == 3)

        54 == rewardBarWidth = widthAvailableForRewardBar - 2 * rewardSpacerWidth (assume rewardSpacerWidth == 0)
        0 == rewardSpacerWidth // assume no space for now

        bar.originX = Math.floor(i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth))
        bar.originY = canvasHeight/2 ==> constant 320.0
        coords depend on sign of reward

        dummy bar values look like this:

            1       2       3       4
        1   10      -20     30      -40
        2   -20     40      -60     80
        3   30      -60     90      -120
    */
    ch = addBasicChartGeometryFunctions(ch);
    var bcg = ch.basicChartGeometry;
    var rewardForName = ch.actionRewardForNameMap;
    bcg.initChartDimensions(640.0, 816.0, 0.2, 0.0);

    fc.setCase("bar postioning");
    bcg.positionRewardBar(rewardForName["action_0.reward_0"], 0, 0);
    fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.originX, 20.0, "originX 0.0");// 20.0 + 0*1 + 0
    fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.originY, 320.0, "originY 0.0");// 160 

    // bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth)
    bcg.positionRewardBar(rewardForName["action_0.reward_1"], 0, 1);
    fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.originX, 74.0, "originX 0.1");//  20.0 + 0 * (2) + 54 == 74.0
    fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.originY, 320.0, "originY 0.1");// 320 

    bcg.positionRewardBar(rewardForName["action_0.reward_2"], 0, 2);
    fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.originX, 128.0, "originX 0.2");//  20.0 + 0 * (3) + 108 == 128.0
    fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.originY, 320.0, "originY 0.2");// 320 

    bcg.positionRewardBar(rewardForName["action_1.reward_0"], 1, 0);
    fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.originX, 224.0, "originX 1.0");// 204 + 20.0 + 0 * (1) + 0 == 224.0
    fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.originY, 320.0, "originY 1.0");// 320

    bcg.positionRewardBar(rewardForName["action_1.reward_1"], 1, 1);//skip test here but need later
    bcg.positionRewardBar(rewardForName["action_1.reward_2"], 1, 2);//skip test here but need later

    bcg.positionRewardBar(rewardForName["action_2.reward_0"], 2, 0);//skip test here but need later
    bcg.positionRewardBar(rewardForName["action_2.reward_1"], 2, 1);
    fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.originX, 482.0, "originX 2.1");// 408 + 20.0 + 0 * (2) + 54 == 482.0
    fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.originY, 320.0, "originY 2.1");// 320
    bcg.positionRewardBar(rewardForName["action_2.reward_2"], 2, 2);//skip test here but need later

    bcg.positionRewardBar(rewardForName["action_3.reward_0"], 3, 0);//skip test here but need later
    bcg.positionRewardBar(rewardForName["action_3.reward_1"], 3, 1);//skip test here but need later
    bcg.positionRewardBar(rewardForName["action_3.reward_2"], 3, 2);
    fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.originX, 740.0, "originX 3.2");// 612 + 20.0 + 0 * (3) + 108 == 740.0
    fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.originY, 320.0, "originY 3.2");// 320 


    if (chartTesting == "seeSaw") {
        fc.setCase("bar dimensioning seeSaw");
        bcg.dimensionRewardBar(rewardForName["action_0.reward_0"]);
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.height, 20.0, "originHeight 0.0");
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.width, 54.0, "originWidth 0.0");

        bcg.dimensionRewardBar(rewardForName["action_0.reward_1"]);
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.height, 40.0, "originHeight 0.1");
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.width, 54.0, "originWidth 0");

        bcg.dimensionRewardBar(rewardForName["action_0.reward_2"]);
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.height, 60.0, "originHeight 0.2");
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.width, 54.0, "originWidth 0.2");

        bcg.dimensionRewardBar(rewardForName["action_1.reward_0"]);
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.height, 80.0, "originHeight 1.0");
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.width, 54.0, "originWidth 1.0");
        bcg.dimensionRewardBar(rewardForName["action_1.reward_1"]);
        bcg.dimensionRewardBar(rewardForName["action_1.reward_2"]);

        bcg.dimensionRewardBar(rewardForName["action_2.reward_0"]);
        bcg.dimensionRewardBar(rewardForName["action_2.reward_1"]);
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.height, 160.0, "originHeight 2.1");
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.width, 54.0, "originWidth 2.1");
        bcg.dimensionRewardBar(rewardForName["action_2.reward_2"]);

        bcg.dimensionRewardBar(rewardForName["action_3.reward_0"]);
        bcg.dimensionRewardBar(rewardForName["action_3.reward_1"]);
        bcg.dimensionRewardBar(rewardForName["action_3.reward_2"]);
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.height, 240.0, "originHeight 3.2");
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.width, 54.0, "originWidth 3.2");
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("bar dimensioning allPositives");
        bcg.dimensionRewardBar(rewardForName["action_0.reward_0"]);
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.height, 0.0, "originHeight 0.0");
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.width, 54.0, "originWidth 0.0");

        bcg.dimensionRewardBar(rewardForName["action_0.reward_1"]);
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.height, 0.0, "originHeight 0.1");
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.width, 54.0, "originWidth 0");

        bcg.dimensionRewardBar(rewardForName["action_0.reward_2"]);
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.height, 0.0, "originHeight 0.2");
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.width, 54.0, "originWidth 0.2");

        bcg.dimensionRewardBar(rewardForName["action_1.reward_0"]);
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.height, 29.2, "originHeight 1.0");
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.width, 54.0, "originWidth 1.0");
        bcg.dimensionRewardBar(rewardForName["action_1.reward_1"]);
        bcg.dimensionRewardBar(rewardForName["action_1.reward_2"]);

        bcg.dimensionRewardBar(rewardForName["action_2.reward_0"]);
        bcg.dimensionRewardBar(rewardForName["action_2.reward_1"]);
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.height, 58.4, "originHeight 2.1");
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.width, 54.0, "originWidth 2.1");
        bcg.dimensionRewardBar(rewardForName["action_2.reward_2"]);

        bcg.dimensionRewardBar(rewardForName["action_3.reward_0"]);
        bcg.dimensionRewardBar(rewardForName["action_3.reward_1"]);
        bcg.dimensionRewardBar(rewardForName["action_3.reward_2"]);
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.height, 87.6, "originHeight 3.2");
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.width, 54.0, "originWidth 3.2");

    } else if (chartTesting == "allNegatives") {
        fc.setCase("bar dimensioning allNegatives");
        bcg.dimensionRewardBar(rewardForName["action_0.reward_0"]);
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.height, 7.3, "originHeight 0.0");
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.width, 54.0, "originWidth 0.0");

        bcg.dimensionRewardBar(rewardForName["action_0.reward_1"]);
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.height, 14.6, "originHeight 0.1");
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.width, 54.0, "originWidth 0");

        bcg.dimensionRewardBar(rewardForName["action_0.reward_2"]);
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.height, 21.9, "originHeight 0.2");
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.width, 54.0, "originWidth 0.2");

        bcg.dimensionRewardBar(rewardForName["action_1.reward_0"]);
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.height, 29.2, "originHeight 1.0");
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.width, 54.0, "originWidth 1.0");
        bcg.dimensionRewardBar(rewardForName["action_1.reward_1"]);
        bcg.dimensionRewardBar(rewardForName["action_1.reward_2"]);

        bcg.dimensionRewardBar(rewardForName["action_2.reward_0"]);
        bcg.dimensionRewardBar(rewardForName["action_2.reward_1"]);
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.height, 58.4, "originHeight 2.1");
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.width, 54.0, "originWidth 2.1");
        bcg.dimensionRewardBar(rewardForName["action_2.reward_2"]);

        bcg.dimensionRewardBar(rewardForName["action_3.reward_0"]);
        bcg.dimensionRewardBar(rewardForName["action_3.reward_1"]);
        bcg.dimensionRewardBar(rewardForName["action_3.reward_2"]);
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.height, 87.6, "originHeight 3.2");
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.width, 54.0, "originWidth 3.2");
    }

    //NEED TO ADD TEST TO POSITION TOTAL ACTION BAR
    /*
    
        204 widthAvailableForGroup == canvasWidth / actionCount 
        20 == groupWidthMargin = (widthAvailableForGroup * .2) / 2
    */
    // x coord == groupWidthmargin + i * (widthAvailableForGroup)
    // y coord == the axis location == canvas_height / 2
    fc.setCase("action bar positioning");
    bcg.positionActionBar(ch.actionForNameMap["action_0"], 0);
    fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.originX, 20.0, "originX action_0");// 20  + 0
    fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.originY, 320.0, "originY action_0");// 320 

    bcg.positionActionBar(ch.actionForNameMap["action_1"], 1);
    fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.originX, 224.0, "originX action_1");// 20  + 204
    fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.originY, 320.0, "originY action_1");// 320 

    bcg.positionActionBar(ch.actionForNameMap["action_2"], 2);
    fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.originX, 428.0, "originX action_2");// 20 + 408
    fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.originY, 320.0, "originY action_2");// 320 

    bcg.positionActionBar(ch.actionForNameMap["action_3"], 3);
    fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.originX, 632.0, "originX action_3");// 20  + 612
    fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.originY, 320.0, "originY action_3");// 320 
    //
    //
    if (chartTesting == "seeSaw") {
        fc.setCase("action bar dimensioning seeSaw");
        // DIMENSION TOTAL ACTION BAR
        // width == widthAvailableForRewardBars== 192
        // height == sum of the bars
        bcg.dimensionActionBar(ch.actionForNameMap["action_0"]);
        fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.height, 40.0, "originHeight action_0");  // Abs((10  -20 + 30) * scallingFactor of 2)
        fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.width, 164.0, "originWidth action_0");

        bcg.dimensionActionBar(ch.actionForNameMap["action_1"]);
        fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.height, 100.0, "originHeight action_1"); //  Abs((-40 + 50 - 60) * scallingFacotr of 2)
        fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.width, 164.0, "originWidth action_1");

        bcg.dimensionActionBar(ch.actionForNameMap["action_2"]);
        fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.height, 160.0, "originHeight action_2"); // Abs((70 - 80 + 90) * scallingFacotr of 2)
        fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.width, 164.0, "originWidth action_2");

        bcg.dimensionActionBar(ch.actionForNameMap["action_3"]);
        fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.height, 220.0, "originHeight action_3");  // Abs((-100 + 110 - 120) * scallingFactor of 2)
        fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.width, 164.0, "originWidth action_3");
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("action bar dimensioning allPositives");
        // DIMENSION TOTAL ACTION BAR
        // width == widthAvailableForRewardBars== 192
        // height == sum of the bars
        bcg.dimensionActionBar(ch.actionForNameMap["action_0"]);
        fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.height, 0.0, "originHeight action_0");  // Abs((10  -20 + 30) * scallingFactor of 2)
        fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.width, 164.0, "originWidth action_0");

        bcg.dimensionActionBar(ch.actionForNameMap["action_1"]);
        fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.height, 73.0, "originHeight action_1"); //  Abs((-40 + 50 - 60) * scallingFacotr of 2)
        fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.width, 164.0, "originWidth action_1");

        bcg.dimensionActionBar(ch.actionForNameMap["action_2"]);
        fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.height, 175.2, "originHeight action_2"); // Abs((70 - 80 + 90) * scallingFacotr of 2)
        fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.width, 164.0, "originWidth action_2");

        bcg.dimensionActionBar(ch.actionForNameMap["action_3"]);
        fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.height, 240.9, "originHeight action_3");  // Abs((-100 + 110 - 120) * scallingFactor of 2)
        fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.width, 164.0, "originWidth action_3");
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("action bar dimensioning allNegatives");
        // DIMENSION TOTAL ACTION BAR
        // width == widthAvailableForRewardBars== 192
        // height == sum of the bars
        bcg.dimensionActionBar(ch.actionForNameMap["action_0"]);
        fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.height, 43.8, "originHeight action_0");  // Abs((10  -20 + 30) * scallingFactor of 2)
        fc.assert(ch.actionForNameMap["action_0"].basicChartGeometry.width, 164.0, "originWidth action_0");

        bcg.dimensionActionBar(ch.actionForNameMap["action_1"]);
        fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.height, 109.5, "originHeight action_1"); //  Abs((-40 + 50 - 60) * scallingFacotr of 2)
        fc.assert(ch.actionForNameMap["action_1"].basicChartGeometry.width, 164.0, "originWidth action_1");

        bcg.dimensionActionBar(ch.actionForNameMap["action_2"]);
        fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.height, 175.2, "originHeight action_2"); // Abs((70 - 80 + 90) * scallingFacotr of 2)
        fc.assert(ch.actionForNameMap["action_2"].basicChartGeometry.width, 164.0, "originWidth action_2");

        bcg.dimensionActionBar(ch.actionForNameMap["action_3"]);
        fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.height, 240.9, "originHeight action_3");  // Abs((-100 + 110 - 120) * scallingFactor of 2)
        fc.assert(ch.actionForNameMap["action_3"].basicChartGeometry.width, 164.0, "originWidth action_3");
    }
    else {
        fc.assert(chartTesting, "none", "chartTesting has wrong variable name or no chart!");
    }



    if (chartTesting == "seeSaw") {
        fc.setCase("action labels positioning seeSaw");
        // x == groupWidthMargin + i * widthAvailableForGroup +  widthAvailableForRewardBars / 2
        // TODO: maxNegActionValue??? for line below
        // y == canvasHeight/2 + Max(maxNegativeRewardValue, maxActionValue) * scallingFactor + 20
        /*
            204 widthAvailableForGroup == canvasWidth / actionCount 
            20 == groupWidthMargin = (widthAvailableForGroup * .2) / 2
        */
        bcg.positionActionLabels(20);

        fc.assert(ch.actions[0].basicChartGeometry.actionLabelOriginX, 102.0, "actions_0.X");// 20 + 0 * 204 + 82 = 102
        fc.assert(ch.actions[0].basicChartGeometry.actionLabelOriginY, 580.0, "actions_0.Y");//  320 + 120*2 + 20 = 580

        fc.assert(ch.actions[1].basicChartGeometry.actionLabelOriginX, 306.0, "actions_1.X");//20 + 1 * 204 + 82 = 306
        fc.assert(ch.actions[1].basicChartGeometry.actionLabelOriginY, 580.0, "actions_1.Y");

        fc.assert(ch.actions[2].basicChartGeometry.actionLabelOriginX, 510.0, "actions_2.X");//20 + 2 * 204 + 82 = 510
        fc.assert(ch.actions[2].basicChartGeometry.actionLabelOriginY, 580.0, "actions_2.Y");

        fc.assert(ch.actions[3].basicChartGeometry.actionLabelOriginX, 714.0, "actions_3.X");//20 + 3 * 204 + 82 = 714
        fc.assert(ch.actions[3].basicChartGeometry.actionLabelOriginY, 580.0, "actions_3.Y");
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("action labels positioning allPositives");
        bcg.positionActionLabels(20);

        fc.assert(ch.actions[0].basicChartGeometry.actionLabelOriginX, 102.0, "actions_0.X");// 20 + 0 * 204 + 82 = 102
        fc.assert(ch.actions[0].basicChartGeometry.actionLabelOriginY, 340.0, "actions_0.Y");//  320 + 0*2 + 20 = 0

        fc.assert(ch.actions[1].basicChartGeometry.actionLabelOriginX, 306.0, "actions_1.X");//20 + 1 * 204 + 82 = 306
        fc.assert(ch.actions[1].basicChartGeometry.actionLabelOriginY, 340.0, "actions_1.Y");

        fc.assert(ch.actions[2].basicChartGeometry.actionLabelOriginX, 510.0, "actions_2.X");//20 + 2 * 204 + 82 = 510
        fc.assert(ch.actions[2].basicChartGeometry.actionLabelOriginY, 340.0, "actions_2.Y");

        fc.assert(ch.actions[3].basicChartGeometry.actionLabelOriginX, 714.0, "actions_3.X");//20 + 3 * 204 + 82 = 714
        fc.assert(ch.actions[3].basicChartGeometry.actionLabelOriginY, 340.0, "actions_3.Y");
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("action labels positioning allNegatives");

        bcg.positionActionLabels(20);

        fc.assert(ch.actions[0].basicChartGeometry.actionLabelOriginX, 102.0, "actions_0.X");// 20 + 0 * 204 + 82 = 102
        fc.assert(ch.actions[0].basicChartGeometry.actionLabelOriginY, 580.9, "actions_0.Y");//  320 + 330*.73 + 20 = 580.9

        fc.assert(ch.actions[1].basicChartGeometry.actionLabelOriginX, 306.0, "actions_1.X");//20 + 1 * 204 + 82 = 306
        fc.assert(ch.actions[1].basicChartGeometry.actionLabelOriginY, 580.9, "actions_1.Y");

        fc.assert(ch.actions[2].basicChartGeometry.actionLabelOriginX, 510.0, "actions_2.X");//20 + 2 * 204 + 82 = 510
        fc.assert(ch.actions[2].basicChartGeometry.actionLabelOriginY, 580.9, "actions_2.Y");

        fc.assert(ch.actions[3].basicChartGeometry.actionLabelOriginX, 714.0, "actions_3.X");//20 + 3 * 204 + 82 = 714
        fc.assert(ch.actions[3].basicChartGeometry.actionLabelOriginY, 580.9, "actions_3.Y");
    }

    if (chartTesting == "seeSaw") {
        fc.setCase("value markers positioning seeSaw");
        //scalingFactor = (canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue(); == 1
        // value  i * maxAbsValue / 4
        // pixel distance 
        // assume scaling factor of 2 pixels per 1 value, so value of 120 is 240 pixels
        bcg.positionValueMarkers(4); //give something with maxPosValue and maxNegValue
        fc.assert(bcg.positiveMarkerValues[0], 30.0, "line 1 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
        fc.assert(bcg.positiveMarkerValues[1], 60.0, "line 2 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
        fc.assert(bcg.positiveMarkerValues[2], 90.0, "line 3 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
        fc.assert(bcg.positiveMarkerValues[3], 120.0, "line 4 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("value markers positioning allPositives");
        //scalingFactor = (canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue(); == .72
        bcg.positionValueMarkers(4); //give something with maxPosValue and maxNegValue
        fc.assert(bcg.positiveMarkerValues[0], 82.0, "line 1 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[0], 59.86, "line 1 pixel distance");
        fc.assert(bcg.positiveMarkerValues[1], 164.0, "line 2 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[1], 119.72, "line 2 pixel distance");
        fc.assert(bcg.positiveMarkerValues[2], 246.0, "line 3 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[2], 179.58, "line 3 pixel distance" + ch.scalingFactor);
        fc.assert(bcg.positiveMarkerValues[3], 328.0, "line 4 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[3], 239.44, "line 4 pixel distance");
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("value markers positioning allNegatives");
        //scalingFactor = (canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue(); == .72
        bcg.positionValueMarkers(4); //give something with maxPosValue and maxNegValue
        fc.assert(bcg.positiveMarkerValues[0], 82.0, "line 1 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[0], 59.86, "line 1 pixel distance");
        fc.assert(bcg.positiveMarkerValues[1], 164.0, "line 2 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[1], 119.72, "line 2 pixel distance");
        fc.assert(bcg.positiveMarkerValues[2], 246.0, "line 3 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[2], 179.58, "line 3 pixel distance");
        fc.assert(bcg.positiveMarkerValues[3], 328.0, "line 4 value");
        fc.assert(bcg.positiveMarkerYPixelsFromXAxis[3], 239.44, "line 4 pixel distance");
    }

    if (chartTesting == "seeSaw") {
        fc.setCase("value line positioning seeSaw");
        // x = groupWidthMargin = 20
        //scalingFactor = (canvasHeight / 2) * 0.75 / this.getMaxAbsRewardOrActionValue();
        // 60 == lineSpacing = maxAbsoluteValue * scaling factor / 4
        // y = (canvasHeight / 2) + (1 + Number(i)) * linSpacing
        bcg.positionValueLines(4);
        fc.assert(bcg.positiveLineLength, 776.0, "line distance" + bcg.positiveLineLength);
        fc.assert(bcg.positiveLineOriginX, 20.0, "line originX");
        fc.assert(bcg.positiveLineOriginY[0], 380.0, "line 0 positionY"); //320 + 60
        fc.assert(bcg.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 120
        fc.assert(bcg.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 180
        fc.assert(bcg.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 240
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("value line positioning allPositives");
        bcg.positionValueLines(4);
        fc.assert(bcg.positiveLineLength, 776.0, "line distance" + bcg.positiveLineLength);
        fc.assert(bcg.positiveLineOriginX, 20.0, "line originX");
        fc.assert(bcg.positiveLineOriginY[0], 380.0, "line 0 positionY" + bcg.positiveLineOriginY[0]); //320 + 165
        fc.assert(bcg.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 330
        fc.assert(bcg.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 495
        fc.assert(bcg.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 660
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("value line positioning allNegatives");
        bcg.positionValueLines(4);
        fc.assert(bcg.positiveLineLength, 776.0, "line distance" + bcg.positiveLineLength);
        fc.assert(bcg.positiveLineOriginX, 20.0, "line originX");
        fc.assert(bcg.positiveLineOriginY[0], 380.0, "line 0 positionY"); //320 + 165
        fc.assert(bcg.positiveLineOriginY[1], 440.0, "line 1 positionY"); //320 + 330
        fc.assert(bcg.positiveLineOriginY[2], 500.0, "line 2 positionY"); //320 + 495
        fc.assert(bcg.positiveLineOriginY[3], 560.0, "line 3 positionY"); //320 + 660
    }

    if (chartTesting == "seeSaw") {
        /*
        Tooltips will assume sit at 3/4 the height of bar
        tooltipHeight = 50;
        tooltipWidth = 75;
        ch.toolTip.originX = rewardForName["action_i.reward_j"].basicChartGeometry.originX + rewardBarWidth
        ch.toolTip.originY = (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scallingFactor) * 0.75)
        */
        fc.setCase("tooltips positioning seeSaw");
        bcg.positionTooltips();

        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.tooltipOriginX, 74.0, "tooltip X aciton_0.reward_0");
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.tooltipOriginY, 305.0, "tooltip Y aciton_0.reward_0"); //320 - 10 * 2 * .75
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.tooltipOriginX, 128.0, "tooltip X aciton_0.reward_1");
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.tooltipOriginY, 350.0, "tooltip Y aciton_0.reward_1"); // 320 - 20 * 2 * .75
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.tooltipOriginX, 182.0, "tooltip X aciton_0.reward_2");
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.tooltipOriginY, 275.0, "tooltip Y aciton_0.reward_2"); // 320 - 30 * 2 * .75

        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.tooltipOriginX, 278.0, "tooltip X aciton_1.reward_0");
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.tooltipOriginY, 380.0, "tooltip Y aciton_1.reward_0"); // 320 - 40 * 2 * .75

        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.tooltipOriginX, 536.0, "tooltip X aciton_2.reward_1");
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.tooltipOriginY, 440.0, "tooltip Y aciton_2.reward_1");

        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.tooltipOriginX, 794.0, "tooltip X aciton_3.reward_2");
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.tooltipOriginY, 500.0, "tooltip Y aciton_3.reward_2"); // 320 - 120 * 2 * .75
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("tooltips positioning allPositives");
        bcg.positionTooltips();

        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.tooltipOriginX, 74.0, "tooltip X aciton_0.reward_0");
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.tooltipOriginY, 320.0, "tooltip Y aciton_0.reward_0"); //320 - 0 * .73 * .75
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.tooltipOriginX, 128.0, "tooltip X aciton_0.reward_1");
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.tooltipOriginY, 320.0, "tooltip Y aciton_0.reward_1"); // 320 - 0 * .73 * .75
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.tooltipOriginX, 182.0, "tooltip X aciton_0.reward_2");
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.tooltipOriginY, 320.0, "tooltip Y aciton_0.reward_2"); // 320 - 0 * .73 * .75

        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.tooltipOriginX, 278.0, "tooltip X aciton_1.reward_0");
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.tooltipOriginY, 298.1, "tooltip Y aciton_1.reward_0"); // 320 - 40 * .73 * .75

        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.tooltipOriginX, 536.0, "tooltip X aciton_2.reward_1");
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.tooltipOriginY, 276.2, "tooltip Y aciton_2.reward_1"); // 320 - 80 * .73 * .75

        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.tooltipOriginX, 794.0, "tooltip X aciton_3.reward_2");
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.tooltipOriginY, 254.3, "tooltip Y aciton_3.reward_2"); // 320 - 120 * .73 * .75
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("tooltips positioning allNegatives");
        bcg.positionTooltips();

        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.tooltipOriginX, 74.0, "tooltip X aciton_0.reward_0");
        fc.assert(rewardForName["action_0.reward_0"].basicChartGeometry.tooltipOriginY, 325.475, "tooltip Y aciton_0.reward_0"); //320 - -10 * .73 * .75
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.tooltipOriginX, 128.0, "tooltip X aciton_0.reward_1");
        fc.assert(rewardForName["action_0.reward_1"].basicChartGeometry.tooltipOriginY, 330.95, "tooltip Y aciton_0.reward_1"); // 320 - -20 * .73 * .75
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.tooltipOriginX, 182.0, "tooltip X aciton_0.reward_2");
        fc.assert(rewardForName["action_0.reward_2"].basicChartGeometry.tooltipOriginY, 336.425, "tooltip Y aciton_0.reward_2"); // 320 - -30 * .73 * .75

        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.tooltipOriginX, 278.0, "tooltip X aciton_1.reward_0");
        fc.assert(rewardForName["action_1.reward_0"].basicChartGeometry.tooltipOriginY, 341.9, "tooltip Y aciton_1.reward_0"); // 320 - -40 * .73 * .75

        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.tooltipOriginX, 536.0, "tooltip X aciton_2.reward_1");
        fc.assert(rewardForName["action_2.reward_1"].basicChartGeometry.tooltipOriginY, 363.8, "tooltip Y aciton_2.reward_1"); // 320 - -80 * .73 * .75

        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.tooltipOriginX, 794.0, "tooltip X aciton_3.reward_2");
        fc.assert(rewardForName["action_3.reward_2"].basicChartGeometry.tooltipOriginY, 385.7, "tooltip Y aciton_3.reward_2"); // 320 - -120 * .73 * .75
    }

    fc.setCase("xAxisLine positioning");
    // xAxisLength = width - 2 * groupWidthMargin
    // xAxisOriginX = groupWidthMargin;
    // xAxisOriginY = height / 2
    bcg.positionXAxisLine();
    fc.assert(bcg.xAxisOriginX, 20.0, "xAxisOriginX");
    fc.assert(bcg.xAxisOriginY, 320.0, "xAxisOriginY");
    fc.assert(bcg.xAxisLength, 776.0, "xAxisLength");

    if (chartTesting == "seeSaw") {
        fc.setCase("yAxisLine positioning");
        // yAxisLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
        // yAxisOriginX = groupWidthMargin;
        // yAxisOriginY = (canvasHeight - yAxisLength) / 2
        bcg.positionYAxisLine();
        fc.assert(bcg.yAxisOriginX, 20.0, "yAxisOriginX");
        fc.assert(bcg.yAxisOriginY, 75.0, "yAxisOriginY");
        fc.assert(bcg.yAxisLength, 490.0, "yAxisLength");
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("yAxisLine positioning");
        bcg.positionYAxisLine();
        fc.assert(bcg.yAxisOriginX, 20.0, "yAxisOriginX");
        fc.assert(bcg.yAxisOriginY, 74.1, "yAxisOriginY");
        fc.assert(bcg.yAxisLength, 491.8, "yAxisLength");
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("yAxisLine positioning");
        bcg.positionYAxisLine();
        fc.assert(bcg.yAxisOriginX, 20.0, "yAxisOriginX");
        fc.assert(bcg.yAxisOriginY, 74.1, "yAxisOriginY");
        fc.assert(bcg.yAxisLength, 491.8, "yAxisLength");
    }

    fc.setCase("isPointInBox");
    //x,y,xOrigin,yOrigin,width,height,isHeightNegative
    // positive bar tests
    fc.assert(ch.isPointInsideBox(12, 220, 10, 300, 40, 60, false), false, "isPointInsideBox pos bar bad y");
    fc.assert(ch.isPointInsideBox(8, 280, 10, 300, 40, 60, false), false, "isPointInsideBox pos bar bad x");
    fc.assert(ch.isPointInsideBox(12, 280, 10, 300, 40, 60, false), true, "isPointInsideBox pos bar good x, y");

    // negative bar tests
    fc.assert(ch.isPointInsideBox(12, 370, 10, 300, 40, 60, true), false, "isPointInsideBox neg bar bad y");
    fc.assert(ch.isPointInsideBox(8, 350, 10, 300, 40, 60, true), false, "isPointInsideBox neg bar bad x");
    fc.assert(ch.isPointInsideBox(12, 350, 10, 300, 40, 60, true), true, "isPointInsideBox neg bar good x, y");


    if (chartTesting == "seeSaw") {
        fc.setCase("bar click/mouse move detection seeSaw");
        fc.assert(bcg.getActionBarNameForCoordinates(25, 310), "action_0.reward_0", "hit action_0.reward_0");
        fc.assert(bcg.getActionBarNameForCoordinates(80, 330), "action_0.reward_1", "hit action_0.reward_1");
        fc.assert(bcg.getActionBarNameForCoordinates(130, 310), "action_0.reward_2", "hit action_0.reward_2");

        fc.assert(bcg.getActionBarNameForCoordinates(230, 340), "action_1.reward_0", "hit action_1.reward_0");

        fc.assert(bcg.getActionBarNameForCoordinates(500, 360), "action_2.reward_1", "hit action_2.reward_1"); // -80 * 2

        fc.assert(bcg.getActionBarNameForCoordinates(760, 380), "action_3.reward_2", "hit action_3.reward_2"); // -120 * 2

        // far miss
        fc.assert(bcg.getActionBarNameForCoordinates(1, 1), "None", "miss upper left corner");
        fc.assert(bcg.getActionBarNameForCoordinates(800, 630), "None", "miss lower right corner");

        //close miss
        fc.assert(bcg.getActionBarNameForCoordinates(19, 310), "None", "close miss ");

        //hit corner
        fc.assert(bcg.getActionBarNameForCoordinates(20, 300), "action_0.reward_0", "hit corner");// canvasHeight/2 - smallestBarHeight * scalingFactor (i.e. 10*2)
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("bar click/mouse move detection allPositives");
        fc.assert(bcg.getActionBarNameForCoordinates(25, 320), "action_0.reward_0", "hit action_0.reward_0");
        fc.assert(bcg.getActionBarNameForCoordinates(80, 320), "action_0.reward_1", "hit action_0.reward_1");
        fc.assert(bcg.getActionBarNameForCoordinates(130, 320), "action_0.reward_2", "hit action_0.reward_2");

        fc.assert(bcg.getActionBarNameForCoordinates(230, 290.8), "action_1.reward_0", "hit action_1.reward_0");

        fc.assert(bcg.getActionBarNameForCoordinates(500, 261.6), "action_2.reward_1", "hit action_2.reward_1"); // -80 * 2

        fc.assert(bcg.getActionBarNameForCoordinates(760, 232.4), "action_3.reward_2", "hit action_3.reward_2"); // -120 * 2

        // far miss
        fc.assert(bcg.getActionBarNameForCoordinates(1, 1), "None", "miss upper left corner");
        fc.assert(bcg.getActionBarNameForCoordinates(800, 630), "None", "miss lower right corner");

        //close miss
        fc.assert(bcg.getActionBarNameForCoordinates(19, 310), "None", "close miss ");

        //hit corner
        fc.assert(bcg.getActionBarNameForCoordinates(20, 320), "action_0.reward_0", "hit corner");// canvasHeight/2 - smallestBarHeight * scalingFactor (i.e. 10*2)
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("bar click/mouse move detection allNegatives");
        fc.assert(bcg.getActionBarNameForCoordinates(25, 327.3), "action_0.reward_0", "hit action_0.reward_0");
        fc.assert(bcg.getActionBarNameForCoordinates(80, 334.6), "action_0.reward_1", "hit action_0.reward_1");
        fc.assert(bcg.getActionBarNameForCoordinates(130, 341.9), "action_0.reward_2", "hit action_0.reward_2");

        fc.assert(bcg.getActionBarNameForCoordinates(230, 349.2), "action_1.reward_0", "hit action_1.reward_0");

        fc.assert(bcg.getActionBarNameForCoordinates(500, 378.4), "action_2.reward_1", "hit action_2.reward_1"); // -80 * 2

        fc.assert(bcg.getActionBarNameForCoordinates(760, 407.6), "action_3.reward_2", "hit action_3.reward_2"); // -120 * 2

        // far miss
        fc.assert(bcg.getActionBarNameForCoordinates(1, 1), "None", "miss upper left corner");
        fc.assert(bcg.getActionBarNameForCoordinates(800, 630), "None", "miss lower right corner");

        //close miss
        fc.assert(bcg.getActionBarNameForCoordinates(19, 310), "None", "close miss ");

        //hit corner
        fc.assert(bcg.getActionBarNameForCoordinates(20, 320), "action_0.reward_0", "hit corner");// canvasHeight/2 - smallestBarHeight * scalingFactor (i.e. 10*2)
    }

    if (chartTesting == "seeSaw") {
        fc.setCase("position Action Separators seeSaw");
        bcg.positionActionSeparatorLines();
        fc.assert(bcg.actionLinesOriginX[0], 204.0, "actionLineOriginX 0");
        fc.assert(bcg.actionLinesOriginX[1], 408.0, "actionLineOriginX 1");
        fc.assert(bcg.actionLinesOriginX[2], 612.0, "actionLineOriginX 2");
        fc.assert(bcg.actionLinesOriginY, 75.0, "actionLineOriginY");
        fc.assert(bcg.actionLinesLength, 490.0, "actionLineLength");
    }
    else if (chartTesting == "allPositives") {
        fc.setCase("position Action Separators allPositives");
        bcg.positionActionSeparatorLines();
        fc.assert(bcg.actionLinesOriginX[0], 204.0, "actionLineOriginX 0");
        fc.assert(bcg.actionLinesOriginX[1], 408.0, "actionLineOriginX 1");
        fc.assert(bcg.actionLinesOriginX[2], 612.0, "actionLineOriginX 2");
        fc.assert(bcg.actionLinesOriginY, 74.1, "actionLineOriginY");
        fc.assert(bcg.actionLinesLength, 491.0, "actionLineLength");
    }
    else if (chartTesting == "allNegatives") {
        fc.setCase("position Action Separators allNegatives");
        bcg.positionActionSeparatorLines();
        fc.assert(bcg.actionLinesOriginX[0], 204.0, "actionLineOriginX 0");
        fc.assert(bcg.actionLinesOriginX[1], 408.0, "actionLineOriginX 1");
        fc.assert(bcg.actionLinesOriginX[2], 612.0, "actionLineOriginX 2");
        fc.assert(bcg.actionLinesOriginY, 74.1, "actionLineOriginY");
        fc.assert(bcg.actionLinesLength, 491.0, "actionLineLength");
    }

    /*
        legendHeight = (rewardBarNames.length * 20) + legendDesc.height -- depends on how many legend lines there are
        legendWidth = 100
        10 == legendMargin = (legendWidth * .2) / 2
        legendLineSpacing = 10;

        rewardBarNames
        rewardTitle[i].originX = rewardBox[i].originX - legendMargin - rewardTitle[i].length
        rewardTitle[i].originY = legendDesc.height + legendLineSpacing + (i * (legendText.height + legendLineSpacing))
        rewardBox[i].originX = (1/4) * (legendWidth - (legendMargin*2))
        rewardBox[i].originY = legendDesc.height + legendLineSpacing + (i * (legendText.height + legendLineSpacing))

        (this.options.padding * 2) + (i * widthAvailableForGroup) + groupWidthMargin + (j * widthAvailableForRewardBar),
    */
    // Jed: assume just color box and reward name for now
    // also Evan and Jed assume that legend is at position 0,0 for now till we know where legend should actually sit in canvas
    // fc.setCase("legend postioning");
    // ch.positionLegend();

    // fc.assert(ch.rewards["reward_0"].originX, 25.0, "reward_0.X"); //legendWidth / (3/4)
    // fc.assert(ch.rewards["reward_0"].originY, 10.0, "reward_0.Y"); //legendMargin + i * 10

    // fc.assert(ch.rewards["reward_1"].originX, 25.0, "reward_1.X");
    // fc.assert(ch.rewards["reward_1"].originY, 20.0, "reward_1.Y");

    // fc.assert(ch.rewards["reward_2"].originX, 25.0, "reward_2.X");
    // fc.assert(ch.rewards["reward_2"].originY, 30.0, "reward_2.Y");

    // fc.assert(ch.rewardBox[0].originX, 75.0, "rewardBox 0.X"); //legendWidth * .75
    // fc.assert(ch.rewardBox[0].originY, 10.0, "rewardBox 0.X"); //legendMargin + i * 10

    // fc.assert(ch.rewardBox[1].originX, 75.0, "rewardBox 0.X"); //legendWidth * .75
    // fc.assert(ch.rewardBox[1].originY, 20.0, "rewardBox 0.X"); //legendMargin + i * 10

    // fc.assert(ch.rewardBox[2].originX, 75.0, "rewardBox 0.X"); //legendWidth * .75
    // fc.assert(ch.rewardBox[2].originY, 30.0, "rewardBox 0.X"); //legendMargin + i * 10



    // fc.setCase("legend tooltips positioning");
    // ch.positionLegendTooltips(ch.rewardTooltip); 

    // fc.assert(ch.rewardTooltip[0].originX, 90.0, "legend tooltip X");
    // fc.assert(ch.rewardTooltip[0].originY, 10.0, "legend tooltip Y");

    // fc.assert(ch.rewardTooltip[1].originX, 90.0, "legend tooltip X");
    // fc.assert(ch.rewardTooltip[1].originY, 20.0, "legend tooltip Y");

    // fc.assert(ch.rewardTooltip[2].originX, 90.0, "legend tooltip X");
    // fc.assert(ch.rewardTooltip[2].originY, 30.0, "legend tooltip Y");

    // fc.assert(ch.rewardTooltip[3].originX, 90.0, "legend tooltip X");
    // fc.assert(ch.rewardTooltip[3].originY, 40.0, "legend tooltip Y");

}
