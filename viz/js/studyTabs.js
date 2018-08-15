var tabManager = undefined;

function getTabManager() {
    var tm = {};
    tm.currentTabIndex = 0;
    tm.tabInfos = [];
    tm.studyQuestionManagerForTab = {};
   
    tm.userIdHasBeenSet = false;

    tm.returnInfoForTab = {};

    tm.targetTabId = undefined;
    tm.answeredQuestions = [];
    
    tm.hasShownUserId = function() {
        return this.userIdHasBeenSet;
    }
  
    tm.addTabInfo = function(cssId,text,className, fileName, loadingMessage){
        var ti = {};
        ti.cssId = cssId;
        ti.text = text;
        ti.className = className;
        ti.fileName = fileName;
        ti.loadingMessage = loadingMessage;
        this.tabInfos.push(ti);
    }
    tm.addTabInfo("tab-tutorial","Tutorial","maintab", "tutorial.scr","Loading tutorial...");
    tm.addTabInfo("tab-task1","Task 1","maintab", "MainTask.scr", "Loading Task 1...");
    //tm.addTabInfo("tab-task2","Task 2","maintab", "NextTask.scr", "Loading Task 2...");

    for (var i in tm.tabInfos){
        var tabInfo = tm.tabInfos[i];
        generateTaskTab(tabInfo);
    }

    tm.noteQuestionWasAnswered = function(questionId) {
        var absoluteQuestionId = this.getCurrentCssId() + "." + questionId;
        this.answeredQuestions.push(absoluteQuestionId);
    }

    tm.wasQuestionAnsweredAlready = function(questionId){
        var absoluteQuestionId = this.getCurrentCssId() + "." + questionId;
        return this.answeredQuestions.includes(absoluteQuestionId);
    }


    tm.hasNextTab = function(){
        if (this.currentTabIndex >= this.tabInfos.length - 1){
            return false;
        }
        return true;
    }

    tm.setTabIndex = function(index) {
        this.currentTabIndex = index;
        $("#debug2").html("tab index is now" + index);
    }
    tm.nextTab = function() {
        var indexOfNextTab = Number(this.currentTabIndex) + 1;
        var ti = this.tabInfos[indexOfNextTab];
        this.openTab(ti.cssId, ti.fileName, ti.loadingMessage, true);
    }

    tm.getCurrentCssId = function(){
        var ti = this.tabInfos[this.currentTabIndex];
        return ti.cssId;
    }

    tm.getIndexOfTabWithId = function(id){
        var indexOfTabInfoWithId = -1;
        for (var i in tm.tabInfos){
            var tabInfo = tm.tabInfos[i];
            if (tabInfo.cssId == id){
                return i;
            }
        }
        return -1; 
    }

    tm.openTabForId = function(id) {
        var targetIndex = this.getIndexOfTabWithId(id);
        if (targetIndex != -1){
            var ti = this.tabInfos[targetIndex];
            this.openTab(ti.cssId, ti.fileName, ti.loadingMessage, true);
        }
    }

    tm.currentTabHasQuestionManager = function(){
        var curTabId = this.getCurrentCssId();
        var qm = this.studyQuestionManagerForTab[curTabId];
        return qm != undefined;
    }

    tm.setStudyQuestionManagerForCurrentTab = function(qm){
        var curTabId = this.getCurrentCssId();
        this.studyQuestionManagerForTab[curTabId] = qm;
    }

    tm.getStudyQuestionManagerForCurrentTab = function(){
        var curTabId = this.getCurrentCssId();
        var qm = this.studyQuestionManagerForTab[curTabId];
        return qm;
    }
    tm.hasMoreQuestions = function(){
        if (this.hasNextTab()){
            return true;
        }
        if (activeStudyQuestionManager.hasMoreQuestions()){
            return true;
        }
        return false;
    }

    tm.rememberQuestionInProgress = function(returnInfo){
        returnInfo.cachedQuestionDivs = undefined;
        if ($('#q-and-a-div').children().length != 0){
            returnInfo.cachedQuestionDivs = $('#q-and-a-div').children().detach();
            returnInfo.questionId = activeStudyQuestionManager.squim.getCurrentQuestionId();
            return true;
        }
        return false;
    }
    
    tm.getReturnInfoForTargetTab = function(){
        return this.returnInfoForTab[this.targetTabId];
    }
    tm.rememberStateUponDeparture = function(tabId){
        this.targetTabId = tabId;
        var returnInfo = {};
        // always remember chart state and saliency that is displayed
        returnInfo.chartV2 = currentExplManager;
        returnInfo.returnTargetStep = sessionIndexManager.getCurrentIndex();
        if (this.rememberQuestionInProgress(returnInfo)){
            returnInfo.tabWasCompleted = false;
            // remember any queued up clickInfo
            returnInfo.queuedUpClickInfo = activeStudyQuestionManager.renderer.clickInfoFromUserActionMonitor;
        }
        else {
            returnInfo.tabWasCompleted = true;
        }
        this.returnInfoForTab[this.getCurrentCssId()] = returnInfo;
    }

    tm.applyRememberedQuestionInProgress = function(returnInfo) {
        if (returnInfo.cachedQuestionDivs != undefined) {
            $("#q-and-a-div").empty();
            $("#q-and-a-div").append(returnInfo.cachedQuestionDivs);
        }
    }

    tm.finalStepsForChangeToTab = function(){
        var returnInfo = this.returnInfoForTab[this.targetTabId];
        if (returnInfo!= undefined) {
            if (returnInfo.tabWasCompleted){
                delete this.returnInfoForTab[this.targetTabId];
                this.targetTabId = undefined;
                clearLoadingScreen();
            }
             else {
                this.applyRememberedQuestionInProgress(returnInfo);
                // highlight any gameboard object that was clicked on
                activeStudyQuestionManager.renderer.clickInfoFromUserActionMonitor = returnInfo.queuedUpClickInfo;
                var coords = userActionMonitor.extractClickCoordinatesFromClickEvent(returnInfo.queuedUpClickInfo);
                if (coords != undefined) {
                    highlightShapeInRange(coords[0], coords[1]);
                }
                delete this.returnInfoForTab[this.targetTabId];
                this.targetTabId = undefined;
                clearLoadingScreen();
            }
            currentExplManager = returnInfo.chartV2;
            currentExplManager.render();
        }
    }


    tm.jumpToDesiredStepIfTabChangeInProgress = function(){
        var returnInfo = this.returnInfoForTab[this.targetTabId];
        if (returnInfo!= undefined) {
            jumpToStep(returnInfo.returnTargetStep);
            return true;
        }
        return false;
    }

    tm.openFirstTab = function(){
        this.openTab('tab-tutorial','tutorial.scr','Loading tutorial...', false);
    }
    
    tm.openTab = function(tabId, replayFileForTab, loadingMessage, rememberInfo){
        if (rememberInfo){
            this.rememberStateUponDeparture(tabId);
        }
        cleanExplanationUI();
        var indexOfTargetTab = this.getIndexOfTabWithId(tabId);
        this.setTabIndex(indexOfTargetTab);
        loadTab(tabId, replayFileForTab, loadingMessage);
        enableTab(tabId);
        $("#debug1").html("tab is " + tabId);
    }
    return tm;
}

function generateTaskTab(ti) {
    var t = generateDisabledButton(ti.cssId, ti.text, ti.className, ti.tabLoadFunction);
    $("#master-tabs").append(t);
}

function generateDisabledButton(cssId,text,className, tabLoadFunction) {
    var b = document.createElement("BUTTON");
    b.disabled = true;
    b.setAttribute("id", cssId);
    b.setAttribute("class", className);
    b.innerHTML = text;
    b.onclick = function(e){
        tabManager.isHopInProgress = true;
        tabManager.openTabForId(cssId);
        enableTab(cssId);
    };
    return b;
}

function removeFileSelectorEtc() {
    $("#title-row").empty();
    var div = document.createElement("DIV");
    div.setAttribute("id", "spacer-replacing-fileselector");
    div.setAttribute("style", "height:15px;width:100%;");
    $("#title-row").append(div);
}


function loadTab(tabId, replayFileForTab, loadingMessage){
    showLoadingScreen(loadingMessage);
    controlsManager.registerJQueryHandleForWaitCursor($("#loading-div"));
    loadReplayFile(replayFileForTab);
    $("#" + tabId).attr("disabled", false);
}

function enableTab(tabId) {
    tablinks = document.getElementsByClassName("maintab");
    var i, tablinks;
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    var tabControlToMakeActive = document.getElementById(tabId)
    tabControlToMakeActive.className += " active";
}


// function hasTargetReturnInfoData() {
//     if (tabManager == undefined) {
//         return false;
//     }
//     var returnInfoForTargetTab = tabManager.getReturnInfoForTargetTab();
//     if (returnInfoForTargetTab == undefined) {
//         return false;
//     }
//     return true;
// }
// function getTargetDisplayModeFromTabManager(displayMode) {
//     if (!hasTargetReturnInfoData()) {
//         return displayMode;
//     }
//     var returnInfoForTargetTab = tabManager.getReturnInfoForTargetTab();
//     var newKey = returnInfoForTargetTab.chartDisplayModeKey;
//     if (newKey == undefined) {
//         return displayMode;
//     }
//     return newKey;
// }

// function isTargetStepChartVisible() {
//     if (!hasTargetReturnInfoData()) {
//         return false;
//     }
//     var returnInfoForTargetTab = tabManager.getReturnInfoForTargetTab();
//     var val = returnInfoForTargetTab.chartIsShowing;
//     if (val == undefined) {
//         return false;
//     }
//     return val;
// }


// function getTargetStepFromReturnInfo() {
//     if (!hasTargetReturnInfoData()) {
//         return undefined;
//     }
//     var returnInfoForTargetTab = tabManager.getReturnInfoForTargetTab();
//     var targetStep = returnInfoForTargetTab.returnTargetStep;
//     if (targetStep == undefined) {
//         return undefined;
//     }
//     return Number(targetStep);
// }

//Saliency
//remember visible?  (salienciesAreShowing)
// function isTargetStepSaliencyVisible() {
//     if (!hasTargetReturnInfoData()) {
//         return false;
//     }
//     var returnInfoForTargetTab = tabManager.getReturnInfoForTargetTab();
//     var val = returnInfoForTargetTab.salienciesAreShowing;
//     if (val == undefined) {
//         return false;
//     }
//     return val;
// }
//combined?
// function isTargetStepSaliencyCombined(){
//     if (!hasTargetReturnInfoData()) {
//         // default to combined as that would have been the original default
//         return true;
//     }
//     var returnInfoForTargetTab = tabManager.getReturnInfoForTargetTab();
//     var val = returnInfoForTargetTab.saliencyCombined;
//     return val;
// }
//whichRowsVisible? selectionManagers[modeKey] getSelection/setSelection
// no need - saliency shares a selectionManager with the chart

//anySelected?  saliencyDisplayManager.currentlyHighlightedSaliencyMapKey for all four. then call saliencyDisplayManager.showSaliencyMapOutline(saliencyMapId)
// function getTargetStepSaliencyMapToHighlight(){
//     if (!hasTargetReturnInfoData()) {
//         return undefined;
//     }
//     var returnInfoForTargetTab = tabManager.getReturnInfoForTargetTab();
//     var chartDisplayModeKey = returnInfoForTargetTab.chartDisplayModeKey;
//     var mapIdToHighlight = returnInfoForTargetTab.highlightedMapIds[chartDisplayModeKey];
//     return mapIdToHighlight;
// }

