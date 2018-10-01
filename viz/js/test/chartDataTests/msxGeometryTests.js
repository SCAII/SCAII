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
        widthAvailableForGroup == (canvasWidth / 2) - (groupWidthMargin * 3)
        scalingFactor == 2
        x axis of chart sits at y == canvasHeight/2
        biggest bar should take up .75 of canvasHeight/2  (120 * scalingFactor == 3/4 * canvasHeight/2) (we assumed scalingFactor == 2)

        groupWidthMargin = 20

        54 == widthAvailableForRewardBar = widthAvailableForGroup / rewardBarCount   (assume rewardBarCount == 3)


        bar.originX = Math.floor(i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth * (j + 1) + j *(rewardBarWidth))
        bar.originY = canvasHeight/2 ==> constant 320.0


    */

    if (chartTesting == "seeSaw") {
        //fc.setCase("seeSaw [DETAIL]");

    } else if (chartTesting == "allPositives") {
        //fc.setCase("allPositives [DETAIL]");

    } else if (chartTesting == "allNegatives") {
        //fc.setCase("allNegatives [DETAIL]");
        //fc.assert(ch.actionRewardForNameMap["action_0.reward_0"].msxColor, "grey", "color 0.0");

    }

}