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
    sqm.hasShownUserID = false;
    sqm.treatmentId = treatmentId;
    sqm.questionForStepMap = {};
    sqm.steps = [];
    sqm.windowRangeForStep = {};
    sqm.summaryQuestion = undefined;
    sqm.summaryAnswers = undefined;
    sqm.questionWasAnswered = false;
    // init to -1 so step at index 0 will be ref'd after incrementing first time
    sqm.currentStepIndex = -1;
    sqm.stepIndexPriorToSummaryQuestion = undefined;
    sqm.activeRange = undefined;

    for (var i in questions){
        var question = questions[i];
        var step = question.getStep();
        var questionText = question.getQuestion();
        var answers = question.getAnswersList();
        if (step == 'summary'){
            sqm.summaryQuestion = questionText;
            sqm.summaryAnswers = answers;
        }
        else {
            sqm.steps.push(step);
            var qu = {};
            qu.step = step;
            qu.questionText= questionText;
            qu.answers = answers;
            sqm.questionForStepMap['step_' + step] = qu;
        }
        
    }
    sqm.windowRangeForStep = getRanges(sqm.steps);
    sqm.stepIndexPriorToSummaryQuestion = sqm.steps.length - 2;

    sqm.isAtEndOfRange = function(step) {
        if (this.activeRange != undefined){
            var endOfRange = this.activeRange[1];
            if (step >= endOfRange - 1) { 
                return true;
            }
        }
        return false;
    }
    sqm.hasQuestionForStep = function(step) {
        return this.questionForStepMap['step_'+step] != undefined;
    }
    
    sqm.getQuestionForStep = function(step) {
        return this.questionForStepMap['step_'+step];
    }
    
    sqm.hasAnswersForStep = function(step) {
        var qu = this.questionForStepMap['step_'+step];
        var result =  qu.answers.length != 0;
        return result;
    }
    
    sqm.hasShownUserId = function() {
        return this.hasShownUserID;
    }
    sqm.getAnswersForStep = function(step) {
        var qu = this.questionForStepMap['step_'+step];
        return  qu.answers;
    }

    sqm.configureForCurrentStep = function() {
        var currentStep = sessionIndexManager.getCurrentIndex();
        if (!this.hasShownUserId()) {
            this.renderer.poseUserIdQuestion();
        }
        else if (this.hasQuestionForStep(currentStep)) {
            this.poseCurrentQuestion();
        }
    }

    sqm.isDoneWithStepRelatedQuestions = function(){
        return this.currentStepIndex == this.steps.length;
    }

    
    sqm.poseNextQuestion = function() {
        this.currentStepIndex = this.currentStepIndex + 1;
        if (this.isDoneWithStepRelatedQuestions()){
            // we've asked the last "true-step" question, ask summary instead
            this.renderer.poseSummaryQuestion(this.currentStepIndex, this.summaryQuestion, this.summaryAnswers);
        }
        else {
            var nextStep = this.steps[this.currentStepIndex];
            var args = ["" + nextStep];
            var userCommand = new proto.scaii.common.UserCommand;
            userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
            userCommand.setArgsList(args);
            stageUserCommand(userCommand);
            this.poseCurrentQuestion();
        }
    }
    
    sqm.jumpBackToCurrentDecisionPoint = function() {
        var targetStep = this.steps[this.currentStepIndex];
        var args = ["" + nextStep];
        var userCommand = new proto.scaii.common.UserCommand;
        userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.JUMP_TO_STEP);
        userCommand.setArgsList(args);
        stageUserCommand(userCommand);
    }

    sqm.poseCurrentQuestion = function() {
        var curStep = this.steps[this.currentStepIndex];
        var qu = sqm.questionForStepMap['step_' + curStep];
        this.renderer.poseQuestion(qu, this.currentStepIndex, curStep);
    }

    sqm.clearTimelineBlocks = function() {
        $("#left-block-div").remove();
        $("#right-block-div").remove();
    }

    sqm.leftBoundaryOfRightBlockHasDiamond = function(){
        var indexOfLastDecisionPoint = this.steps.length - 1
        return this.currentStepIndex != indexOfLastDecisionPoint;
    } 

    sqm.blockClicksOutsideRange = function() {
        var step = this.steps[this.currentStepIndex];
        if (step == undefined){
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
        var rightValueOnTimeline = Math.floor((rangePair[1] / maxIndex ) * 100);
        var x3 = ecpOffset.left + timelineMargin + (rightValueOnTimeline / 100) * widthOfTimeline;
        // shift x3 to the left to fully cover the next DecisionPoint
        if (this.leftBoundaryOfRightBlockHasDiamond()) {
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
        leftBlockDiv.setAttribute("style", "position:absolute;left:" + x1 + "px;top:" + y + "px;z-index:500;background:" + gradientBars + ";width:" + width1 + "px;height:" + height + "px;");
        //$("body").append(leftBlockDiv);


        // make blocking div from leftXofRightBlock -> expl_ctrl_canvas.width
        var rightBlockDiv = document.createElement("DIV");
        rightBlockDiv.setAttribute("id", "right-block-div");
        rightBlockDiv.setAttribute("style", "position:absolute;left:" + x3 + "px;top:" + y + "px;z-index:500;background:" + gradientBars + ";width:" + width2 + "px;height:" + height + "px;");
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
        studyQuestionManager.hasShownUserID = true;
        studyQuestionManager.poseNextQuestion();
    }
    
}
function acceptAnswer() {
    // block if no answer specified
    var renderer = studyQuestionManager.renderer;
    var answer = renderer.getCurrentAnswer();
    if (answer == undefined || answer == '') {
        alert('No answer chosen for the current question.  Please specify an answer and then click "Next Question".');
        return;
    }
    // gather answer, send to backend
    var pkt = new proto.scaii.common.ScaiiPacket;
    var sqa = new proto.scaii.common.StudyQuestionAnswer;
    var step = renderer.currentQuestionStep;
    var questionNumber = renderer.currentQuestionNumber;
    var questionText = renderer.currentQuestionText;
    sqa.setUserId(studyQuestionManager.userId);
    sqa.setTreatmentId(studyQuestionManager.treatmentId);
    sqa.setStep(step);
    console.log('saving question number ' + questionNumber + ' step ' + step);
    sqa.setQuestionNumber('' + questionNumber);
    sqa.setQuestion(questionText);
    sqa.setAnswer(answer);
    pkt.setStudyQuestionAnswer(sqa);
    userInfoScaiiPackets.push(pkt);

    renderer.forgetQuestion();
    if (renderer.arrowCueNeeded) {
        renderer.renderCueAndArrowToPlayButton();
    }
    else {
        renderer.renderCueToPlayButton();
    }
    studyQuestionManager.questionWasAnswered = true;

    if (step == 'summary'){
        renderer.poseThankYouScreen();
    } 
    else {
        controlsManager.enablePauseResume();
    }
}


function chooseNextQuestionAfterStep(step) {
    // clear current question
    $('#q-and-a-div').empty();

    if (step == 'summary'){
        renderer.poseThankYouScreen();
    } 
    else {
        // pose next question
        studyQuestionManager.poseNextQuestion();
    }
}