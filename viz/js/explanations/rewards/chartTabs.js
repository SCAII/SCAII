
function generateChartTabs() {
    var t1 = generateDisabledChartTab("tab-msx-best-vs-second-best", "Best vs Second Best", "tab-chart-class");
    var t1 = generateDisabledChartTab("tab-msx-best-vs-third-best", "Best vs Third Best", "tab-chart-class");
    var t1 = generateDisabledChartTab("tab-msx-best-vs-worst", "Best vs Fourth Best", "tab-chart-class");
    $("#msx-chart-tabs").append(t1);
    $("#msx-chart-tabs").append(t2);
    $("#msx-chart-tabs").append(t3);
}

function generateDisabledChartTab(cssId,text,className) {
    var b = document.createElement("BUTTON");
    b.disabled = true;
    b.setAttribute("id", cssId);
    b.setAttribute("class", className);
    b.innerHTML = text;
    b.onclick = function(e){
        enableChartTab(cssId);
    };
    return b;
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