


// function initSaliencyContainers(){
// 	var saliency = activeExplanationPoint.getSaliency();
//     saliencyLookupMap = saliency.getSaliencyMapMap();
// 	populateSaliencyQuestionSelector();
// 	createSaliencyContainers();
// }

// function restoreSaliencyIfReturningToTab(step){
//     if (isTargetStepSaliencyVisible()){
//         currentExplManager.saliencyVisible = true;
//         var targetStep = getTargetStepFromReturnInfo();
//         if (targetStep != undefined && targetStep == step) {
//             processWhatClick();
//             if (isTargetStepSaliencyCombined()){
//                 $("#relevance-combined-radio").click();
//             }
//             else {
//                 $("#relevance-detailed-radio").click();
//             }
//             var mapIdToHighlight = getTargetStepSaliencyMapToHighlight();
//             if (mapIdToHighlight!= undefined) {
//                 activeSaliencyDisplayManager.showSaliencyMapOutline(mapIdToHighlight);
//             }
//             return true;
//         }
//     }
//     return false;
// }
