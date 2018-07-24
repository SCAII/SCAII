
  // IMPLEMENTATION ISSUES
     // if (jumpInProgress) don't render yet

function getChartManager(chartData){
    var cm = {};
    cm.filename = undefined;
    cm.saliencyRandomized = false;
    cm.renderLog = [];
    cm.userStudyTreatment = "NA";
    cm.userStudyMode = false;
    cm.showChartAccessButton = false;
    cm.chartVisible = false;
    cm.showSaliencyAccessButton = false;
    cm.saliencyVisible = false;
    cm.saliencyCombined = false;
    cm.treatmentID = undefined;
    cm.showLosingActionSmaller = false;
    cm.showHoverScores = false;

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
            this.showChartAccessButton = false;
            this.chartVisible = false;
            this.showSaliencyAccessButton = false;
            this.saliencyVisible = false;
            this.saliencyCombined = true;
        }
        else if (val == "T1"){
            this.treatmentID = "T1";
            this.showChartAccessButton = false;
            this.chartVisible = false;
            this.showSaliencyAccessButton = false;
            this.saliencyVisible = true;
            this.saliencyCombined = false;

        }
        else if (val == "T2"){
            this.treatmentID = "T2";
            this.showChartAccessButton = true;
            this.chartVisible = false;
            this.showSaliencyAccessButton = false;
            this.saliencyVisible = false;
            this.saliencyCombined = false;

        }
        else if (val == "T3"){
            this.treatmentID = "T3";
            this.showChartAccessButton = true;
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
        if (this.showChartAccessButton){
            this.renderChartAccessButton(mode);
        }
        if (this.chartVisible){
            this.renderChartDetailed(mode);
        }
    }

    cm.renderT3 = function(mode){
        if (this.showChartAccessButton){
            this.renderChartAccessButton(mode);
        }
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

    cm.renderChartAccessButton = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderChartAccessButton");
            return;
        }
        // do the actual rendering
    }
    
    cm.renderChartDetailed = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderChartDetailed");
            return;
        }
        // do the actual rendering
    }
    
    cm.renderSaliencyAccessButton = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderSaliencyAccessButton");
            return;
        }
        // do the actual rendering
    }
    
    cm.renderSaliencyCombined = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderSaliencyCombined");
            return;
        }
        // do the actual rendering
    }
    
    cm.renderSaliencyDetailed = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderSaliencyDetailed");
            return;
        }
        // do the actual rendering
    }
    return cm;
}
