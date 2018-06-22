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

    sqm.windowRangeForStep = {};
    sqm.questionWasAnswered = false;
    sqm.activeRange = undefined;
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
        var allTypeInfo = question.getQuestionType();
        var typeParts = allTypeInfo.split(":");
        qu.questionType = typeParts[0];
        if (qu.questionType == "waitForClick"){
            qu.regionsToAllow = typeParts[1].split("_");
            qu.clickQuestionText = typeParts[2];
        }
        qu.answers = answers;
        sqm.questionIds.push(questionId);
        sqm.questionMap[questionId] = qu;
    }
    sqm.squim = getStudyQuestionIndexManager(sqm.questionIds);
    studyQuestionIndexManager = sqm.squim;
    sqm.windowRangeForStep = getRanges(sqm.squim.getDecisionPointSteps());

    sqm.isAtEndOfRange = function(step) {
        if (this.activeRange != undefined){
            var endOfRange = this.activeRange[1];
            // stop one prior to the true end to avoid showing the blank gameboard
            //if (step >= endOfRange) { 
            if (step >= endOfRange - 1) { 
                // if we are at end of game, don't stop two shy
                if (step == sessionIndexManager.getMaxIndex()- 1){
                    return false;
                }
                // otherwise, stop two shy to avoid blank gameboard
                return true;
            }
        }
        return false;
    }
    
    sqm.isBeyondCurrentRange = function(step) {
        if (this.activeRange != undefined){
            var endOfRange = this.activeRange[1];
            // stop one prior to the true end to avoid showing the blank gameboard
            //if (step >= endOfRange) { 
            if (step >endOfRange) { 
                return true;
            }
        }
        return false;
    }

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
    
    // sqm.jumpBackToCurrentDecisionPoint = function() {
    //     var targetStep = this.steps[this.currentStepIndex];
    //     var args = ["" + nextStep];
    //     var userCommand = new proto.scaii.common.UserCommand;
    //     userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
    //     userCommand.setArgsList(args);
    //     stageUserCommand(userCommand);
    //     controlsManager.userJumped();
    // }

    sqm.poseCurrentQuestion = function() {
        var qid = this.squim.getCurrentQuestionId();
        if (this.mostRecentlyPosedQuestion != qid){
            this.mostRecentlyPosedQuestion = qid;
            stateMonitor.setUserAction("showQuestion:"+ qid);
            stateMonitor.setQuestionId(qid);
            var qu = this.questionMap[qid];
            this.renderer.poseQuestion(qu, this.squim.getCurrentDecisionPointNumber(), this.squim.getCurrentStep());
        }
    }

    sqm.clearTimelineBlocks = function() {
        $("#left-block-div").remove();
        $("#right-block-div").remove();
    }

    sqm.blockClicksOutsideRange = function() {
        var step = this.squim.getCurrentStep();
        if (step == undefined || step == 'summary'){
            return;
        }
        var rangePair = this.windowRangeForStep[step];
        this.activeRange = rangePair;
        var maxIndex = sessionIndexManager.getMaxIndex();
        var widthOfTimeline = expl_ctrl_canvas.width - 2*timelineMargin;

        // get offset of explanation-control-panel relative to document
        var ecpOffset = $("#explanation-control-panel").offset();
        var x1 = ecpOffset.left;
        // calculate left window edge position
        var leftValueOnTimeline = Math.floor((rangePair[0] / maxIndex ) * 100);
        var x2 = ecpOffset.left + timelineMargin + (leftValueOnTimeline / 100) * widthOfTimeline;
        // shift x2 to the left to fully expose the current DecisionPoint;
        var currentIndex = sessionIndexManager.getCurrentIndex();
        if (currentIndex == rangePair[0]) {
            x2 = x2 - explanationPointBigDiamondHalfWidth;
        }
        else {
            x2 = x2 - explanationPointSmallDiamondHalfWidth;
        }
        
        // calculate right window edge position
        var rightValueOnTimeline = Math.floor(((Number(rangePair[1]) + 1)/ maxIndex ) * 100);
        var x3 = ecpOffset.left + timelineMargin + (rightValueOnTimeline / 100) * widthOfTimeline;
        // shift x3 to the left to fully cover the next DecisionPoint
        if (!this.squim.isAtLastDecisionPoint()) {
            x3 = x3 - explanationPointSmallDiamondHalfWidth;
        }
        var x4 = expl_ctrl_canvas.width;
        

        var y = ecpOffset.top;
        var width1 = x2 - x1;
        var width2 = x4 - x3;
        var height = $("#explanation-control-panel").height();
        // make blocking div from 0 -> rightXofLeftBlock
        var gradientBars = "repeating-linear-gradient(135deg,rgba(100, 100, 100, 0.1),rgba(100, 100, 100, 0.3) 20px,rgba(100, 100, 100, 0.6) 20px,rgba(100, 100, 100, 0.7) 20px)";
        var leftBlockDiv = document.createElement("DIV");
        leftBlockDiv.setAttribute("id", "left-block-div");
        leftBlockDiv.setAttribute("style", "position:absolute;left:" + x1 + "px;top:" + y + "px;z-index:" + zIndexMap["clickBlockerRectangle"] + ";background:" + gradientBars + ";width:" + width1 + "px;height:" + height + "px;");
        //$("body").append(leftBlockDiv);


        // make blocking div from leftXofRightBlock -> expl_ctrl_canvas.width
        var rightBlockDiv = document.createElement("DIV");
        rightBlockDiv.setAttribute("id", "right-block-div");
        rightBlockDiv.setAttribute("style", "position:absolute;left:" + x3 + "px;top:" + y + "px;z-index:" + zIndexMap["clickBlockerRectangle"] + ";background:" + gradientBars + ";width:" + width2 + "px;height:" + height + "px;");
        rightBlockDiv.onclick = function(e) {
            if (isStudyQuestionMode()){
                targetClickHandler(e,"clickTimelineBlocker:NA");
                regionClickHandlerGameArea(e);
                userActionMonitor.globalClick(e.clientX, e.clientY);
            }
        }
        
        $("body").append(rightBlockDiv);
    }
    return sqm;
}

function getRanges(steps) {
    var stepRangePairs = {};
    for (var i = 0; i < steps.length; i++) {
        if (i == steps.length - 1) {
            // looking at the final entry - pair this one with the max index
            var range_pair = [ Number(steps[i]), Number(sessionIndexManager.getMaxIndex()) ];
            stepRangePairs[steps[i]] = range_pair;
        }
        else {
            // prior to last one, we make a pair with the step prior to the next question's step
            var range_pair = [ Number(steps[i]), Number(steps[i+1]) - 1 ];
            stepRangePairs[steps[i]] = range_pair;
        }
    }
    console.log(stepRangePairs)
    return stepRangePairs;
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
    var renderer = studyQuestionManager.renderer;
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
        if (!isTutorial()){
            followupAnswer = renderer.getCurrentFollowupAnswer();
        }
    }
    targetClickHandler(e,"answerQuestion:"+ currentStep + "." + currentQuestionIndexAtStep + "_" + answer + "_" + followupAnswer + "_(" + clickInfo + ")");

    renderer.forgetQuestion();
    if (studyQuestionIndexManager.hasMoreQuestionsAtThisStep()) {
        renderState(gameboard_ctx, gameboard_canvas, masterEntities, gameScaleFactor, 0, 0, shapePositionMapForContext["game"], true);
        studyQuestionManager.poseNextQuestion();
    }
    else {
        if (studyQuestionIndexManager.hasMoreQuestions()){
            renderer.renderCueAndArrowToPlayButton();
        }
        studyQuestionManager.questionWasAnswered = true;
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
}


// function chooseNextQuestionAfterStep(step) {
//     // clear current question
//     $('#q-and-a-div').empty();

//     if (step == 'summary'){
//         renderer.poseThankYouScreen();
//     } 
//     else {
//         // pose next question
//         studyQuestionManager.poseNextQuestion();
//     }
// }
