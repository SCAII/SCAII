function runChartDataGeometryTests(failureChecker) {
    // test geometry
    var ch = addUtilityFunctions(buildDummyChart(3));
    var fc = failureChecker;

    // action names are action_0, action_1...action_3
    // rewardnames are action action_0.reward_0, action_0.reward_1

    /*

    Evan will add scaling factor of 2 (so each value will take up 2 pixels)

        320 == canvasHeight
        816 == canvasWidth,
        204 widthAvailableForGroup == canvasWidth / actionCount 
        x axis of chart sits at y == canvasHeight/2
        biggest bar should take up .75 of canvasHeight/2  (120 * scalingFactor == 3/4 * canvasHeight/2) (we assumed scalingFactor == 1)
        6 == groupWidthMargin = (widthAvailableForGroup * .2) / 2
        192 == widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        16 == rewardBarWidthAvailable = widthAvailableForRewardBars / rewardBarCount

        0 == rewardSpacerWidth = rewardBarWidthAvailable * 0 // assume no space for now
        20 == rewardBarWidth = rewardBarWidthAvailable - 2* rewardSpacerWidth

        bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth)
        bar.originY = canvasHeight/2
        coords depend on sign of reward

        dummy bar values look like this:

            1       2       3       4
        1   10      -20     30      -40
        2   -20     40      -60     80
        3   30      -60     90      -120
    */

    fc.setCase("bar postioning");
    ch.canvasHeight = 320.0;
    ch.canvasWidth = 816.0;
    ch.positionRewardBar(ch.rewardBars["action_0.reward_0"]);
    fc.assert(ch.rewardBars["action_0.reward_0"].originX, 6.0, "originX 0.0");// 6 + 0*1 + 0
    fc.assert(ch.rewardBars["action_0.reward_0"].originY, 160.0, "originY 0.0");// 160 

    // bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth)
    ch.positionRewardBar(ch.rewardBars["action_0.reward_1"]);
    fc.assert(ch.rewardBars["action_0.reward_1"].originX, 26.0, "originX 0.1");//  6 + 0 * (2) + 20 == 26
    fc.assert(ch.rewardBars["action_0.reward_1"].originY, 160.0, "originY 0.1");// 160 

    ch.positionRewardBar(ch.rewardBars["action_0.reward_2"]);
    fc.assert(ch.rewardBars["action_0.reward_2"].originX, 46.0, "originX 0.2");//  6 + 0 * (3) + 40 == 46
    fc.assert(ch.rewardBars["action_0.reward_2"].originY, 160.0, "originY 0.2");// 160 

    ch.positionRewardBar(ch.rewardBars["action_1.reward_0"]);
    fc.assert(ch.rewardBars["action_1.reward_0"].originX, 210.0, "originX 1.0");// 204 + 6 + 0 * (1) + 0 == 210
    fc.assert(ch.rewardBars["action_1.reward_0"].originY, 160.0, "originY 1.0");// 160 

    ch.positionRewardBar(ch.rewardBars["action_2.reward_1"]);
    fc.assert(ch.rewardBars["action_2.reward_1"].originX, 434.0, "originX 2.1");// 408 + 6 + 0 * (2) + 20 == 434
    fc.assert(ch.rewardBars["action_2.reward_1"].originY, 160.0, "originY 2.1");// 160 

    ch.positionRewardBar(ch.rewardBars["action_3.reward_2"]);
    fc.assert(ch.rewardBars["action_3.reward_2"].originX, 658.0, "originX 3.2");// 612 + 6 + 0 * (3) + 40 == 658
    fc.assert(ch.rewardBars["action_3.reward_2"].originY, 160.0, "originY 3.2");// 160 


    fc.setCase("bar dimensioning");
    ch.dimensionRewardBar(ch.rewardBars["action_0.reward_0"]);
    fc.assert(ch.rewardBars["action_0.reward_0"].height, 10.0, "originHeight 0.0");
    fc.assert(ch.rewardBars["action_0.reward_0"].width, 20.0, "originWidth 0.0");

    ch.dimensionRewardBar(ch.rewardBars["action_0.reward_1"]);
    fc.assert(ch.rewardBars["action_0.reward_1"].height, -20.0, "originHeight 0.1");
    fc.assert(ch.rewardBars["action_0.reward_1"].width, 20.0, "originWidth 0");

    ch.dimensionRewardBar(ch.rewardBars["action_0.reward_2"]);
    fc.assert(ch.rewardBars["action_0.reward_2"].height, 30.0, "originHeight 0.2");
    fc.assert(ch.rewardBars["action_0.reward_2"].width, 20.0, "originWidth 0.2");

    ch.dimensionRewardBar(ch.rewardBars["action_1.reward_0"]);
    fc.assert(ch.rewardBars["action_1.reward_0"].height, 20.0, "originHeight 1.0");
    fc.assert(ch.rewardBars["action_1.reward_0"].width, 20.0, "originWidth 1.0");

    ch.dimensionRewardBar(ch.rewardBars["action_2.reward_1"]);
    fc.assert(ch.rewardBars["action_2.reward_1"].height, -60.0, "originHeight 2.1");
    fc.assert(ch.rewardBars["action_2.reward_1"].width, 20.0, "originWidth 2.1");

    ch.dimensionRewardBar(ch.rewardBars["action_3.reward_2"]);
    fc.assert(ch.rewardBars["action_3.reward_2"].height, 120.0, "originHeight 3.2");
    fc.assert(ch.rewardBars["action_3.reward_2"].width, 20.0, "originWidth 3.2");

    //NEED TO ADD TEST TO POSITION TOTAL ACTION BAR
    /*
    
        204 widthAvailableForGroup == canvasWidth / actionCount 
        6 == groupWidthMargin = (widthAvailableForGroup * .2) / 2
    */
    // x coord == groupWidthmargin + i * (widthAvailableForGroup)
    // y coord == the axis location == canvas_height / 2
    fc.setCase("action bar positioning");
    ch.positionActionBar(ch.actionBars["action_0"]);
    fc.assert(ch.actionBars["action_0"].originX, 6.0, "originX action_0");// 6  + 0
    fc.assert(ch.actionBars["action_0"].originY, 160.0, "originY action_0");// 160 
    
    ch.positionActionBar(ch.actionBars["action_1"]);
    fc.assert(ch.actionBars["action_1"].originX, 210.0, "originX action_1");// 6  + 204
    fc.assert(ch.actionBars["action_1"].originY, 160.0, "originY action_1");// 160 
    
    ch.positionActionBar(ch.actionBars["action_2"]);
    fc.assert(ch.actionBars["action_2"].originX, 414.0, "originX action_2");// 6 + 408
    fc.assert(ch.actionBars["action_2"].originY, 160.0, "originY action_2");// 160 

    ch.positionActionBar(ch.actionBars["action_3"]);
    fc.assert(ch.actionBars["action_3"].originX, 618.0, "originX action_3");// 6  + 612
    fc.assert(ch.actionBars["action_3"].originY, 160.0, "originY action_3");// 160 
    //
    //
    fc.setCase("action bar dimensioning");
    // DIMENSION TOTAL ACTION BAR
    // width == widthAvailableForRewardBars== 192
    // height == sum of the bars
    ch.dimensionActionBar(ch.actionBars["action_0"]);
    fc.assert(ch.actionBars["action_0"].height, 20.0, "originHeight action_0");  // 10  -20 + 30
    fc.assert(ch.actionBars["action_0"].width, 192.0, "originWidth action_0");

    ch.dimensionActionBar(ch.actionBars["action_1"]);
    fc.assert(ch.actionBars["action_1"].height, -40.0, "originHeight action_1"); //  -20 + 40 - 60
    fc.assert(ch.actionBars["action_1"].width, 192.0, "originWidth action_1");
    
    ch.dimensionActionBar(ch.actionBars["action_2"]);
    fc.assert(ch.actionBars["action_2"].height, 60.0, "originHeight action_2"); // 30 - 60 + 90
    fc.assert(ch.actionBars["action_2"].width, 192.0, "originWidth action_2");
    
    
    ch.dimensionActionBar(ch.actionBars["action_3"]);
    fc.assert(ch.actionBars["action_3"].height, -80.0, "originHeight action_3");  // -40 + 80 - 120
    fc.assert(ch.actionBars["action_3"].width, 192.0, "originWidth action_3");
    
    

    fc.setCase("action labels positioning");
    // x == groupWidthMargin + i * widthAvailableForRewardBars + widthAvailableForRewardBars / 2
    // y == canvasHeight/2 + maxNegativeValue + 10
    /*
        204 widthAvailableForGroup == canvasWidth / actionCount 
        6 == groupWidthMargin = (widthAvailableForGroup * .2) / 2
    */
    ch.positionActionLabels(ch.actionBarNames);

    fc.assert(ch.actionsBarNames[0].originX, 100.0, "actions_0.X");// 6 + 0 * 204 + 102 = 108
    fc.assert(ch.actionsBarNames[0].originY, 290.0, "actions_0.Y");//  160 + 120 + 10 = 290

    fc.assert(ch.actionsBarNames[1].originX, 304.0, "actions_1.X");//6 + 1 * 204 + 102 = 312
    fc.assert(ch.actionsBarNames[1].originY, 290.0, "actions_1.Y");

    fc.assert(ch.actionsBarNames[2].originX, 506.0, "actions_2.X");//6 + 2 * 204 + 102 = 516
    fc.assert(ch.actionsBarNames[2].originY, 290.0, "actions_2.Y");

    fc.assert(ch.actionsBarNames[3].originX, 708.0, "actions_3.X");//6 + 3 * 204 + 102 = 720
    fc.assert(ch.actionsBarNames[3].originY, 290.0, "actions_3.Y");


    fc.setCase("value markers positioning");
    // value  i * maxAbsValue / 4
    // pixel distance 
    // assume scaling factor of 2 pixels per 1 value, so value of 120 is 240 pixels
    ch.positionValueMarkers(4); //give something with maxPosValue and maxNegValue
    fc.assert(ch.positiveMarkerValues[0], 30.0, "line 1 value");
    fc.assert(ch.positiveMarkerPixelsFromOrigin[0], 60.0, "line 1 pixel distance");
    fc.assert(ch.positiveMarkerValues[1], 60.0, " line 2 value");
    fc.assert(ch.positiveMarkerPixelsFromOrigin[1], 120.0, "line 2 pixel distance");
    fc.assert(ch.positiveMarkerValues[2], 90.0, " line 3 value");
    fc.assert(ch.positiveMarkerPixelsFromOrigin[2], 180.0, "line 3 pixel distance");
    fc.assert(ch.positiveMarkerValues[3], 120.0, "line 4 value");
    fc.assert(ch.positiveMarkerPixelsFromOrigin[4], 240.0, "line 4 pixel distance");
  

    //TOOLTIPS CAN SIT HALFWAY OF BARHEIGHT. WHERE DO I ADD THIS INFORMATION

    /*
        legendHeight = (rewardTypes.length * 40) + legendDesc.height -- depends on how many legend lines there are
        legendWidth = rewardText.largest + rewardTextSpacing * 2 + legendMargin * 2 + rewardDesc.largest
        legendMargin = (legendWidth * .2) / 2
        legendLineSpacing = 10;

        rewardTitle[i].originX = rewardBox[i].originX - legendMargin - rewardTitle[i].length
        rewardTitle[i].originY = legendDesc.height + legendLineSpacing + (i * (legendText.height + legendLineSpacing))
        rewardBox[i].originX = (1/4) * (legendWidth - (legendMargin*2))
        rewardBox[i].originY = legendDesc.height + legendLineSpacing + (i * (legendText.height + legendLineSpacing))
        rewardDesc[i].originX = rewardBox[i].width + legendMargin

        (this.options.padding * 2) + (i * widthAvailableForGroup) + groupWidthMargin + (j * rewardBarWidthAvailable),
    */
    // Jed: assume just color box and reward name for now
    fc.setCase("legend postioning");
    ch.positionLegend(ch.rewardBarNames);
    ch.positionLegendMainDesc(ch.legendMainDesc);
    fc.assert(ch.legendMainDesc.originX, 80.0,"mainDesc");
    fc.assert(ch.legendMainDesc.originY, 80.0,"mainDesc");

    fc.assert(ch.rewardBarNames[0].originX, 100.0, "reward_0.X");
    fc.assert(ch.rewardBarNames[0].originY, 100.0, "reward_0.Y");

    fc.assert(ch.rewardBarNames[1].originX, 100.0, "reward_1.X");
    fc.assert(ch.rewardBarNames[1].originY, 110.0, "reward_1.Y");

    fc.assert(ch.rewardBarNames[2].originX, 100.0, "reward_2.X");
    fc.assert(ch.rewardBarNames[2].originY, 120.0, "reward_2.Y");

    fc.assert(ch.rewardBarNames[3].originX, 100.0, "reward_3.X");
    fc.assert(ch.rewardBarNames[3].originY, 130.0, "reward_3.Y");
//----
    fc.assert(ch.rewardBarNames[0].desc.originX, 130.0, "desc_0.X");
    fc.assert(ch.rewardBarNames[0].desc.originY, 100.0, "desc_0.Y");

    fc.assert(ch.rewardBarNames[1].desc.originX, 140.0, "desc_1.X");
    fc.assert(ch.rewardBarNames[1].desc.originY, 110.0, "desc_1.Y");

    fc.assert(ch.rewardBarNames[2].desc.originX, 150.0, "desc_2.X");
    fc.assert(ch.rewardBarNames[2].desc.originY, 120.0, "desc_2.Y");

    fc.assert(ch.rewardBarNames[3].desc.originX, 160.0, "desc_3.X");
    fc.assert(ch.rewardBarNames[3].desc.originY, 130.0, "desc_3.Y");

}
