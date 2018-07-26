function runChartDataTextTests(failureChecker) {
  // test saliency row label generation
  var cm = addUtilityFunctions(buildDummyChart(3));

  cm = textImplementation(cm);

  fc.setCase("test Title");
  fc.assert(ch.title, "Title", "title text test");

  fc.setCase("labels for action");
  fc.assert(cm.getActionLabels(failureChecker), [["stuff"]], "action label test");

  fc.setCase("number of reward value markers");
  //???

  fc.setCase("legend texts are the reward names");
  //Do we have to check this?? why not just pull from rewardBarNames???
  fc.assert(cm.rewardBarNames[0], cm.legendBarNames[0], "legend names == reward bar names")

  var salRowLabel = cm.getSaliencyRowLabels();

  fc.assert(salRowLabel[0][0], ["text here?"], "saliency row label 0.0")
  fc.assert(cm.getSaliencyRowLabels(failureChecker), [["this is saliency for best action Q1"]], "saliency row labels");

  // test tooltip text generation
}