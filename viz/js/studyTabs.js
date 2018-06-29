var tabManager = undefined;

function getTabManager() {
    var tm = {};
    tm.currentTabIndex = 0;
    tm.tabInfos = [];
    tm.studyQuestionManagerForTab = {};
    tm.userIdHasBeenSet = false;

    
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

    tm.hasNextTab = function(){
        if (this.currentTabIndex >= this.tabInfos.length - 1){
            return false;
        }
        return true;
    }

    tm.nextTab = function() {
        this.currentTabIndex = this.currentTabIndex + 1;
        var ti = this.tabInfos[this.currentTabIndex];
        openTab(ti.cssId, ti.fileName, ti.loadingMessage);
    }

    tm.getCurrentTabId = function(){
        var ti = this.tabInfos[this.currentTabIndex];
        return ti.cssId;
    }

    tm.currentTabHasQuestionManager = function(){
        var curTabId = this.getCurrentTabId();
        var qm = this.studyQuestionManagerForTab[curTabId];
        return qm != undefined;
    }

    tm.setStudyQuestionManagerForCurrentTab = function(qm){
        var curTabId = this.getCurrentTabId();
        this.studyQuestionManagerForTab[curTabId] = qm;
    }

    tm.getStudyQuestionManagerForCurrentTab = function(){
        var curTabId = this.getCurrentTabId();
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
    b.onclick = tabLoadFunction;
    return b;
}

function removeFileSelectorEtc() {
    $("#title-row").empty();
    var div = document.createElement("DIV");
    div.setAttribute("id", "spacer-replacing-fileselector");
    div.setAttribute("style", "height:0px;width:100%;");
    $("#title-row").append(div);
}

function openTab(tabId, replayFileForTab, loadingMessage){
    loadTab(tabId, replayFileForTab, loadingMessage);
    enableTab(tabId);
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
