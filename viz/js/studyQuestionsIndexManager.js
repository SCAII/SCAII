function getStudyQuestionIndexManager(ids) {
    var squim = {};

    squim.questionIds = ids;
    
    squim.decisionPointSteps = getDecisionPointStepsFromQuestionIds(ids);
    squim.decisionPointCount = squim.decisionPointSteps.length;
    squim.decisionPointForStep = {};

    for (var i in squim.decisionPointSteps) {
        var step = squim.decisionPointSteps[i];
        squim.decisionPointForStep[step] = Number(i) + 1;
    }

    squim.currentIdIndex = 0;
    squim.next = function() {
        this.currentIdIndex = this.currentIdIndex + 1;
    }

    squim.getCurrentQuestionId = function() {
        return this.questionIds[this.currentIdIndex];
    }
    squim.getCurrentStep = function() {
        return getStepFromQuestionId(this.questionIds[this.currentIdIndex]);
    }
    squim.getCurrentDecisionPointNumber = function() {
        if (this.getCurrentStep() == 'summary') {
            return undefined;
        }
        return this.decisionPointForStep[this.getCurrentStep()];
    }
    squim.isCurrentQuestionSummary = function() {
        return getStepFromQuestionId(this.questionIds[this.currentIdIndex]) == 'summary';
    }
    squim.getDecisionPointSteps = function(){
        return this.decisionPointSteps;
    }
    squim.hasQuestionForStep = function(step) {
        for (var i in this.questionIds){
            var questionId = this.questionIds[i];
            var curStep = getStepFromQuestionId(questionId);
            if (curStep == step){
                return true;
            }
        }
        return false;
    }

    squim.hasMoreQuestions = function(){
        if (this.currentIdIndex == this.questionIds.length - 1){
            return false;
        }
        return true;
    }
    
    squim.hasMoreQuestionsAtThisStep = function(){
        if (this.currentIdIndex == this.questionIds.length - 1){
            return false;
        }
        var currentStep = this.getCurrentStep();
        var nextQuestionStep = getStepFromQuestionId(this.questionIds[this.currentIdIndex + 1]);
        return currentStep == nextQuestionStep;
    }

    squim.isAtLastDecisionPoint = function(){
        var lastDecisionPointStep = this.decisionPointSteps[this.decisionPointSteps.length - 1];
        var currentStep = this.getCurrentStep();
        return lastDecisionPointStep == currentStep;
    }
    return squim;
}

function getStepFromQuestionId(questionId){
    if (questionId == "summary"){
        return questionId;
    }
    var parts = questionId.split(".");
    return parts[0];
}

function getQuestionIndexFromQuestionId(questionId){
    var parts = questionId.split(".");
    return parts[1];
}

function getQuestionId(step, questionIndex) {
    return step + '.' + questionIndex;
}
function getDecisionPointStepsFromQuestionIds(ids) {
    var stepsList = [];
    for (var i in ids){
        var id = ids[i];
        var step = getStepFromQuestionId(id);
        if (step != 'summary'){
            if (stepsList.indexOf(step) == -1) {
                stepsList.push(step);
            }
        }
    }
    return stepsList;
}