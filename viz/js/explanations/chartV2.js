
  // IMPLEMENTATION ISSUES
     // if (jumpInProgress) don't render yet
function addFunctionsToRawChart(rawChart){
    var ch = addColorToBars(rawChart);
    ch = addUtilityFunctions(ch);
    ch = addRankingFunctions(ch);
    ch = addSelectionFunctions(ch);
    ch = addTextFunctions(ch);
    return ch;
}
function getChartV2Manager(){
    var cm = {};
    cm.data = undefined;
    cm.filename = undefined;
    cm.saliencyRandomized = false;
    cm.renderLog = [];
    cm.userStudyMode = false;
    cm.chartVisible = false;
    cm.showSaliencyAccessButton = false;
    cm.saliencyVisible = false;
    cm.saliencyCombined = false;
    cm.treatmentID = "NA";
    cm.showLosingActionSmaller = false;
    cm.showHoverScores = false;
    cm.chartUI = getChartV2UI();
    cm.saliencyUI = getSaliencyV2UI();

    cm.setChartData = function(chartData){
        this.data = addFunctionsToRawChart(chartData);
    }
    cm.setFilename = function(filename){
        this.filename = filename;
        if (filename.startsWith("tutorial")){
            this.saliencyRandomized = true;
        }
        else {
            this.saliencyRandomized = false;
        }
    }
    cm.setUserStudyMode = function(val){
        this.userStudyMode = val;
        this.showLosingActionSmaller = val;
        this.showHoverScores = !val;

        this.showChartAccessButton = true;
        this.chartVisible = false;
        this.showSaliencyAccessButton = true;
        this.saliencyVisible = false;
        this.saliencyCombined = true;
    }

    cm.setUserStudyTreatment = function(val) {
        if (val == "T0"){
            this.treatmentID = "T0";
            this.chartVisible = false;
            this.showSaliencyAccessButton = false;
            this.saliencyVisible = false;
            this.saliencyCombined = true;
        }
        else if (val == "T1"){
            this.treatmentID = "T1";
            this.chartVisible = false;
            this.showSaliencyAccessButton = false;
            this.saliencyVisible = true;
            this.saliencyCombined = false;

        }
        else if (val == "T2"){
            this.treatmentID = "T2";
            this.chartVisible = false;
            this.showSaliencyAccessButton = false;
            this.saliencyVisible = false;
            this.saliencyCombined = false;

        }
        else if (val == "T3"){
            this.treatmentID = "T3";
            this.chartVisible = false;
            this.showSaliencyAccessButton = true;
            this.saliencyVisible = false;
            this.saliencyCombined = true;
            
        }
        else {
            alert("unknown treatment name " +val);
        }
    }
    cm.render = function(mode){
        clearExplanationInfoButRetainState();
        this.renderLog = [];
        if (this.treatmentID == "T0"){
            // no action
        } 
        else if (this.treatmentID == "T1"){
            this.renderT1(mode);
        } else if (this.treatmentID == "T2"){
            this.renderT2(mode);
        } 
        else {
            // normal mode falls through to here and matches T3 as desired
            this.renderT3(mode);
        } 
    }

    cm.renderT1 = function(mode){
        this.renderSaliencyDetailed(mode);
    }
    
    cm.renderT2 = function(mode){
        if (this.chartVisible){
            this.renderChartDetailed(mode);
        }
    }

    cm.renderT3 = function(mode){
        if (this.chartVisible){
            this.renderChartDetailed(mode);
        }
        if (this.showSaliencyAccessButton && this.chartVisible){
            this.renderSaliencyAccessButton(mode);
        }
        if (this.saliencyVisible && this.saliencyCombined){
            this.renderSaliencyCombined(mode);
        }
        if (this.saliencyVisible && !this.saliencyCombined){
            this.renderSaliencyDetailed(mode);
        }
    }

    cm.renderChartDetailed = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderChartDetailed");
            return;
        }
        else {
            this.chartUI.renderChartDetailed();
        }
    }
    
    cm.renderSaliencyAccessButton = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderSaliencyAccessButton");
            return;
        }
        else {
            this.saliencyUI.renderSaliencyAccessControls();
        }
    }
    
    cm.renderSaliencyCombined = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderSaliencyCombined");
            return;
        }
        else {
            this.saliencyUI.renderSaliencyCombined();
        }
    }
    
    cm.renderSaliencyDetailed = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderSaliencyDetailed");
            return;
        }
        else {
            this.saliencyUI.renderSaliencyDetailed();
        }
    }
    return cm;
}


// function restoreChartIfReturningToTab(step){
//     if (isTargetStepChartVisible()) {
//         var targetStep = getTargetStepFromReturnInfo();
//         if (targetStep != undefined && targetStep == step) {
//             processWhyClick(step);
//         }
//     }
// }
