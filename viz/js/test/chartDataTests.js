// NEW_CHART, NEW_SAL  selection values as [ "Q1","*"] [ "Q1","rewardX"] NIX THIS , use ids as :   id == "Q1.combined"  "Q1.rewardX"
function runChartDataTests(failureChecker) {
    var fc = failureChecker;

    var chartData = getChartData();


    // 
    // copy the single-select tests here

    // copy the multi-select tests here

    fc.assert(cm.getSaliencyRowLabels(), [["this is saliency for best action Q1"]], "saliency row labels");

    cm.setSaliencyMapToHighlight("saliencyMap_xyz");  //Test this for T1

    fc.assert(cm.getSaliencyRowLabels(), [["this is saliency for best action Q1"]], "saliency row labels");

    cm.selectSingleBar("Q1.combined");   // Test this for T2
    cm.setFilename("Tutorial.scr");      // Test this for T2
    fc.assert(cm.getBar("Q1.combined").rank,0);
    
    fc.assert(cm.getSelectedBarCount(), 1, "selected bar count");
    fc.assert(cm.getSelectedBars()[0][0] == "Q1", "selected action");
    fc.assert(cm.getSelectedBars()[0][1] == "*", "selected reward");
    //
    fc.setCase("single-select");
    cm.selectSingleBar([["Q1","*"]]);  //T2
    //
    fc.setCase("multi-select");
    cm.selectAdditionalBar([["Q2","*"]]); //T2
    fc.assert(cm.getBar(["Q2","*"]).selected,true,"selectAdditionalBar");    // NEW_CHART is bar selected NIX

    cm.selectAdditionalBar([["Q3","*"]]); //T2
    fc.assert("X","Y","selectAdditionalBar");
    cm.unselectBar([["Q2","*"]]); // T2
    fc.assert("X","Y","unselectBar");   
}
