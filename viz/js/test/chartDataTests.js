// NEW_CHART, NEW_SAL  selection values as [ "Q1","*"] [ "Q1","rewardX"] NIX THIS , use ids as :   id == "Q1.combined"  "Q1.rewardX"
function runChartDataSelectionTests(failureChecker) {
    var fc = failureChecker;
    var ch = wrapChartData(buildDummyChart(3));

    // action names are action_0, action_1...action_3
    // rewardnames are action action_0.reward_0, action_0.reward_1
    // test single-select 
    fc.setCase("single-select");

    // verify clearing works
    ch.clearSelections();
    fc.assert(ch.getRewardBarSelectionCount(), 0, "selectionCount 0");
    // fc.assert(ch.actionBars["action_0"].selected, false, "not selected a0");
    // fc.assert(ch.actionBars["action_1"].selected, false, "not selected b0");
    // fc.assert(ch.actionBars["action_2"].selected, false, "not selected c0");
    // fc.assert(ch.actionBars["action_3"].selected, false, "not selected d0");

    fc.assert(ch.rewardBars["action_0.reward_0"].selected, false, "not selected e0");
    fc.assert(ch.rewardBars["action_0.reward_1"].selected, false, "not selected f0");
    fc.assert(ch.rewardBars["action_0.reward_2"].selected, false, "not selected g0");

    fc.assert(ch.rewardBars["action_1.reward_0"].selected, false, "not selected h0");
    fc.assert(ch.rewardBars["action_1.reward_1"].selected, false, "not selected i0");
    fc.assert(ch.rewardBars["action_1.reward_2"].selected, false, "not selected j0");

    fc.assert(ch.rewardBars["action_2.reward_0"].selected, false, "not selected k0");
    fc.assert(ch.rewardBars["action_2.reward_1"].selected, false, "not selected l0");
    fc.assert(ch.rewardBars["action_2.reward_2"].selected, false, "not selected m0");

    fc.assert(ch.rewardBars["action_3.reward_0"].selected, false, "not selected n0");
    fc.assert(ch.rewardBars["action_3.reward_1"].selected, false, "not selected o0");
    fc.assert(ch.rewardBars["action_3.reward_2"].selected, false, "not selected p0");

    // single select selects correctly
   
    ch.selectSingleRewardBar("action_0.reward_1"); 
    fc.assert(ch.getRewardBarSelectionCount(), 1, "selectionCount 1");

    fc.assert(ch.rewardBars["action_0.reward_0"].selected, false, "not selected e1");
    fc.assert(ch.rewardBars["action_0.reward_1"].selected, true, "is selected f1"); //<<--
    fc.assert(ch.rewardBars["action_0.reward_2"].selected, false, "not selected g1");

    fc.assert(ch.rewardBars["action_1.reward_0"].selected, false, "not selected h1");
    fc.assert(ch.rewardBars["action_1.reward_1"].selected, false, "not selected i1");
    fc.assert(ch.rewardBars["action_1.reward_2"].selected, false, "not selected j1");

    fc.assert(ch.rewardBars["action_2.reward_0"].selected, false, "not selected k1");
    fc.assert(ch.rewardBars["action_2.reward_1"].selected, false, "not selected l1");
    fc.assert(ch.rewardBars["action_2.reward_2"].selected, false, "not selected m1");

    fc.assert(ch.rewardBars["action_3.reward_0"].selected, false, "not selected n1");
    fc.assert(ch.rewardBars["action_3.reward_1"].selected, false, "not selected o1");
    fc.assert(ch.rewardBars["action_3.reward_2"].selected, false, "not selected p1");

    // verify selecting another single bar clears prior selection
    ch.selectSingleRewardBar("action_2.reward_0");
    fc.assert(ch.getRewardBarSelectionCount(), 1, "selectionCount 2");

    fc.assert(ch.rewardBars["action_0.reward_0"].selected, false, "not selected e2");
    fc.assert(ch.rewardBars["action_0.reward_1"].selected, false, "not selected f2");
    fc.assert(ch.rewardBars["action_0.reward_2"].selected, false, "not selected g2");

    fc.assert(ch.rewardBars["action_1.reward_0"].selected, false, "not selected h2");
    fc.assert(ch.rewardBars["action_1.reward_1"].selected, false, "not selected i2");
    fc.assert(ch.rewardBars["action_1.reward_2"].selected, false, "not selected j2");

    fc.assert(ch.rewardBars["action_2.reward_0"].selected, true, "is selected k2");//<<--
    fc.assert(ch.rewardBars["action_2.reward_1"].selected, false, "not selected l2");
    fc.assert(ch.rewardBars["action_2.reward_2"].selected, false, "not selected m2");

    fc.assert(ch.rewardBars["action_3.reward_0"].selected, false, "not selected n2");
    fc.assert(ch.rewardBars["action_3.reward_1"].selected, false, "not selected o2");
    fc.assert(ch.rewardBars["action_3.reward_2"].selected, false, "not selected p2");

    // selecting already selected bar changes nothing
    ch.selectSingleRewardBar("action_2.reward_0");
    fc.assert(ch.getRewardBarSelectionCount(), 1, "selectionCount 3");

    fc.assert(ch.rewardBars["action_0.reward_0"].selected, false, "not selected e3");
    fc.assert(ch.rewardBars["action_0.reward_1"].selected, false, "not selected f3");
    fc.assert(ch.rewardBars["action_0.reward_2"].selected, false, "not selected g3");

    fc.assert(ch.rewardBars["action_1.reward_0"].selected, false, "not selected h3");
    fc.assert(ch.rewardBars["action_1.reward_1"].selected, false, "not selected i3");
    fc.assert(ch.rewardBars["action_1.reward_2"].selected, false, "not selected j3");

    fc.assert(ch.rewardBars["action_2.reward_0"].selected, true, "is selected k3");//<<--
    fc.assert(ch.rewardBars["action_2.reward_1"].selected, false, "not selected l3");
    fc.assert(ch.rewardBars["action_2.reward_2"].selected, false, "not selected m3");

    fc.assert(ch.rewardBars["action_3.reward_0"].selected, false, "not selected n3");
    fc.assert(ch.rewardBars["action_3.reward_1"].selected, false, "not selected o3");
    fc.assert(ch.rewardBars["action_3.reward_2"].selected, false, "not selected p3");
    //
    // test multi-select
    //
    fc.setCase("multi-select");

    // add second bar
    ch.multiSelectRewardBar("action_3.reward_2");
    fc.assert(ch.getRewardBarSelectionCount(), 2, "selectionCount 0");

    fc.assert(ch.rewardBars["action_0.reward_0"].selected, false, "not selected e0");
    fc.assert(ch.rewardBars["action_0.reward_1"].selected, false, "not selected f0");
    fc.assert(ch.rewardBars["action_0.reward_2"].selected, false, "not selected g0");

    fc.assert(ch.rewardBars["action_1.reward_0"].selected, false, "not selected h0");
    fc.assert(ch.rewardBars["action_1.reward_1"].selected, false, "not selected i0");
    fc.assert(ch.rewardBars["action_1.reward_2"].selected, false, "not selected j0");

    fc.assert(ch.rewardBars["action_2.reward_0"].selected, true, "is selected k0");// <<--
    fc.assert(ch.rewardBars["action_2.reward_1"].selected, false, "not selected l0");
    fc.assert(ch.rewardBars["action_2.reward_2"].selected, false, "not selected m0");

    fc.assert(ch.rewardBars["action_3.reward_0"].selected, false, "not selected n0");
    fc.assert(ch.rewardBars["action_3.reward_1"].selected, false, "not selected o0");
    fc.assert(ch.rewardBars["action_3.reward_2"].selected, true, "is selected p0");//<<--

    // add third bar
    ch.multiSelectRewardBar("action_0.reward_0");
    fc.assert(ch.getRewardBarSelectionCount(), 3, "selectionCount 1");

    fc.assert(ch.rewardBars["action_0.reward_0"].selected, true, "is selected e1"); //<<--
    fc.assert(ch.rewardBars["action_0.reward_1"].selected, false, "not selected f1");
    fc.assert(ch.rewardBars["action_0.reward_2"].selected, false, "not selected g1");

    fc.assert(ch.rewardBars["action_1.reward_0"].selected, false, "not selected h1");
    fc.assert(ch.rewardBars["action_1.reward_1"].selected, false, "not selected i1");
    fc.assert(ch.rewardBars["action_1.reward_2"].selected, false, "not selected j1");

    fc.assert(ch.rewardBars["action_2.reward_0"].selected, true, "is selected k1");// <<--
    fc.assert(ch.rewardBars["action_2.reward_1"].selected, false, "not selected l1");
    fc.assert(ch.rewardBars["action_2.reward_2"].selected, false, "not selected m1");

    fc.assert(ch.rewardBars["action_3.reward_0"].selected, false, "not selected n1");
    fc.assert(ch.rewardBars["action_3.reward_1"].selected, false, "not selected o1");
    fc.assert(ch.rewardBars["action_3.reward_2"].selected, true, "is selected p1");//<<--

    // remove one
    ch.multiSelectRewardBar("action_2.reward_0");
    fc.assert(ch.getRewardBarSelectionCount(), 2, "selectionCount 2");

    fc.assert(ch.rewardBars["action_0.reward_0"].selected, true, "is selected e2"); //<<--
    fc.assert(ch.rewardBars["action_0.reward_1"].selected, false, "not selected f2");
    fc.assert(ch.rewardBars["action_0.reward_2"].selected, false, "not selected g2");

    fc.assert(ch.rewardBars["action_1.reward_0"].selected, false, "not selected h2");
    fc.assert(ch.rewardBars["action_1.reward_1"].selected, false, "not selected i2");
    fc.assert(ch.rewardBars["action_1.reward_2"].selected, false, "not selected j2");

    fc.assert(ch.rewardBars["action_2.reward_0"].selected, false, "not selected k2");
    fc.assert(ch.rewardBars["action_2.reward_1"].selected, false, "not selected l2");
    fc.assert(ch.rewardBars["action_2.reward_2"].selected, false, "not selected m2");

    fc.assert(ch.rewardBars["action_3.reward_0"].selected, false, "not selected n2");
    fc.assert(ch.rewardBars["action_3.reward_1"].selected, false, "not selected o2");
    fc.assert(ch.rewardBars["action_3.reward_2"].selected, true, "is selected p2");//<<--

    
    // saliency map selection
    fc.setCase("saliency highlighting");
    ch.clearRewardBarSaliencyHighlightSelections();
    
    fc.assert(ch.rewardBars["action_0.reward_0"].saliencyMapSelected, false, "not selected e0");
    fc.assert(ch.rewardBars["action_0.reward_1"].saliencyMapSelected, false, "not selected f0");
    fc.assert(ch.rewardBars["action_0.reward_2"].saliencyMapSelected, false, "not selected g0");

    fc.assert(ch.rewardBars["action_1.reward_0"].saliencyMapSelected, false, "not selected h0");
    fc.assert(ch.rewardBars["action_1.reward_1"].saliencyMapSelected, false, "not selected i0");
    fc.assert(ch.rewardBars["action_1.reward_2"].saliencyMapSelected, false, "not selected j0");

    fc.assert(ch.rewardBars["action_2.reward_0"].saliencyMapSelected, false, "not selected k0");
    fc.assert(ch.rewardBars["action_2.reward_1"].saliencyMapSelected, false, "not selected l0");
    fc.assert(ch.rewardBars["action_2.reward_2"].saliencyMapSelected, false, "not selected m0");

    fc.assert(ch.rewardBars["action_3.reward_0"].saliencyMapSelected, false, "not selected n0");
    fc.assert(ch.rewardBars["action_3.reward_1"].saliencyMapSelected, false, "not selected o0");
    fc.assert(ch.rewardBars["action_3.reward_2"].saliencyMapSelected, false, "not selected p0");

    // highlight one
    ch.highlightRewardBarSaliencyMap("action_3.reward_0");
    fc.assert(ch.rewardBars["action_0.reward_0"].saliencyMapSelected, false, "not selected e1");
    fc.assert(ch.rewardBars["action_0.reward_1"].saliencyMapSelected, false, "not selected f1");
    fc.assert(ch.rewardBars["action_0.reward_2"].saliencyMapSelected, false, "not selected g1");

    fc.assert(ch.rewardBars["action_1.reward_0"].saliencyMapSelected, false, "not selected h1");
    fc.assert(ch.rewardBars["action_1.reward_1"].saliencyMapSelected, false, "not selected i1");
    fc.assert(ch.rewardBars["action_1.reward_2"].saliencyMapSelected, false, "not selected j1");

    fc.assert(ch.rewardBars["action_2.reward_0"].saliencyMapSelected, false, "not selected k1");
    fc.assert(ch.rewardBars["action_2.reward_1"].saliencyMapSelected, false, "not selected l1");
    fc.assert(ch.rewardBars["action_2.reward_2"].saliencyMapSelected, false, "not selected m1");

    fc.assert(ch.rewardBars["action_3.reward_0"].saliencyMapSelected, true, "is selected n1");//<<--
    fc.assert(ch.rewardBars["action_3.reward_1"].saliencyMapSelected, false, "not selected o1");
    fc.assert(ch.rewardBars["action_3.reward_2"].saliencyMapSelected, false, "not selected p1");

    // highlight different one clears old selection
    ch.highlightRewardBarSaliencyMap("action_1.reward_1");
    fc.assert(ch.rewardBars["action_0.reward_0"].saliencyMapSelected, false, "not selected e2");
    fc.assert(ch.rewardBars["action_0.reward_1"].saliencyMapSelected, false, "not selected f2");
    fc.assert(ch.rewardBars["action_0.reward_2"].saliencyMapSelected, false, "not selected g2");

    fc.assert(ch.rewardBars["action_1.reward_0"].saliencyMapSelected, false, "not selected h2");
    fc.assert(ch.rewardBars["action_1.reward_1"].saliencyMapSelected, true, "is selected i2");//<<--
    fc.assert(ch.rewardBars["action_1.reward_2"].saliencyMapSelected, false, "not selected j2");

    fc.assert(ch.rewardBars["action_2.reward_0"].saliencyMapSelected, false, "not selected k2");
    fc.assert(ch.rewardBars["action_2.reward_1"].saliencyMapSelected, false, "not selected l2");
    fc.assert(ch.rewardBars["action_2.reward_2"].saliencyMapSelected, false, "not selected m2");

    fc.assert(ch.rewardBars["action_3.reward_0"].saliencyMapSelected, false, "not selected n2");
    fc.assert(ch.rewardBars["action_3.reward_1"].saliencyMapSelected, false, "not selected o2");
    fc.assert(ch.rewardBars["action_3.reward_2"].saliencyMapSelected, false, "not selected p2");
}

function runChartDataGeometryTests(failureChecker) {
    // test geometry
    var ch = wrapChartData(buildDummyChart(3));

    // action names are action_0, action_1...action_3
    // rewardnames are action action_0.reward_0, action_0.reward_1

    
    // 320 == canvasHeight
    // 816 == canvasWidth,
    // 204 widthAvailableForGroup == canvasWidth / actionCount 
    // x axis of chart sits at y == canvasHeight/2
    // biggest bar should take up .75 of canvasHeight/2  (120 == 3/4 * ch/2)
    // 6 == groupWidthMargin = widthAvailableForGroup * .8 ) / 2
    // 192 == widthAvailableForRewardBars = widthAvailableForGroup - 2 * groupWidthMargin
    // 16 == rewardBarWidthAvailable = widthAvailableForRewardBars / rewardBarCount

    // 4 == rewardSpacerWidth = rewardBarWidthAvailable * .1
    // 20 == rewardBarWidth = rewardBarWidthAvailable - 2* rewardSpacerWidth

    // bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth *( j + 1) + j *(rewardBarWidth)
    // bar.originY = canvasHeight/2
    // coords depend on sign of reward

    // test single-select 
    fc.setCase("");
    ch.canvasHeight = 320.0;
    ch.canvasWidth = 816.0;
    ch.positionRewardBar(ch.rewardBars["action_0.reward_0"]);
    fc.assert(ch.rewardBars["action_0.reward_0"].originX, 10, "originX 0");// 6 + 4*1 + 0
    fc.assert(ch.rewardBars["action_0.reward_0"].originY, 160, "originX 0");// 160 
    fc.assert(ch.rewardBars["action_0.reward_0"].height, 10.0, "originX 0");
    fc.assert(ch.rewardBars["action_0.reward_0"].width, 20, "originX 0");

    // bar.originX = i*widthAvailableForGroup + groupWidthMargin + rewardSpacerWidth *( j + 1) + j *(rewardBarWidth)
    ch.positionRewardBar(ch.rewardBars["action_0.reward_1"]);
    fc.assert(ch.rewardBars["action_0.reward_1"].originX, 34.0, "originX 0");//  6 + 4 *( 2) + 20 == 34
    fc.assert(ch.rewardBars["action_0.reward_1"].originY, 160.0, "originX 0");// 160 
    fc.assert(ch.rewardBars["action_0.reward_1"].height, -20.0, "originX 0");
    fc.assert(ch.rewardBars["action_0.reward_1"].width, 20.0, "originX 0");

    ch.positionRewardBar(ch.rewardBars["action_0.reward_2"]);
    fc.assert(ch.rewardBars["action_0.reward_2"].originX, 58.0, "originX 0");//  6 + 4 *( 3) + 40 == 58
    fc.assert(ch.rewardBars["action_0.reward_2"].originY, 160.0, "originX 0");// 160 
    fc.assert(ch.rewardBars["action_0.reward_2"].height, 30.0, "originX 0");
    fc.assert(ch.rewardBars["action_0.reward_2"].width, 20.0, "originX 0");

    ch.positionRewardBar(ch.rewardBars["action_1.reward_0"]);
    fc.assert(ch.rewardBars["action_1.reward_0"].originX, 214.0, "originX 0");// 204 + 6 + 4 *( 1) + 0 == 214
    fc.assert(ch.rewardBars["action_1.reward_0"].originY, 160.0, "originX 0");// 160 
    fc.assert(ch.rewardBars["action_1.reward_0"].height, 20.0, "originX 0");
    fc.assert(ch.rewardBars["action_1.reward_0"].width, 20.0, "originX 0");

    ch.positionRewardBar(ch.rewardBars["action_2.reward_1"]);
    fc.assert(ch.rewardBars["action_2.reward_1"].originX, 442.0, "originX 0");// 408 + 6 + 4 *( 2) + 20 == 442
    fc.assert(ch.rewardBars["action_2.reward_1"].originY, 160.0, "originX 0");// 160 
    fc.assert(ch.rewardBars["action_2.reward_1"].height, -60.0, "originX 0");
    fc.assert(ch.rewardBars["action_2.reward_1"].width, 20.0, "originX 0");

    ch.positionRewardBar(ch.rewardBars["action_3.reward_2"]);
    fc.assert(ch.rewardBars["action_3.reward_2"].originX, 670.0, "originX 0");// 612 + 6 + 4 *( 3) + 40 == 670
    fc.assert(ch.rewardBars["action_3.reward_2"].originY, 160.0, "originX 0");// 160 
    fc.assert(ch.rewardBars["action_3.reward_2"].height, 120.0, "originX 0");
    fc.assert(ch.rewardBars["action_3.reward_2"].width, 20.0, "originX 0");

}

function runChartDataTextTests(failureChecker) {
  // test saliency row label generation

  fc.assert(cm.getSaliencyRowLabels(failureChecker), [["this is saliency for best action Q1"]], "saliency row labels");

  // test tooltip text generation
}

function runChartDataColorTests(failureChecker) {
    // color assignment tests
}

function runChartDataRankingTests(failureChecker) {

    fc.assert(cm.getBar("Q1.combined").rank,0);
}