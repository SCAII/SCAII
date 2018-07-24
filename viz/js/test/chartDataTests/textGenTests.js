function runChartDataTextTests(failureChecker) {
  // test saliency row label generation

  fc.assert(cm.getSaliencyRowLabels(failureChecker), [["this is saliency for best action Q1"]], "saliency row labels");

  // test tooltip text generation
}