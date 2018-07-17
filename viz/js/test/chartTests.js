 //NEW_SAL sal ids looked up in bar and bar group
 //NEW_SAL default selections are made, and we need to remember that they were made already
 //NEW_SAL saliency keep alive still needed?

function runChartManagerTests(failureChecker) {
    var fc = failureChecker;
    //
    fc.setCase("normal mode defaults check");
    cm.setUserStudyMode(false);
    fc.assert(cm.state.userStudyTreatment, "NA", "userStudyTreatment");
    fc.assert(cm.state.userStudyMode, false, "userStudyMode");
    fc.assert(cm.state.saliencyVisible, false, "saliencyVisible");
    fc.assert(cm.state.chartVisible, false, "chartVisible");
    fc.assert(cm.state.chartCombined, false, "chartCombined");

    fc.setCase("user study mode T0 defaults check");
    cm.setUserStudyMode(true);
    cm.setUserStudyTreatment("T0");
    fc.assert(cm.state.userStudyMode, false, "userStudyMode");
    fc.assert(cm.state.saliencyVisible, false, "saliencyVisible");
    fc.assert(cm.state.chartVisible, false, "chartVisible");
    fc.assert(cm.state.chartCombined, false, "chartCombined");

    //..
    //..
    //..

    fc.setCase("0");
    var cm = getChartManager();
    // NEW_SAL  userStudyMode yes/no
    cm.setUserStudyMode(true);
   // NEW_SAL  shown yes/no
    cm.setSaliencyVisible(true);
    // NEW_CHART showing or not
    cm.setChartVisible(true);
    // NEW_CHART combined or not
    cm.setChartCombined(true);
   // NEW_SAL  combined yes/no
    cm.setSaliencyCombined(true);

    // NEW_SAL  treatment# affects which saliencies to show
    cm.setTreatmentId("chartVisible.saliencyVisible");

    cm.setDefaults();
    
    // NEW_CHART, NEW_SAL  selection values as [ "Q1","*"] [ "Q1","rewardX"]
    // NEW_SAL control which saliency rows are visible
    cm.selectSingleBar([["Q1","*"]]);
    
    //NEW_SAL tutorial saliencies are randomized
    cm.setFilename("Tutorial.scr");

    //NEW_SAL user may highlight saliency map for a question
    cm.setSaliencyMapToHighlight("saliencyMap_xyz");



  
  // NEW_CHART  display mode varieties - used to have 4 due to advantage/reward and combined/vsdetailed.  But now we have ????  
 // NEW_CHART  toggling why button click shows/hides chart
  // NEW_CHART  clicking why button click shows chart
  // NEW_CHART select bars
  // NEW_CHART clear bar
   // NEW_CHART select bar
  // NEW_CHART default selections are made, and we need to remember that they were made already
  // NEW_CHART unselect bar
  // NEW_CHART is bar selected
// NEW_CHART get selectied bars

  // NEW_CHART user study yes/no
 // NEW_CHART treatment1 shows saliency but not rewards so can't rely on the "what was relevant" button
 //NEW_CHART abstain from rendering saliency and chart info until after jump completed
// NEW_CHART, NEW_SAL  selection values as [ "Q1","*"] [ "Q1","rewardX"]
  // NEW_CHART, NEW_SAL  selection values as [ "Q1","*"] [ "Q1","rewardX"]

// NEW_SAL in one mode at least, saliency maps for losing actions are smaller
        fc.assert(cm.isLosingActionsSmaller(),true,"losing actions saliency map size");

   //NEW_SAL UI friendly text to explain ranking of saliency rowxs
        fc.assert(cm.getSaliencyRowLabels(), [["this is saliency for best action Q1"]], "saliency row labels");

    //NEW_SAL tutorial saliencies are randomized
        fc.assert(cm.isSaliencyRandomized(), true, "saliency randomization");

        //NEW_SAL regular mode mouse hover shows score on map
        fc.assert(cm.isShowHoverScores(), false, "saliency hover scores");

        fc.assert(cm.getSelectedBarCount(), 1, "selected bar count");
        fc.assert(cm.getSelectedBars()[0][0] == "Q1", "selected action");
        fc.assert(cm.getSelectedBars()[0][1] == "*", "selected reward");

        fc.setCase("single-select");
        // NEW_CHART needs to support single-select
        cm.selectSingleBar([["Q1","*"]]);
        // NEW_CHART single-select on bar clears other bars

        // NEW_CHART needs to support multi-select
        fc.setCase("multi-select");
        cm.selectAdditionalBar([["Q2","*"]]);
        fc.assert("X","Y","selectAdditionalBar");
        cm.selectAdditionalBar([["Q3","*"]]);
        fc.assert("X","Y","selectAdditionalBar");
        cm.unselectBar([["Q2","*"]]);
        fc.assert("X","Y","unselectBar");

  // IMPLEMENTATION ISSUES
  //NEW_CHART detailed rewards live in the Bar messages, combined rewards are obtained by adding up Bar messages