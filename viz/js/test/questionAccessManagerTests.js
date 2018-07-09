function runQuestionAccessManagerTests() {
    // 1 plain
    // 4 waitForClick
    // 7 waitForPredictionClick
    var qam = getQuestionAccessManager([ 1, 4, 7, 10], 14);
    // plain/waitForClick/waitForPredictionClick
    qam.setQuestionStep(1); 
    qam.setQuestionType("plain");
    qam.setQuestionState("posed");
    qam.setRelationToFinalDecisionPoint("before");
    console.assert(qam.getBlockRenderState() == "blockPastRange");
    console.assert(qam.getBlockRange()[0] == 4);
    console.assert(qam.getBlockRange()[1] == 14);
    console.assert(qam.getPlayButtonState() == "enabled");

    qam.setQuestionState("answered");
    console.assert(qam.getBlockRenderState() == "blockPastRange");
    console.assert(qam.getBlockRange()[0] == 4);
    console.assert(qam.getBlockRange()[1] == 14);
    console.assert(qam.getPlayButtonState() == "enabled");
    

    qam.setQuestionStep(4);
    qam.setQuestionType("waitForClick");
    qam.setQuestionState("posed");
    console.assert(qam.getBlockRenderState() == "blockPastRange");
    console.assert(qam.getBlockRange()[0] == 7);
    console.assert(qam.getBlockRange()[1] == 14);
    console.assert(qam.getPlayButtonState() == "enabled");

    qam.setQuestionState("answered");
    console.assert(qam.getBlockRenderState() == "blockPastRange");
    console.assert(qam.getBlockRange()[0] == 7);
    console.assert(qam.getBlockRange()[1] == 14);
    console.assert(qam.getPlayButtonState() == "enabled");


    qam.setQuestionStep(7);
    qam.setQuestionType("waitForPredictionClick");
    qam.setQuestionState("posed");
    console.assert(qam.getBlockRenderState() == "blockPastStep");
    console.assert(qam.getBlockRange()[0] == 8);
    console.assert(qam.getBlockRange()[1] == 14);
    console.assert(qam.getPlayButtonState() == "disabled");
    
    qam.setQuestionState("answered");
    console.assert(qam.getBlockRenderState() == "blockPastRange");
    console.assert(qam.getBlockRange()[0] == 10);
    console.assert(qam.getBlockRange()[1] == 14);
    console.assert(qam.getPlayButtonState() == "enabled");
    


    qam.setQuestionStep(10);
    qam.setRelationToFinalDecisionPoint("atOrPast");
    qam.setQuestionType("waitForPredictionClick");
    qam.setQuestionState("posed");
    console.assert(qam.getBlockRenderState() == "blockPastStep");
    console.assert(qam.getBlockRange()[0] == 11);
    console.assert(qam.getBlockRange()[1] == 14);
    console.assert(qam.getPlayButtonState() == "disabled");
    
    qam.setQuestionState("answered");
    console.assert(qam.getBlockRenderState() == "noBlock");
    console.assert(qam.getBlockRange()[0] == "NA");
    console.assert(qam.getBlockRange()[1] == "NA");
    console.assert(qam.getPlayButtonState() == "enabled");



    qam.setQuestionStep("summary");
    qam.setQuestionState("posed");
    qam.setQuestionType("plain");
    console.assert(qam.getBlockRenderState() == "noBlock");
    console.assert(qam.getBlockRange()[0] == "NA");
    console.assert(qam.getBlockRange()[1] == "NA");
    console.assert(qam.getPlayButtonState() == "enabled");
    
    qam.setQuestionState("answered");
    qam.setQuestionType("plain");
    console.assert(qam.getBlockRenderState() == "noBlock");
    console.assert(qam.getBlockRange()[0] == "NA");
    console.assert(qam.getBlockRange()[1] == "NA");
    console.assert(qam.getPlayButtonState() == "enabled");
}