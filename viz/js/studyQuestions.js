 function isStudyQuestionMode() {
    return studyQuestionManager != undefined;
}

function clearStudyQuestionMode() {
    $('#q-and-a-div').empty();
    $("#left-block-div").remove();
    $("#right-block-div").remove();
    studyQuestionManager = undefined;
}
function getStudyQuestionManager(questions, userId, treatmentId) {
    var sqm = {};
    sqm.renderer = getStudyQuestionRenderer();
    sqm.userId = userId;
    sqm.userIdHasBeenSet = false;
    sqm.treatmentId = treatmentId;
    
    sqm.questionMap = {};
    sqm.questionIds = [];
    sqm.questionWasAnswered = false;
    sqm.mostRecentlyPosedQuestion = undefined;

    for (var i in questions){
        var question = questions[i];
        var step = question.getStep();
        var questionIndexForStep = question.getQuestionIdForStep();;
        var questionId = getQuestionId(step, questionIndexForStep);
        var answers = question.getAnswersList();
        var qu = {};
        qu.step = step;
        qu.questionIndexForStep = questionIndexForStep;
        qu.questionId = questionId;
        qu.questionText= question.getQuestion();;
        qu.isClickCollectingQuestion = function() {
            return ((this.questionType == "waitForClick") || (this.questionType =="waitForPredictionClick"));
        }
        var allTypeInfo = question.getQuestionType();
        var typeParts = allTypeInfo.split(":");
        qu.questionType = typeParts[0];
        if (qu.isClickCollectingQuestion()){
            qu.regionsToAllow = typeParts[1].split("_");
            qu.clickQuestionText = typeParts[2];
        }
        qu.answers = answers;
        sqm.questionIds.push(questionId);
        sqm.questionMap[questionId] = qu;
    }
    sqm.squim = getStudyQuestionIndexManager(sqm.questionIds);
    studyQuestionIndexManager = sqm.squim;
    sqm.accessManager = getQuestionAccessManager(sqm.squim.getDecisionPointSteps(), sessionIndexManager.getMaxIndex());


    sqm.hasShownUserId = function() {
        return this.userIdHasBeenSet;
    }
  
    sqm.configureForCurrentStep = function() {
        var currentStep = sessionIndexManager.getCurrentIndex();
        if (!this.hasShownUserId()) {
            this.renderer.poseUserIdQuestion();
        }
        else if (this.squim.hasQuestionForStep(currentStep)) {
            this.poseCurrentQuestion();
        }
    }

    sqm.hasMoreQuestions = function() {
        return this.squim.hasMoreQuestions();
    }

    sqm.isFinalQuestionAtDecisionPoint = function(id){
        var step = getStepFromQuestionId(id);
        var index = this.questionIds.indexOf(id);
        if (index == -1) {
            // just move on - shouldn't happen
            return false;
        }
        if (step == "summary"){
            return false;
        }
        if (index == this.questionIds.length - 1){
            // it'sthe last question which is not a summary question, which should not happen, but coding for completeness
            return true;
        }
        else {
            var nextId = this.questionIds[index + 1];
            var stepFromNextId = getStepFromQuestionId(nextId);
            if (stepFromNextId == step) {
                return false;
            }
            return true;
        }
    }
    sqm.poseFirstQuestion = function() {
        var step = this.squim.getCurrentStep();
        var args = ["" + step];
        var userCommand = new proto.scaii.common.UserCommand;
        userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
        userCommand.setArgsList(args);
        stageUserCommand(userCommand);
        controlsManager.userJumped();
        this.poseCurrentQuestion();
    }
    
    sqm.poseNextQuestion = function() {
        var priorStep = this.squim.getCurrentStep();
        this.squim.next();
        var newStep = this.squim.getCurrentStep();
        if (priorStep != newStep && !this.squim.isCurrentQuestionSummary()) {
            // move to next step
            var args = ["" + newStep];
            var userCommand = new proto.scaii.common.UserCommand;
            userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
            userCommand.setArgsList(args);
            stageUserCommand(userCommand);
            controlsManager.userJumped();
        }
        this.poseCurrentQuestion();
    }
    
    sqm.poseCurrentQuestion = function() {
        var qid = this.squim.getCurrentQuestionId();
        if (this.mostRecentlyPosedQuestion != qid){
            this.mostRecentlyPosedQuestion = qid;
            var logLine = templateMap["showQuestion"];
            logLine = logLine.replace("<SHOW_Q>", qid);
            stateMonitor.setUserAction(logLine);
            stateMonitor.setQuestionId(qid);
            var qu = this.questionMap[qid];
            var currentStep = this.squim.getCurrentStep();
            this.renderer.poseQuestion(qu, this.squim.getCurrentDecisionPointNumber(), currentStep);

            this.accessManager.setQuestionState("posed");
            this.accessManager.setQuestionType(qu.questionType);
            this.accessManager.setQuestionStep(currentStep);
            if (this.squim.isStepPriorToLastDecisionPoint(currentStep)) {
                this.accessManager.setRelationToFinalDecisionPoint("before");
            }
            else {
                this.accessManager.setRelationToFinalDecisionPoint("atOrPast");
            }
            this.accessManager.express();
            renderDecisionPointLegend();
            // wait before show first question at DP, but not on DP1
            if (currentStep != "summary" && currentStep != 1){
                var questionIndex = qid.split(".")[1];
                if (questionIndex == 0){
                    this.makeUserWaitForInstructions();
                }
            }
        }
    }

    sqm.makeUserWaitForInstructions = function(){
        this.renderer.renderWaitScreen();
    }
    
    sqm.isOkToDisplayActionName = function(step){
        var currentQuestionId = this.squim.getCurrentQuestionId();
        var currentStep = currentQuestionId.split(".")[0];
        if (currentStep == "summary"){
            // all can be revealed once we make it to summary question
            return true;
        }
        var currentQuestionIndex = currentQuestionId.split(".")[1];
        if (step < currentStep) {
            // any waitForPredictionClick questions in the past would have been answered
            return true;
        }
        if (step == currentStep){
            if (currentQuestionIndex != 0){
                return true;
            }
            // first question, check if its a waitForClickPrediction
            var qu = this.questionMap[currentQuestionId];
            if (qu.questionType == "waitForPredictionClick"){
                return false;
            }
            return true;
        }
        else {
            // step > currentQuestionId's step...
            // Any future waitForPredictionClick questions need to be hidden
            if (this.doesStepHaveWaitForPredictionClickQuestion(step)){
                return false;
            }
            return true;
        }
    }

    sqm.doesStepHaveWaitForPredictionClickQuestion = function(step) {
        if (step == "summary"){
            return false;
        }
        for (var i in this.questionIds){
            var qId = this.questionIds[i];
            var curStep = qId.split(".")[0];
            if (curStep == step){
                var qu = this.questionMap[qId];
                if (qu.questionType == "waitForPredictionClick"){
                    return true;
                }
            }
        }
        return false;
    }

    sqm.getExplanationTitles = function(explanationSteps, explanationTitles){
        var result = [];
        for (var i in explanationSteps){
            var step = explanationSteps[i];
            var title = explanationTitles[i];
            if (this.isOkToDisplayActionName(step)){
                result[i] = title;
            }
            else {
                result[i] = "---";
            }
        }
        return result;
    }

    return sqm;
}


function acceptUserId() {
    var userId = studyQuestionManager.userId;
    if (userId == undefined || userId == "") {
        alert('No userId specified.  Please specify a userId and then click "Next".');
    }
    else {
        $("#user-id-div").remove();
        studyQuestionManager.userIdHasBeenSet = true;
        studyQuestionManager.poseFirstQuestion();
    }
    
}
function acceptAnswer(e) {
    var sqMan = studyQuestionManager;
    var renderer = sqMan.renderer;
    //renderer.removeMissingClickInfoMessage();
    // block if no answer specified
    if (renderer.controlsWaitingForClick.length != 0) {
        if (renderer.clickInfoFromUserActionMonitor == undefined) {
            renderer.expressMissingClickInfoMessage();
            return;
        }
    }
    var answer = renderer.getCurrentAnswer();
    
    if (answer == undefined || answer == '') {
        alert('No answer chosen for the current question.  Please specify an answer and then click "Next Question".');
        return;
    }
    // gather answer, send to backend
    var currentStep = studyQuestionIndexManager.getCurrentStep();
    var questionId = studyQuestionIndexManager.getCurrentQuestionId();
    var currentQuestionIndexAtStep = getQuestionIndexFromQuestionId(questionId);
    var clickInfo = renderer.collectClickInfo();
    userActionMonitor.clickListener = undefined;
    
    if (clickInfo == undefined){
        clickInfo = "NA";
    }
    var followupAnswer = "NA";
    if (!(currentStep == 'summary')){
        if (!isTutorial() && sqMan.isFinalQuestionAtDecisionPoint(questionId)){
            followupAnswer = renderer.getCurrentFollowupAnswer();
        }
    }
    var logLine = templateMap["button-save"];
    logLine = logLine.replace("<CLCK_STEP>", currentStep);
    logLine = logLine.replace("<Q_INDEX_STEP>", currentQuestionIndexAtStep);
    logLine = logLine.replace("<USR_TXT_Q1>", answer);
    logLine = logLine.replace("<USR_TXT_Q2>", followupAnswer);
    logLine = logLine.replace("<USR_CLCK_Q>", clickInfo);
    targetClickHandler(e, logLine);
    //targetClickHandlerOld(e,"answerQuestion:"+ currentStep + "." + currentQuestionIndexAtStep + "_" + answer + "_" + followupAnswer + "_(" + clickInfo + ")");

    renderer.forgetQuestion();
    if (studyQuestionIndexManager.hasMoreQuestionsAtThisStep()) {
        renderState(gameboard_canvas, masterEntities, gameScaleFactor, 0, 0, true);
        sqMan.poseNextQuestion();
    }
    else {
        if (studyQuestionIndexManager.hasMoreQuestions()){
            if (getStepFromQuestionId(sqMan.mostRecentlyPosedQuestion) == "summary"){
                renderer.renderCueAndArrowToPlayButton();
            }
            else {
                studyQuestionManager.renderer.renderCueAndArrowToPlayButton();
            }
            
        }
        sqMan.questionWasAnswered = true;
        if (studyQuestionIndexManager.hasMoreQuestions()){
            // wait for play button to take us to next Decision Point
            controlsManager.enablePauseResume();
        } 
        else {
            if (!isTutorial()){
                renderer.poseThankYouScreen();
            }
        }
    }
    sqMan.accessManager.setQuestionState("answered");
    sqMan.accessManager.express();
}
