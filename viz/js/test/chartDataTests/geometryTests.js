function runChartDataGeometryTests(failureChecker) {
    // test geometry
    var ch = getSeeSawChart();
    ch = addUtilityFunctions(ch);
    var fc = failureChecker;

    fc.setTestName("chart data geometry test");
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
    ch = addGeometryFunctions(ch);
    ch.initChartDimensions(640.0, 816.0, 0.2, 0.0);

    fc.setCase("bar postioning");
    ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"], 0, 0);
    fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originX, 20.0, "originX 0.0");// 20.0 + 0*1 + 0
    fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].originY, 320.0, "originY 0.0");// 160 

    // bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth)
    ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"], 0, 1);
    fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originX, 74.0, "originX 0.1");//  20.0 + 0 * (2) + 54 == 74.0
    fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].originY, 320.0, "originY 0.1");// 320 

    ch.positionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"], 0, 2);
    fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originX, 128.0, "originX 0.2");//  20.0 + 0 * (3) + 108 == 128.0
    fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].originY, 320.0, "originY 0.2");// 320 

    ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"], 1, 0);
    fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originX, 224.0, "originX 1.0");// 204 + 20.0 + 0 * (1) + 0 == 224.0
    fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].originY, 320.0, "originY 1.0");// 320

    ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"], 1, 1);//skip test here but need later
    ch.positionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"], 1, 2);//skip test here but need later

    ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"], 2, 0);//skip test here but need later
    ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"], 2, 1);
    fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originX, 482.0, "originX 2.1");// 408 + 20.0 + 0 * (2) + 54 == 482.0
    fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].originY, 320.0, "originY 2.1");// 320
    ch.positionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"], 2, 2);//skip test here but need later

    ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"], 3, 0);//skip test here but need later
    ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"], 3, 1);//skip test here but need later
    ch.positionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"], 3, 2);
    fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originX, 740.0, "originX 3.2");// 612 + 20.0 + 0 * (3) + 108 == 740.0
    fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].originY, 320.0, "originY 3.2");// 320 


    fc.setCase("bar dimensioning");
    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_0"]);
    fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].height, 20.0, "originHeight 0.0");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].width, 54.0, "originWidth 0.0");

    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_1"]);
    fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].height, 40.0, "originHeight 0.1");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].width, 54.0, "originWidth 0");

    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_0.reward_2"]);
    fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].height, 60.0, "originHeight 0.2");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].width, 54.0, "originWidth 0.2");

    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_0"]);
    fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].height, 80.0, "originHeight 1.0");
    fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].width, 54.0, "originWidth 1.0");
    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_1"]);
    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_1.reward_2"]);

    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_0"]);
    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_1"]);
    fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].height, 160.0, "originHeight 2.1");
    fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].width, 54.0, "originWidth 2.1");
    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_2.reward_2"]);

    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_0"]);
    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_1"]);
    ch.dimensionRewardBar(ch.actionRewardForNameMap["action_3.reward_2"]);
    fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].height, 240.0, "originHeight 3.2");
    fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].width, 54.0, "originWidth 3.2");

    //NEED TO ADD TEST TO POSITION TOTAL ACTION BAR
    /*
    
        204 widthAvailableForGroup == canvasWidth / actionCount 
        20 == groupWidthMargin = (widthAvailableForGroup * .2) / 2
    */
    // x coord == groupWidthmargin + i * (widthAvailableForGroup)
    // y coord == the axis location == canvas_height / 2
    fc.setCase("action bar positioning");
    ch.positionActionBar(ch.actionForNameMap["action_0"], 0);
    fc.assert(ch.actionForNameMap["action_0"].originX, 20.0, "originX action_0");// 20  + 0
    fc.assert(ch.actionForNameMap["action_0"].originY, 320.0, "originY action_0");// 320 
    
    ch.positionActionBar(ch.actionForNameMap["action_1"], 1);
    fc.assert(ch.actionForNameMap["action_1"].originX, 224.0, "originX action_1");// 20  + 204
    fc.assert(ch.actionForNameMap["action_1"].originY, 320.0, "originY action_1");// 320 
    
    ch.positionActionBar(ch.actionForNameMap["action_2"], 2);
    fc.assert(ch.actionForNameMap["action_2"].originX, 428.0, "originX action_2");// 20 + 408
    fc.assert(ch.actionForNameMap["action_2"].originY, 320.0, "originY action_2");// 320 

    ch.positionActionBar(ch.actionForNameMap["action_3"], 3);
    fc.assert(ch.actionForNameMap["action_3"].originX, 632.0, "originX action_3");// 20  + 612
    fc.assert(ch.actionForNameMap["action_3"].originY, 320.0, "originY action_3");// 320 
    //
    //
    fc.setCase("action bar dimensioning");
    // DIMENSION TOTAL ACTION BAR
    // width == widthAvailableForRewardBars== 192
    // height == sum of the bars
    ch.dimensionActionBar(ch.actionForNameMap["action_0"]);
    fc.assert(ch.actionForNameMap["action_0"].height, 40.0, "originHeight action_0");  // Abs((10  -20 + 30) * scallingFactor of 2)
    fc.assert(ch.actionForNameMap["action_0"].width, 164.0, "originWidth action_0");

    ch.dimensionActionBar(ch.actionForNameMap["action_1"]);
    fc.assert(ch.actionForNameMap["action_1"].height, 100.0, "originHeight action_1"); //  Abs((-40 + 50 - 60) * scallingFacotr of 2)
    fc.assert(ch.actionForNameMap["action_1"].width, 164.0, "originWidth action_1");
    
    ch.dimensionActionBar(ch.actionForNameMap["action_2"]);
    fc.assert(ch.actionForNameMap["action_2"].height, 160.0, "originHeight action_2"); // Abs((70 - 80 + 90) * scallingFacotr of 2)
    fc.assert(ch.actionForNameMap["action_2"].width, 164.0, "originWidth action_2");
    
    ch.dimensionActionBar(ch.actionForNameMap["action_3"]);
    fc.assert(ch.actionForNameMap["action_3"].height, 220.0, "originHeight action_3");  // Abs((-100 + 110 - 120) * scallingFactor of 2)
    fc.assert(ch.actionForNameMap["action_3"].width, 164.0, "originWidth action_3");
    
    

    fc.setCase("action labels positioning");
    // x == groupWidthMargin + i * widthAvailableForGroup +  widthAvailableForRewardBars / 2
    // y == canvasHeight/2 + maxNegativeValue + 20
    /*
        204 widthAvailableForGroup == canvasWidth / actionCount 
        20 == groupWidthMargin = (widthAvailableForGroup * .2) / 2
    */
    ch.positionActionLabels();

    fc.assert(ch.actions[0].actionLabelOriginX, 102.0, "actions_0.X");// 20 + 0 * 204 + 82 = 102
    fc.assert(ch.actions[0].actionLabelOriginY, 580.0, "actions_0.Y");//  320 + 120*2 + 20 = 580

    fc.assert(ch.actions[1].actionLabelOriginX, 306.0, "actions_1.X");//20 + 1 * 204 + 82 = 306
    fc.assert(ch.actions[1].actionLabelOriginY, 580.0, "actions_1.Y");

    fc.assert(ch.actions[2].actionLabelOriginX, 510.0, "actions_2.X");//20 + 2 * 204 + 82 = 510
    fc.assert(ch.actions[2].actionLabelOriginY, 580.0, "actions_2.Y");

    fc.assert(ch.actions[3].actionLabelOriginX, 714.0, "actions_3.X");//20 + 3 * 204 + 82 = 714
    fc.assert(ch.actions[3].actionLabelOriginY, 580.0, "actions_3.Y");


    fc.setCase("value markers positioning");
    // value  i * maxAbsValue / 4
    // pixel distance 
    // assume scaling factor of 2 pixels per 1 value, so value of 120 is 240 pixels
    ch.positionValueMarkers(4); //give something with maxPosValue and maxNegValue
    fc.assert(ch.positiveMarkerValues[0], 30.0, "line 1 value");
    fc.assert(ch.positiveMarkerYPixelsFromXAxis[0], 60.0, "line 1 pixel distance");
    fc.assert(ch.positiveMarkerValues[1], 60.0, " line 2 value");
    fc.assert(ch.positiveMarkerYPixelsFromXAxis[1], 120.0, "line 2 pixel distance");
    fc.assert(ch.positiveMarkerValues[2], 90.0, " line 3 value");
    fc.assert(ch.positiveMarkerYPixelsFromXAxis[2], 180.0, "line 3 pixel distance");
    fc.assert(ch.positiveMarkerValues[3], 120.0, "line 4 value");
    fc.assert(ch.positiveMarkerYPixelsFromXAxis[3], 240.0, "line 4 pixel distance");
  
    fc.setCase("value line positioning");
    // x = groupWidthMargin = 20
    // 60 == lineSpacing = maxAbsoluteValue * scaling factor / 4
    // y = (canvasHeight / 2) + (1 + Number(i)) * linSpacing
    ch.positionValueLines(4);
    fc.assert(ch.positiveLineLength, 776.0, "line distance" + ch.positiveLineLength);
    fc.assert(ch.positiveLineOriginX, 20.0, "line originX");
    fc.assert(ch.positiveLineOriginY[0], 380.0, "line 1 positionY"); 320 + 60
    fc.assert(ch.positiveLineOriginY[1], 440.0, "line 1 positionY"); 320 + 120
    fc.assert(ch.positiveLineOriginY[2], 500.0, "line 1 positionY"); 320 + 180
    fc.assert(ch.positiveLineOriginY[3], 560.0, "line 1 positionY"); 320 + 240

    /*
    Tooltips will assume sit at 3/4 the height of bar
    tooltipHeight = 50;
    tooltipWidth = 75;
    ch.toolTip.originX = ch.actionRewardForNameMap["action_i.reward_j"].originX + rewardBarWidth
    ch.toolTip.originY = (canvasHeight / 2) - ((ch.rewardBar[i].bars[j].value * scallingFactor) * 0.75)
    */
    fc.setCase("tooltips positioning");
    ch.positionTooltips();

    fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].tooltipOriginX, 74.0, "tooltip aciton_0.reward_0");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].tooltipOriginY, 305.0, "tooltip aciton_0.reward_0"); //320 - 10 * 2 * .75
    fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].tooltipOriginX, 128.0, "tooltip aciton_0.reward_1");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_1"].tooltipOriginY, 350.0, "tooltip aciton_0.reward_1"); // 320 - 20 * 2 * .75
    fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].tooltipOriginX, 182.0, "tooltip aciton_0.reward_2");
    fc.assert(ch.actionRewardForNameMap["action_0.reward_2"].tooltipOriginY, 275.0, "tooltip aciton_0.reward_2"); // 320 - 30 * 2 * .75

    fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].tooltipOriginX, 278.0, "tooltip aciton_1.reward_0");
    fc.assert(ch.actionRewardForNameMap["action_1.reward_0"].tooltipOriginY, 380.0, "tooltip aciton_1.reward_0"); // 320 - 40 * 2 * .75

    fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].tooltipOriginX, 536.0, "tooltip aciton_2.reward_1"); 
    fc.assert(ch.actionRewardForNameMap["action_2.reward_1"].tooltipOriginY, 440.0, "tooltip aciton_2.reward_1");

    fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].tooltipOriginX, 794.0, "tooltip aciton_3.reward_2");
    fc.assert(ch.actionRewardForNameMap["action_3.reward_2"].tooltipOriginY, 500.0, "tooltip aciton_3.reward_2"); // 320 - 120 * 2 * .75

    fc.setCase("xAxisLine positioning");
    // xAxisLength = width - 2 * groupWidthMargin
    // xAxisOriginX = groupWidthMargin;
    // xAxisOriginY = height / 2
    ch.positionXAxisLine();
    fc.assert(ch.xAxisOriginX, 20.0, "xAxisOriginX");
    fc.assert(ch.xAxisOriginY, 320.0, "xAxisOriginY");
    fc.assert(ch.xAxisLength, 776.0, "xAxisLength");

    fc.setCase("yAxisLine positioning");
    // yAxisLength = maxAbsRewardValue * 2 * scalingFactor + aBitMore
    // yAxisOriginX = groupWidthMargin;
    // yAxisOriginY = (canvasHeight - yAxisLength) / 2
    ch.positionYAxisLine();
    fc.assert(ch.yAxisOriginX, 20.0, "yAxisOriginX");
    fc.assert(ch.yAxisOriginY, 75.0, "yAxisOriginY");
    fc.assert(ch.yAxisLength,  490.0, "yAxisLength");


    fc.setCase("isPointInBox");
    //x,y,xOrigin,yOrigin,width,height,isHeightNegative
    // positive bar tests
    fc.assert(ch.isPointInsideBox(12,220,10,300,40,60, false), false, "isPointInsideBox pos bar bad y"); 
    fc.assert(ch.isPointInsideBox(8,280,10,300,40,60, false), false, "isPointInsideBox pos bar bad x"); 
    fc.assert(ch.isPointInsideBox(12,280,10,300,40,60, false), true, "isPointInsideBox pos bar good x, y"); 

    // negative bar tests
    fc.assert(ch.isPointInsideBox(12,370,10,300,40,60, true), false, "isPointInsideBox neg bar bad y"); 
    fc.assert(ch.isPointInsideBox(8,350,10,300,40,60, true), false, "isPointInsideBox neg bar bad x"); 
    fc.assert(ch.isPointInsideBox(12,350,10,300,40,60, true), true, "isPointInsideBox neg bar good x, y"); 


    fc.setCase("bar click/mouse move detection");
    fc.assert(ch.getActionBarNameForCoordinates(25,310), "action_0.reward_0", "hit action_0.reward_0");
    fc.assert(ch.getActionBarNameForCoordinates(80,330), "action_0.reward_1", "hit action_0.reward_1");
    fc.assert(ch.getActionBarNameForCoordinates(130,310), "action_0.reward_2", "hit action_0.reward_2");
    
    fc.assert(ch.getActionBarNameForCoordinates(230,340), "action_1.reward_0",  "hit action_1.reward_0");

    fc.assert(ch.getActionBarNameForCoordinates(500,360), "action_2.reward_1", "hit action_2.reward_1"); // -80 * 2
    
    fc.assert(ch.getActionBarNameForCoordinates(760,380), "action_3.reward_2", "hit action_3.reward_2"); // -120 * 2

    // far miss
    fc.assert(ch.getActionBarNameForCoordinates(1,1), "None", "miss upper left corner");
    fc.assert(ch.getActionBarNameForCoordinates(800,630), "None", "miss lower right corner");

    //close miss
    fc.assert(ch.getActionBarNameForCoordinates(19,310), "None", "close miss ");
    
    //hit corner
    fc.assert(ch.getActionBarNameForCoordinates(20,300), "action_0.reward_0", "hit corner");// canvasHeight/2 - smallestBarHeight * scalingFactor (i.e. 10*2)
    fc.setCase("position Action Seperators");
    ch.positionActionSeperatorLines();
    fc.assert(ch.actionLinesOriginX[0], 204.0, "actionLineOriginX 0");
    fc.assert(ch.actionLinesOriginX[1], 408.0, "actionLineOriginX 1");
    fc.assert(ch.actionLinesOriginX[2], 612.0, "actionLineOriginX 2");
    fc.assert(ch.actionLinesOriginY, 75.0, "actionLineOriginY");
    fc.assert(ch.actionLinesLength, 490.0, "actionLineLength");

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
