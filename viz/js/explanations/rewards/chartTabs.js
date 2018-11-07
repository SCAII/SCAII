var activeMsxChart = "tab-msx-best-vs-second-best"; //initialize to best vs second best
var chartTabSwitched = false;

var actionForMsxTabId = {};
function generateChartTabs(actionsRanked) {
    // tabs should read Attack Q1 (best) vs. Attack Q3 (2nd) | Attack Q1 (best) vs Attack Q2 (3rd) | etc
    var best   = actionsRanked[0].name;
    var second = actionsRanked[1].name;
    var third  = actionsRanked[2].name;
    var fourth = actionsRanked[3].name;
    var tab1Title = best + " (best) vs. " + second + " (2nd)";
    var tab2Title = best + " (best) vs. " + third + " (3nd)";
    var tab3Title = best + " (best) vs. " + fourth + " (4nd)";
    var t1 = generateDisabledChartTab("tab-msx-best-vs-second-best", tab1Title, "tab-chart-class");
    var t2 = generateDisabledChartTab("tab-msx-best-vs-third-best", tab2Title, "tab-chart-class");
    var t3 = generateDisabledChartTab("tab-msx-best-vs-worst", tab3Title, "tab-chart-class");
    $("#msx-chart-tabs").append(t1);
    $("#msx-chart-tabs").append(t2);
    $("#msx-chart-tabs").append(t3);
}

function generateDisabledChartTab(cssId,text,className) {
    var b = document.createElement("BUTTON");
    b.setAttribute("id", cssId);
    b.setAttribute("class", className);
    b.innerHTML = text;
    b.onclick = function(e){
        enableChartTab(cssId);
        setActiveChartTab(cssId);
        currentExplManager.render("live");
    };
    return b;
}
function setActiveChartTab(tabId){
    activeMsxChart = tabId;
    chartTabSwitched = true;
}
function enableChartTab(tabId) {
    var i, tablinks;
    tablinks = document.getElementsByClassName("tab-chart-class");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    var tabControlToMakeActive = document.getElementById(tabId)
    tabControlToMakeActive.className += " active";
}
