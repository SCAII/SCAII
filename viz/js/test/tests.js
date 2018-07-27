function getFailureChecker() {
    var fc = {};
    fc.failures = [];
    fc.context = undefined;
    fc.setCase = function(context){
        this.context = context;
    }
    fc.assert = function(a, b, message){
        if (a != b){
            this.failures.push(this.context + " : " + message);
        }
    }
    return fc;
}
function runTests(){
    runQuestionAccessManagerTests();
    var fc = getFailureChecker();
    runChartManagerTests(fc);
    runChartDataSelectionTests(fc);
    //runChartDataGeometryTests(fc);
    runChartDataTextTests(fc);
    runChartDataColorTests(fc);
    runRankingTests(fc);
    if (fc.failures.length != 0){
        var message = "";
        for (var i in fc.failures){
            var failure = fc.failures[i];
            message = message + failure + "\n";
        }
        alert(message);
    }
    else {
        alert("awesome - time to go home");
    }
}

