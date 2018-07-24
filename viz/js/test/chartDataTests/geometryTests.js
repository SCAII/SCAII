function runChartDataGeometryTests(failureChecker) {
    // test geometry
    var ch = wrapChartData(buildDummyChart(3));
    var fc = failureChecker;

    // action names are action_0, action_1...action_3
    // rewardnames are action action_0.reward_0, action_0.reward_1

    /*
        320 == canvasHeight
        816 == canvasWidth,
        204 widthAvailableForGroup == canvasWidth / actionCount 
        x axis of chart sits at y == canvasHeight/2
        biggest bar should take up .75 of canvasHeight/2  (120 == 3/4 * ch/2)
        6 == groupWidthMargin = (widthAvailableForGroup * .8) / 2
        192 == widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
        16 == rewardBarWidthAvailable = widthAvailableForRewardBars / rewardBarCount

        4 == rewardSpacerWidth = rewardBarWidthAvailable * .1
        20 == rewardBarWidth = rewardBarWidthAvailable - 2* rewardSpacerWidth

        bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth)
        bar.originY = canvasHeight/2
        coords depend on sign of reward
    */

    // test single-select 
    fc.setCase("bar postioning");
    ch.canvasHeight = 320.0;
    ch.canvasWidth = 816.0;
    ch.positionRewardBar(ch.rewardBars["action_0.reward_0"]);
    fc.assert(ch.rewardBars["action_0.reward_0"].originX, 10, "originX 0.0");// 6 + 4*1 + 0
    fc.assert(ch.rewardBars["action_0.reward_0"].originY, 160, "originY 0.0");// 160 
    fc.assert(ch.rewardBars["action_0.reward_0"].height, 10.0, "originHeight 0.0");
    fc.assert(ch.rewardBars["action_0.reward_0"].width, 20.0, "originWidth 0.0");

    // bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth)
    ch.positionRewardBar(ch.rewardBars["action_0.reward_1"]);
    fc.assert(ch.rewardBars["action_0.reward_1"].originX, 34.0, "originX 0.1");//  6 + 4 * (2) + 20 == 34
    fc.assert(ch.rewardBars["action_0.reward_1"].originY, 160.0, "originY 0.1");// 160 
    fc.assert(ch.rewardBars["action_0.reward_1"].height, -20.0, "originHeight 0.1");
    fc.assert(ch.rewardBars["action_0.reward_1"].width, 20.0, "originWidth 0");

    ch.positionRewardBar(ch.rewardBars["action_0.reward_2"]);
    fc.assert(ch.rewardBars["action_0.reward_2"].originX, 58.0, "originX 0.2");//  6 + 4 * (3) + 40 == 58
    fc.assert(ch.rewardBars["action_0.reward_2"].originY, 160.0, "originY 0.2");// 160 
    fc.assert(ch.rewardBars["action_0.reward_2"].height, 30.0, "originHeight 0.2");
    fc.assert(ch.rewardBars["action_0.reward_2"].width, 20.0, "originWidth 0.2");

    ch.positionRewardBar(ch.rewardBars["action_1.reward_0"]);
    fc.assert(ch.rewardBars["action_1.reward_0"].originX, 214.0, "originX 1.0");// 204 + 6 + 4 * (1) + 0 == 214
    fc.assert(ch.rewardBars["action_1.reward_0"].originY, 160.0, "originY 1.0");// 160 
    fc.assert(ch.rewardBars["action_1.reward_0"].height, 20.0, "originHeight 1.0");
    fc.assert(ch.rewardBars["action_1.reward_0"].width, 20.0, "originWidth 1.0");

    ch.positionRewardBar(ch.rewardBars["action_2.reward_1"]);
    fc.assert(ch.rewardBars["action_2.reward_1"].originX, 442.0, "originX 2.1");// 408 + 6 + 4 * (2) + 20 == 442
    fc.assert(ch.rewardBars["action_2.reward_1"].originY, 160.0, "originY 2.1");// 160 
    fc.assert(ch.rewardBars["action_2.reward_1"].height, -60.0, "originHeight 2.1");
    fc.assert(ch.rewardBars["action_2.reward_1"].width, 20.0, "originWidth 2.1");

    ch.positionRewardBar(ch.rewardBars["action_3.reward_2"]);
    fc.assert(ch.rewardBars["action_3.reward_2"].originX, 670.0, "originX 3.2");// 612 + 6 + 4 * (3) + 40 == 670
    fc.assert(ch.rewardBars["action_3.reward_2"].originY, 160.0, "originY 3.2");// 160 
    fc.assert(ch.rewardBars["action_3.reward_2"].height, 120.0, "originHeight 3.2");
    fc.assert(ch.rewardBars["action_3.reward_2"].width, 20.0, "originWidth 3.2");

    //NEED TO ADD TEST TO POSITION TOTAL ACTION BAR

    fc.setCase("action labels positioning");
    ch.positionActionLabels(ch.actionBarNames);

    fc.assert(ch.actionsBarNames[0].originX, 100.0, "actions_0.X");
    fc.assert(ch.actionsBarNames[0].originY, 100.0, "actions_0.Y");

    fc.assert(ch.actionsBarNames[1].originX, 304.0, "actions_1.X"); //go by widthAvailableForGroup == 204
    fc.assert(ch.actionsBarNames[1].originY, 100.0, "actions_1.Y");

    fc.assert(ch.actionsBarNames[2].originX, 506.0, "actions_2.X");
    fc.assert(ch.actionsBarNames[2].originY, 100.0, "actions_2.Y");

    fc.assert(ch.actionsBarNames[3].originX, 708.0, "actions_3.X");
    fc.assert(ch.actionsBarNames[3].originY, 100.0, "actions_3.Y");


    fc.setCase("value markers positioning");
    ch.positionValueMarkers(); //give something with maxPosValue and maxNegValue

    //WHERE DO I ADD THIS INFORMATION?
    var addFive = 0; //sits at 160
    var i = 0;
    for (var i in this.options.data) {
        for (var j in this.options.data[i]) {
            if (this.options.data[i][j] >= 0) {
                maxPosValue = Math.max(maxValue, this.options.data[i][j]);
            } else {
                maxNegValue = Math.max(maxNegValue, Math.abs(this.options.data[i][j]));
            }
        }
    }
    if (maxPosValue > maxNegValue) {
        maxValue = maxPosValue;
    } else {
        maxValue = maxNegValue;
    }
    maxNegValue = -maxNegValue;
    //?????
    for (i = 0; i < ch.maxBar; i++) {
        fc.assert()
        addFive += 5;
    }

    //TOOLTIPS CAN SIT HALFWAY OF BARHEIGHT. WHERE DO I ADD THIS INFORMATION

    /*
        legendHeight = (rewardTypes.length * 40) + legendDesc.height -- depends on how many legend lines there are
        legendWidth = rewardText.largest + rewardTextSpacing * 2 + legendMargin * 2 + rewardDesc.largest
        legendMargin = (legendWidth * .8) / 2
        legendLineSpacing = 10;

        rewardTitle[i].originX = rewardBox[i].originX - legendMargin - rewardTitle[i].length
        rewardTitle[i].originY = legendDesc.height + legendLineSpacing + (i * (legendText.height + legendLineSpacing))
        rewardBox[i].originX = (1/4) * (legendWidth - (legendMargin*2))
        rewardBox[i].originY = legendDesc.height + legendLineSpacing + (i * (legendText.height + legendLineSpacing))
        rewardDesc[i].originX = rewardBox[i].width + legendMargin

        (this.options.padding * 2) + (i * widthAvailableForGroup) + groupWidthMargin + (j * rewardBarWidthAvailable),
    */

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
