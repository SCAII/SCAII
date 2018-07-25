function runChartDataTextTests(failureChecker) {
  // test saliency row label generation
  var ch = wrapChartData(buildDummyChart(3));

  ch = textImplementation(ch);

  fc.assert(cm.getSaliencyRowLabels(failureChecker), [["this is saliency for best action Q1"]], "saliency row labels");

  // test tooltip text generation
}