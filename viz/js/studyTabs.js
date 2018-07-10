var tabManager = undefined;

function getTabManager() {
    var tm = {};
    tm.currentTabIndex = 0;
    tm.tabInfos = [];
    tm.studyQuestionManagerForTab = {};
    tm.returnInfoForTab = {};
    tm.userIdHasBeenSet = false;
    tm.isInterTabHopInProgress = false;
    tm.priorTabId = undefined;
    tm.hopTargetTabId = undefined;
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
    tm.addTabInfo("tab-task2","Task 2","maintab", "NextTask.scr", "Loading Task 2...");

    

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

    tm.wereQuestionDivsSavedOff = function(questionId) {
        var returnInfo = this.returnInfoForTab[this.getCurrentCssId()];
        if (returnInfo == undefined){
            return false;
        }
        return returnInfo.questionId == questionId;
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
        this.openTab(ti.cssId, ti.fileName, ti.loadingMessage, true, false);
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
            this.openTab(ti.cssId, ti.fileName, ti.loadingMessage, true, true);
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

    tm.rememberStateUponDeparture = function(tabId, isHop){
        this.priorTabId = this.getCurrentCssId();
        this.hopTargetTabId = tabId;
        this.isInterTabHopInProgress = isHop;
        var returnInfo = {};
        // hopReturnInfo.questionDivs = document.getElementById("q-and-a-div").childNodes;
        // for (var i in hopReturnInfo.questionDivs){
        //     var qDiv = hopReturnInfo.questionDivs[i];
        //     var foo = 3;
        // }
        if ($('#q-and-a-div').children().length != 0){
            returnInfo.cachedQuestionDivs = $('#q-and-a-div').children().detach();
            //$('#q-and-a-div').empty(); 
            returnInfo.questionId = activeStudyQuestionManager.squim.getCurrentQuestionId();
        }
        else {
            returnInfo.cachedQuestionDivs = undefined; 
        }
        returnInfo.returnTargetStep = sessionIndexManager.getCurrentIndex();
        // remember any queued up clickInfo
        returnInfo.queuedUpClickInfo = activeStudyQuestionManager.renderer.clickInfoFromUserActionMonitor;
        // (click info should still be staged in renderer)
        this.returnInfoForTab[this.getCurrentCssId()] = returnInfo;
    }

    tm.getReturnInfoForTargetTab = function(){
       return this.returnInfoForTab[tm.hopTargetTabId];
    }

    tm.checkForTabHopCompletion = function(){
        var returnInfo = this.getReturnInfoForTargetTab();
        if (returnInfo!= undefined) {
            if (returnInfo.cachedQuestionDivs != undefined) {
                $("#q-and-a-div").append(returnInfo.cachedQuestionDivs);
            }
           
            activeStudyQuestionManager.renderer.clickInfoFromUserActionMonitor = returnInfo.queuedUpClickInfo;
            var coords = userActionMonitor.extractClickCoordinatesFromClickEvent(returnInfo.queuedUpClickInfo);
            if (coords != undefined) {
                highlightShapeInRange(coords[0], coords[1]);
            }
            this.returnInfoForTab[this.hopTargetTabId] = undefined;
            this.hopTargetTabId = undefined;
            this.priorTabId = undefined;
            this.isInterTabHopInProgress = false;
            clearLoadingScreen();
        }
    }

    tm.jumpIfTabHopInProgress = function(){
        if (this.isInterTabHopInProgress){
            var returnInfo = this.getReturnInfoForTargetTab();
            if (returnInfo!= undefined) {
                jumpToStep(returnInfo.returnTargetStep);
                return true;
            }
        }
        return false;
    }

    tm.openFirstTab = function(){
        this.openTab('tab-tutorial','tutorial.scr','Loading tutorial...', false, false);
    }
    
    tm.openTab = function(tabId, replayFileForTab, loadingMessage, rememberInfo, isHop){
        if (rememberInfo){
            this.rememberStateUponDeparture(tabId, isHop);
        }
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
    div.setAttribute("style", "height:0px;width:100%;");
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
