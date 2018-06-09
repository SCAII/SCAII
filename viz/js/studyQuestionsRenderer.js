

function getStudyQuestionRenderer(questions) {
    var sqr = {};
    //sqr.bg = "#f4f4f4";
    sqr.bg = "#ffffff";
    sqr.marginTop = "6px";
    sqr.fontSize = "16px";
    sqr.questionType = undefined;
    sqr.currentRadioName = undefined;
    sqr.currentTextBox = undefined;
    sqr.arrowCueNeeded = true;

    sqr.forgetQuestion = function(){
        this.questionType = undefined;
        this.currentRadioName = undefined;
        this.currentTextBox = undefined;
        $('#q-and-a-div').empty();
    }
    sqr.renderTextInputBox = function(step, index) {
        this.questionType = 'text';
        var textBoxId = "question-text-box";
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
        var radioSetName = "question-radio";
        for (var i in answers){
            var answer = answers[i];
            this.renderRadioButton(radioSetName, answer, step, i);
        }
        this.currentRadioName = radioSetName;
    }

    sqr.renderSaveButton = function(onclickFunction, step){
        var saveButtonRowId = "save-button-row";
        var buttonRow = document.createElement("DIV");
        buttonRow.setAttribute("id", saveButtonRowId);
        buttonRow.setAttribute("class", "flex-row");
        buttonRow.setAttribute("style", "margin-top:10px;font-family:Arial;background-color:" + this.bg + ";width:100%;");
        $("#q-and-a-div").append(buttonRow);

        var save = document.createElement("BUTTON");
        save.setAttribute("id", "button-save");
        save.setAttribute("style", "margin-left:250px;font-family:Arial;font-size:" + this.fontSize + ";padding-left:10px; padding-right:10px");
        save.innerHTML = "Save";
        save.onclick = onclickFunction;
        $("#"+ saveButtonRowId).append(save);
    }
    
    sqr.poseQuestion = function(qu, currentDecisionPointNumber, curStep){
        if (currentDecisionPointNumber == undefined) {
            studyQuestionManager.clearTimelineBlocks();
        }
        this.poseGivenQuestion(currentDecisionPointNumber, curStep, qu.questionText, qu.answers);
    }

    sqr.poseGivenQuestion = function(questionNumber, step, text, answers){
        $("#q-and-a-div").empty();
        $("#q-and-a-div").css("background-color",this.bg);
        $("#q-and-a-div").css("margin-top","20px");
        $("#q-and-a-div").css("padding","20px");
        // add a textArea for the question
        var quText = document.createElement("DIV");
        quText.setAttribute("id", "current-question");
        quText.setAttribute("style", "margin-left:50px;font-family:Arial;font-weight:bold;font-size:" + this.fontSize + ";background-color:" + this.bg + ";");
        if (questionNumber == undefined) {
            quText.innerHTML =  text;
        }
        else {
            quText.innerHTML =  "D" + questionNumber  + ": " + text;
        }
        
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
        
        this.renderSaveButton(onclickFunction);
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
        question.innerHTML = "Welcome to the XAI User Study.  Your study ID is :";
        $("#user-id-question-row").append(question);

        var userIdText = document.createElement("DIV");
        userIdText.setAttribute("id", "user-id-answer");
        userIdText.setAttribute("style", "margin:auto;font-family:Arial;font-size:18px;padding:10px;");
        userIdText.innerHTML = studyQuestionManager.userId;
        
        $("#user-id-question-row").append(userIdText);

        var buttonRow = document.createElement("DIV");
        buttonRow.setAttribute("id", "user-id-button-row");
        buttonRow.setAttribute("class", "flex-row");
        buttonRow.setAttribute("style", "margin-top:100px;font-family:Arial;padding:10px;");
        $("#user-id-div").append(buttonRow);

        var next = document.createElement("BUTTON");
        next.setAttribute("id", "user-id-button-next");
        next.setAttribute("style", "margin-left:280px;font-family:Arial;font-size:18px;padding:10px;");
        next.innerHTML = "Start";
        next.onclick = function() {
            acceptUserId();
        }
        $("#user-id-button-row").append(next);
    }

    sqr.renderCueToPlayButton = function(){
        var arrowText = document.createElement("DIV");
        arrowText.setAttribute("id", "arrow-text");
        arrowText.setAttribute("style", "margin:auto;font-family:Arial;font-size:18px;padding:10px;");
        arrowText.innerHTML = "Click the play button to have the game play until the next decision point.";
        $("#q-and-a-div").append(arrowText);

    }
    
    sqr.renderCueAndArrowToPlayButton = function(){
        var arrowText = document.createElement("DIV");
        arrowText.setAttribute("id", "arrow-text");
        arrowText.setAttribute("style", "margin:auto;font-family:Arial;font-size:18px;padding:10px;");
        arrowText.innerHTML = "Click the play button to have the game play until the next decision point.";
        $("#q-and-a-div").append(arrowText);

        var startCoords = getCoordForStartOfArrowText();
        var endCoords = getCoordsForPlayButton();
        drawArrow(startCoords, endCoords);
        this.arrowCueNeeded = false;
    }

    return sqr;
}

function getCoordForStartOfArrowText() {
    var pos = $("#arrow-text").offset();
    var result = {};
    result.x = pos.left + 200;
    result.y = pos.top;
    return result;
}

function getCoordsForPlayButton() {
    var pos = $("#pauseResumeButton").offset();
    var result = {};
    result.x = pos.left;
    result.y = pos.top + $("#pauseResumeButton").height();
    return result;
}
function drawArrow(startCoords, endCoords){
    var fromx = startCoords.x;
    var fromy = startCoords.y;
    var tox = endCoords.x;
    var toy = endCoords.y;
    var width = $("#game-titled-container").width();
    var height = $("#game-titled-container").height();
    //variables to be used when creating the arrow
    var c = document.createElement("canvas");
    c.setAttribute("id", "cue-arrow-div");
    c.setAttribute("width", width + "px");
    c.setAttribute("height", height + "px");
    c.setAttribute("style", "position:absolute;z-index:10000;top:0px;left:0px;pointer-events: none;");
    $("body").append(c);
    var ctx = c.getContext("2d");
    var headlen = 10;

    var angle = Math.atan2(toy-fromy,tox-fromx);

    //starting path of the arrow from the start square to the end square and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.strokeStyle = "#cc0000";
    ctx.lineWidth = 1;
    ctx.stroke();

    //starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),toy-headlen*Math.sin(angle+Math.PI/7));

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

    //draws the paths created above
    ctx.strokeStyle = "#cc0000";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#cc0000";
    ctx.fill();
}