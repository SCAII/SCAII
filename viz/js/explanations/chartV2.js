function addFunctionsToRawChart(rawChart){
    var ch = addColorToBars(rawChart);
    ch = addUtilityFunctions(ch);
    ch = addRankingFunctions(ch);
    ch = addSelectionFunctions(ch);
    ch = addTextFunctions(ch);
    ch = addGeometryFunctions(ch);
    return ch;
}

function setDefaultSelections(chartData) {
    var action = chartData.getMaxValueAction();
    var bar = chartData.getMaxValueBar(action.bars);
    bar.selected = true;
    return chartData;
}
function addConvenienceDataStructures(chartData) {
    if (chartData.actionForNameMap == undefined){
        chartData.actionForNameMap = {};
        chartData.actionNames = [];
        for(var i in chartData.actions){
            var action = chartData.actions[i];
            var actionName = action.name;
            chartData.actionForNameMap[actionName] = action;
            chartData.actionNames.push(actionName);
        }
    }
    
    if (chartData.actionRewardForNameMap == undefined){
        chartData.actionRewardForNameMap = {};
        chartData.actionRewardNames = [];
        for(var i in chartData.actions){
            var action = chartData.actions[i];
            for (var j in action.bars){
                var bar = action.bars[j];
                bar.fullName = action.name+ "." + bar.name;
                chartData.actionRewardForNameMap[bar.fullName] = bar;
                chartData.actionRewardNames.push(bar.fullName);
            }
        }
    }
    
    if (chartData.rewardNames == undefined){
        chartData.rewardNames = [];
        for(var i in chartData.actions){
            var action = chartData.actions[i];
            for (var j in action.bars){
                var bar = action.bars[j];
                if (!chartData.rewardNames.includes(bar.name)) {
                    chartData.rewardNames.push(bar.name);
                }
            }
        }
    }
    return chartData;
}

function ensureActionValuesSet(chartData) {
    for (var i in chartData.actions) {
        var action = chartData.actions[i];
        var actionTotal = 0.0;
        for (var j in action.bars){
            var bar = action.bars[j];
            actionTotal = actionTotal + bar.value;
        }
        action.value = actionTotal;
    }
    return chartData;
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
        this.data = ensureActionValuesSet(this.data);
        this.data = addConvenienceDataStructures(this.data);
        this.data = setDefaultSelections(this.data);
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
            this.chartUI.renderChartDetailed(this.data);
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
            this.saliencyUI.renderSaliencyCombined(this.data);
        }
    }
    
    cm.renderSaliencyDetailed = function(mode){
        if (mode == "trace"){
            this.renderLog.push("renderSaliencyDetailed");
            return;
        }
        else {
            this.saliencyUI.renderSaliencyDetailed(this.data);
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
