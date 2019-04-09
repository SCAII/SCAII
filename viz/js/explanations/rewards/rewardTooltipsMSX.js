function getMSXRewardBarTooltipManager(canvas, chartData){
    var ttm = {};

    ttm.chartData = chartData;
    ttm.canvas = canvas;

    ttm.generateTooltips= function(){
        var winningAction = this.chartData.actionBest;
        // winningAction will be undefined for unit tests, so skip
        if (winningAction != undefined){
            var losingAction = actionForMsxTabId[activeMsxChart];
            this.chartData.msxChartGeometry.positionTooltips(winningAction,0);
            this.chartData.msxChartGeometry.positionTooltips(losingAction,1);
            this.generateTooltipsForAction(winningAction);
            this.generateTooltipsForAction(losingAction);
            
        }
    }
    ttm.generateTooltipsForAction = function(action){
        for (var i in action.bars){
            var rewardBar = action.bars[i];
            var tooltipText = "Value of " + rewardBar.name + " is " + Math.floor(rewardBar.value);
            rewardBar.tooltipID = createMsxTooltipDiv(tooltipText, rewardBar, this.canvas);
        }
    }
    ttm.generateValueTooltips = function () {
        var winningAction = this.chartData.actionBest;
        // winningAction will be undefined for unit tests, so skip
        if (winningAction != undefined){
            var losingAction = actionForMsxTabId[activeMsxChart];
            this.chartData.msxChartGeometry.positionValueTooltips(winningAction);
            this.chartData.msxChartGeometry.positionValueTooltips(losingAction);
            this.generateValueTooltipsForAction(winningAction);
            this.generateValueTooltipsForAction(losingAction);
        }
    }
    ttm.generateValueTooltipsForAction = function(action) {
        for (var i in action.bars) {
            var rewardBar = action.bars[i];
            rewardBar.tooltipValueID = createMsxValueTooltipDiv(Math.floor(rewardBar.value), rewardBar, this.canvas);
        }
    }
    ttm.generateValueTooltips();
    ttm.generateTooltips();

    canvas.onmousemove = function(e){
        var x = e.offsetX;
        var y = e.offsetY;
        var winningAction = ttm.chartData.actionBest;
        var losingAction = actionForMsxTabId[activeMsxChart];
        var actionRewardName = chartData.msxChartGeometry.getActionBarNameForCoordinates(x, y, winningAction, losingAction);

        if (actionRewardName == "None"){
            ttm.hideAllToolTips();
        }
        else {
            //console.log("actionRewardName hovered over was " + actionRewardName);
            if (ttm.isToolTipShowingForRewardBar(actionRewardName)){
                // do nothing, it's already showing
            }
            else {
                ttm.hideAllToolTips();
                ttm.showTooltipForRewardBar(actionRewardName);

                ttm.showSimilarBarValues(actionRewardName, winningAction, losingAction);
            }
        }
    }

    ttm.isToolTipShowingForRewardBar = function(actionRewardName){
        var rewardBar = chartData.actionRewardForNameMap[actionRewardName];
        var ttVisibility = $("#tooltip-container-" + rewardBar.fullName).css("visibility");
        return (ttVisibility == "visible");
    }
    ttm.hideAllToolTips = function(){
        var winningAction = this.chartData.actionBest;
        var losingAction = actionForMsxTabId[activeMsxChart];
        this.hideTooltipsForAction(winningAction);
        this.hideTooltipsForAction(losingAction);
    }
    ttm.hideTooltipsForAction = function(action) {
        for (var i in action.bars){
            var rewardBar = action.bars[i];
            var toolContainerID = document.getElementById("tooltip-container-" + rewardBar.fullName);
            toolContainerID.style.visibility = "hidden";
            $("#" + rewardBar.tooltipValueID).css("visibility","hidden");
        }
    }
    ttm.showTooltipForRewardBar = function(actionRewardName){
        var rewardBar = chartData.actionRewardForNameMap[actionRewardName];
        var toolContainerID = document.getElementById("tooltip-container-" + rewardBar.fullName);
        toolContainerID.style.visibility = "visible";
    }
    ttm.showSimilarBarValues = function (actionRewardName, winningAction, losingAction) {
        var rewardBarName = actionRewardName.split(".")[1];
        var actions = [ winningAction, losingAction ];
        for (var i=0; i < actions.length; i++) {
            var action = actions[i];
            var similarBar = action.name + "." + rewardBarName;
            var rewardBar = chartData.actionRewardForNameMap[similarBar];
            $("#" + rewardBar.tooltipValueID).css("visibility","visible");
        }
    }
    return ttm;
}

function createMsxTooltipDiv(text, rewardBar, canvas) {
    var canvas_bounds = canvas.getBoundingClientRect();
    var x = rewardBar.msxChartGeometry.tooltipOriginX + canvas_bounds.left;
    var y = rewardBar.msxChartGeometry.tooltipOriginY  + canvas_bounds.top;

    var tooltipContainer = document.createElement("div");
    tooltipContainer.setAttribute("id", "tooltip-container-" + rewardBar.fullName);
    tooltipContainer.setAttribute("style", "position:absolute;left:" + (x + 13) + "px;top:" + y + "px;visibility:hidden");

    var id = convertNameToLegalId("tooltip-" + rewardBar.fullName);
    var ttDiv = document.createElement("div");
    ttDiv.setAttribute("id",id);
    ttDiv.setAttribute("style", 'width:100px;white-space: pre-wrap;' + 
    'padding:4px;background-color:#00aabb;' + 
    'z-index:' + zIndexMap["tooltip"] + ';' + 
    'color:black;font-family:Arial;' + 
    'border-radius:.4em;');
    ttDiv.innerHTML = text;

    tooltipContainer.append(ttDiv)

    $("#explanations-rewards").append(tooltipContainer);

    arrow = document.createElement("div");
    arrow.setAttribute("id", "arrow-" + rewardBar.fullName);
    var ttDivFromDOM = document.getElementById(id);
    var ttDivHeight = ttDivFromDOM.clientHeight;
    ttDivHeight = (ttDivHeight / 2) + 10;
    arrow.setAttribute("style", "position:relative;left:-10px;top:-" + ttDivHeight + "px;width:0; height:0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-right:10px solid #00aabb;");
    tooltipContainer.appendChild(arrow);

    var ttContainerDiv = document.getElementById("tooltip-container-" + rewardBar.fullName);
    ttContainerDiv.style.top = Number(y - (ttDivFromDOM.clientHeight / 2)) + "px";

    return id;
}

function createMsxValueTooltipDiv (text, rewardBar, canvas) {
    var id = convertNameToLegalId("tooltip-value-" + rewardBar.fullName);
    var ttDiv = document.createElement("div");
    ttDiv.setAttribute("id",id);
    var canvas_bounds = canvas.getBoundingClientRect();
    var x = rewardBar.msxChartGeometry.tooltipOriginX + canvas_bounds.left;
    var y = rewardBar.msxChartGeometry.tooltipOriginY  + canvas_bounds.top;
    ttDiv.setAttribute("style", 'position:absolute;visibility:hidden;padding:4px;pointer-events:none;z-index:' + zIndexMap["tooltip"] + ';left:' + x + 'px;top:' + y + 'px;color:black;font-family:Arial');
    var textNode = document.createTextNode(text);
    ttDiv.append(textNode)
    $("#explanations-rewards").append(ttDiv);
    return id;
}