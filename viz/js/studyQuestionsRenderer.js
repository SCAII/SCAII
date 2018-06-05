

function getStudyQuestionRenderer(questions) {
    var sqr = {};
    //sqr.bg = "#f4f4f4";
    sqr.bg = "#ffffff";
    sqr.marginTop = "6px";
    sqr.fontSize = "16px";
    sqr.questionType = undefined;
    sqr.currentRadioName = undefined;
    sqr.currentTextBox = undefined;
    sqr.currentQuestionStep = undefined;
    sqr.currentQuestionNumber = undefined;
    sqr.currentQuestionText = undefined;

    sqr.renderTextInputBox = function(step, index) {
        this.questionType = 'text';
        var textBoxId = "text-box-" + step + "-" + index;
        var ta = document.createElement("textarea");
        ta.setAttribute("id", textBoxId);
        ta.setAttribute("style","font-family:Arial;font-size:" + this.fontSize + ";padding-left:10px; padding-right:10px;height:140px");
        this.currentTextBox = ta;
        $("#q-and-a-div").append(ta);
    }

    sqr.getCurrentAnswer = function(){
        if (this.questionType == 'text') {
            var answer = this.currentTextBox.value;
            return answer;
        }
        else if (this.questionType == 'radio') {
            var radioName = this.currentRadioName;
            var answer = $('input[name=' + radioName + ']:checked').val();
            return answer;
        }
        else {
            return undefined;
        }
    }

    sqr.renderRadioButton = function(radioSetName, answerText, step, index){
        var radioRowId = "radio-button-row-" + step + "-" + index;
        var buttonRow = document.createElement("DIV");
        buttonRow.setAttribute("id", radioRowId);
        buttonRow.setAttribute("class", "flex-row");
        buttonRow.setAttribute("style", "margin-top:" + this.marginTop + ";width:100%;");
        $("#q-and-a-div").append(buttonRow);

        var radioId = "radio-"+ step + "-" + index;
        var radio = document.createElement("INPUT");
        radio.setAttribute("type", "radio");
        radio.setAttribute("id", radioId);
        radio.setAttribute("style", "margin-left:80px;font-family:Arial;font-size:" + this.fontSize + ";background-color:" + this.bg + ";");
        radio.setAttribute("name", radioSetName);
        radio.setAttribute("value", answerText);
        $("#"+radioRowId).append(radio);

        var radioLabel = document.createElement("DIV");
        radioLabel.setAttribute("style", "margin-left:8px;font-family:Arial;font-size:" + this.fontSize + ";background-color:" + this.bg + ";");
        radioLabel.innerHTML = answerText;
        $("#"+radioRowId).append(radioLabel);
    }

    sqr.renderRadioButtons = function(step, answers) {
        this.questionType = 'radio';
        var radioSetName = "radio-for-step-" + step;
        for (var i in answers){
            var answer = answers[i];
            this.renderRadioButton(radioSetName, answer, step, i);
        }
        this.currentRadioName = radioSetName;
    }

    sqr.renderNextButton = function(onclickFunction, step){
        var nextButtonRowId = "next-button-row-" + step;
        var buttonRow = document.createElement("DIV");
        buttonRow.setAttribute("id", nextButtonRowId);
        buttonRow.setAttribute("class", "flex-row");
        buttonRow.setAttribute("style", "margin-top:10px;font-family:Arial;background-color:" + this.bg + ";width:100%;");
        $("#q-and-a-div").append(buttonRow);

        var next = document.createElement("BUTTON");
        next.setAttribute("id", "button-next-"+ step);
        next.setAttribute("style", "margin-left:250px;font-family:Arial;font-size:" + this.fontSize + ";padding-left:10px; padding-right:10px");
        next.innerHTML = "Next Question";
        next.onclick = onclickFunction;
        $("#"+ nextButtonRowId).append(next);
    }
    
    sqr.poseQuestion = function(qu, questionIndex, curStep){
        this.currentQuestionNumber = questionIndex + 1;
        this.currentQuestionStep = curStep;
        this.currentQuestionText =  qu.questionText;
        var answers = qu.answers;
        this.poseGivenQuestion(this.currentQuestionNumber, curStep, this.currentQuestionText, answers);
    }
    
    sqr.poseSummaryQuestion = function(questionIndex, questionText, answers){
        this.currentQuestionNumber = questionIndex + 1;
        this.currentQuestionStep = 'summary';
        studyQuestionManager.clearTimelineBlocks();
        this.currentQuestionText =  questionText;
        this.poseGivenQuestion(this.currentQuestionNumber, 'summary', questionText, answers);
    }

    sqr.poseGivenQuestion = function(questionNumber, step, text, answers){
        $("#q-and-a-div").empty();
        $("#q-and-a-div").css("background-color",this.bg);
        $("#q-and-a-div").css("margin-top","20px");
        $("#q-and-a-div").css("padding","20px");
        // add a textArea for the question
        var quText = document.createElement("DIV");
        quText.setAttribute("id", "user-id-question");
        quText.setAttribute("style", "margin-left:50px;font-family:Arial;font-weight:bold;font-size:" + this.fontSize + ";background-color:" + this.bg + ";");
        quText.innerHTML =  "Question " + questionNumber  + ": " + text;
        $("#q-and-a-div").append(quText);

        if (answers.length == 0){
            // provide area for user to type text answer
            this.renderTextInputBox();
        }
        else {
            // add a div with radio button and label for each answer
            this.renderRadioButtons(step, answers);
        }
        var onclickFunction;
        // add a div with next button
        onclickFunction = acceptAnswer;
        
        this.renderNextButton(onclickFunction);
    }

    sqr.poseThankYouScreen = function(){
        var div = document.createElement("DIV");
        div.setAttribute("id", "thank-you-div");
        div.setAttribute("class", "flex-column");
        div.setAttribute("style", "position:absolute;left:0px;top:0px;z-index:500;margin:auto;font-family:Arial;padding:10px;width:600px;height:600px;background-color:" + this.bg + ";");
        $('body').append(div);

        var row = document.createElement("DIV");
        row.setAttribute("id", "thank-you-row");
        row.setAttribute("class", "flex-row");
        row.setAttribute("style", "margin-top:200px;font-family:Arial;padding:10px;");
        $("#thank-you-div").append(row);
        
        var thanks = document.createElement("DIV");
        thanks.setAttribute("id", "thanks");
        thanks.setAttribute("style", "margin:auto;font-family:Arial;font-size:18px;padding:10px;");
        thanks.innerHTML = "Thank you for your participation in this study!";
        $("#thank-you-row").append(thanks);
    }

    sqr.poseUserIdQuestion = function() {
        var userIdDiv = document.createElement("DIV");
        userIdDiv.setAttribute("id", "user-id-div");
        userIdDiv.setAttribute("class", "flex-column");
        userIdDiv.setAttribute("style", "position:absolute;left:0px;top:0px;z-index:500;margin:auto;font-family:Arial;padding:10px;width:600px;height:600px;background-color:" + this.bg + ";");
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
            acceptUserId();
        }
        $("#user-id-button-row").append(next);
    }
    return sqr;
}