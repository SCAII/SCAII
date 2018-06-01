 function isStudyQuestionMode() {
    return studyQuestionManager != undefined;
}

function getStudyQuestionManager(questions) {
    var sqm = {};
    sqm.userID = undefined;
    sqm.questionForStepMap = {};
    sqm.steps = [];
    sqm.windowRangeForStep = {};
    sqm.summaryQuestion = undefined;
    sqm.summaryAnswers = undefined;
    sqm.currentStepIndex = 0;
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
            if (step == endOfRange + 1) {
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
    
    sqm.hasUserId = function() {
        return this.userID != undefined;
    }
    sqm.getAnswersForStep = function(step) {
        var qu = this.questionForStepMap['step_'+step];
        return  qu.answers;
    }

    sqm.configureForCurrentStep = function() {
        var currentStep = sessionIndexManager.getCurrentIndex();
        if (this.userID == undefined) {
            this.poseUserIdQuestion();
        }
        else if (this.hasQuestionForStep(currentStep)) {
            this.poseNextQuestion();
        }
    }

    sqm.poseUserIdQuestion = function() {
        var userIdDiv = document.createElement("DIV");
        userIdDiv.setAttribute("id", "user-id-div");
        userIdDiv.setAttribute("class", "flex-column");
        userIdDiv.setAttribute("style", "position:absolute;left:0px;top:0px;z-index:500;background-color:#eeeeee;margin:auto;font-family:Arial;padding:10px;width:600px;height:600px;");
        $('body').append(userIdDiv);

        var questionRow = document.createElement("DIV");
        questionRow.setAttribute("id", "user-id-question-row");
        questionRow.setAttribute("class", "flex-row");
        questionRow.setAttribute("style", "margin-top:200px;font-family:Arial;padding:10px;");
        $("#user-id-div").append(questionRow);
        
        var question = document.createElement("DIV");
        question.setAttribute("id", "user-id-question");
        question.setAttribute("style", "margin:auto;font-family:Arial;font-size:18px;padding:10px;");
        question.innerHTML = "Please enter your user study ID:";
        $("#user-id-question-row").append(question);

        var userIdText = document.createElement("INPUT");
        userIdText.setAttribute("id", "user-id-answer");
        userIdText.setAttribute("style", "margin:auto;font-family:Arial;font-size:18px;padding:10px;");
        userIdText.onkeyup = function() {
            var value = $( this ).val();
            studyQuestionManager.userID = value;
        }
        $("#user-id-question-row").append(userIdText);

        var buttonRow = document.createElement("DIV");
        buttonRow.setAttribute("id", "user-id-button-row");
        buttonRow.setAttribute("class", "flex-row");
        buttonRow.setAttribute("style", "margin-top:100px;font-family:Arial;padding:10px;");
        $("#user-id-div").append(buttonRow);

        var next = document.createElement("BUTTON");
        next.setAttribute("id", "user-id-button-next");
        next.setAttribute("style", "margin-left:280px;font-family:Arial;font-size:18px;padding:10px;");
        next.innerHTML = "Next";
        next.onclick = function() {
            $("#user-id-div").remove();
            studyQuestionManager.poseNextQuestion();
        }
        $("#user-id-button-row").append(next);
    }
    sqm.poseNextQuestion = function() {
        this.blockClicksOutsideRange();
    }
    sqm.blockClicksOutsideRange = function() {
        $("#left-block-div").remove();
        $("#right-block-div").remove();
        var step = this.steps[this.currentStepIndex];
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
        x3 = x3 - explanationPointSmallDiamondHalfWidth;
        var x4 = expl_ctrl_canvas.width;
        

        var y = ecpOffset.top;
        var width1 = x2 - x1;
        var width2 = x4 - x3;
        var height = expl_ctrl_canvas.height;
        // make blocking div from 0 -> rightXofLeftBlock
        var leftBlockDiv = document.createElement("DIV");
        leftBlockDiv.setAttribute("id", "left-block-div" + step);
        leftBlockDiv.setAttribute("style", "position:absolute;left:" + x1 + "px;top:" + y + "px;z-index:500;background-color:red;width:" + width1 + "px;height:" + height + "px;");
        $("body").append(leftBlockDiv);

        // make blocking div from leftXofRightBlock -> expl_ctrl_canvas.width
        var rightBlockDiv = document.createElement("DIV");
        rightBlockDiv.setAttribute("id", "right-block-div" + step);
        rightBlockDiv.setAttribute("style", "position:absolute;left:" + x3 + "px;top:" + y + "px;z-index:500;background-color:green;width:" + width2 + "px;height:" + height + "px;");
        $("body").append(rightBlockDiv);
    }
    return sqm;
}

function getRanges(steps) {
    var step_range_pairs = {};
    for (var i = 0; i < steps.length; i++) {
        if (i == steps.length - 1) {
            // looking at the final entry - pair this one with the max index
            var range_pair = [ Number(steps[i]), Number(sessionIndexManager.getMaxIndex()) ];
            step_range_pairs[steps[i]] = range_pair;
        }
        else {
            // prior to last one, we make a pair with the step prior to the next question's step
            var range_pair = [ Number(steps[i]), Number(steps[i+1]) - 1 ];
            step_range_pairs[steps[i]] = range_pair;
        }
    }
    return step_range_pairs;
}