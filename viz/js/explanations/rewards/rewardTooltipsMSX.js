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
    
    ttm.generatePairedTooltips= function(){
        var winningAction = this.chartData.actionBest;
        // winningAction will be undefined for unit tests, so skip
        if (winningAction != undefined){
            var losingAction = actionForMsxTabId[activeMsxChart];
            this.chartData.msxChartGeometry.positionPairedTooltips(winningAction,losingAction);
            this.generatePairedTooltip(winningAction, losingAction);            
        }
    }
    
    ttm.generatePairedTooltip = function(action1, action2){
        for (var i in action1.bars){
            var rewardBar1 = action1.bars[i];
            var rewardBar2 = action2.bars[i];
            var tooltipText = "Values of " + rewardBar2.name + " are " + Math.floor(rewardBar1.value) + " and " + Math.floor(rewardBar2.value);
            rewardBar1.tooltipID = createMsxPairedTooltipDiv(tooltipText, rewardBar1, this.canvas);
            rewardBar2.tooltipID = createMsxPairedTooltipDiv(tooltipText, rewardBar2, this.canvas);
        }
    }
    ttm.generateTooltipsForAction = function(action){
        for (var i in action.bars){
            var rewardBar = action.bars[i];
            var tooltipText = "Scaled value of " + rewardBar.name + " is " + Math.floor(rewardBar.msxChartGeometry.scaledValue);
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
    ttm.generatePairedTooltips();

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

function createMsxPairedTooltipDiv(text, rewardBar, canvas) {
    // game-chart-container is an unpositioned div
    // contains rewards-titled-container which is unpositioned
    // contains explanations-rewards which is unpositions
    // below we add tooltipContainer into explanations-rewards positioned absolute from browser origin
    //
    var arrowHalfWidth = 9;
    var arrowHeight = 12; 
    var tooltipBubbleHeight = 80;
    var minArrowStemLength = 30;
    var spaceToAvoidValueTooltipOverwrite = 15;
    var tooltipColor = "#00aabb";
    var canvas_bounds = canvas.getBoundingClientRect();
    var xDistanceFromTooltipEdgeToArrowTip = 40;
    var tooltipContainerOriginX = canvas_bounds.left + rewardBar.msxChartGeometry.tooltipPairOriginX1 - xDistanceFromTooltipEdgeToArrowTip;
    // make y 80 higher than the highest of the two bars
    var y1 = rewardBar.msxChartGeometry.tooltipPairOriginY1;
    var y2 = rewardBar.msxChartGeometry.tooltipPairOriginY2;
    var toolTipContainerOriginY = canvas_bounds.top + Math.min(y1,y2) - tooltipBubbleHeight - minArrowStemLength - arrowHeight;// i.e. tooltipBubbleHeight "above" the max value bar

    var tooltipContainer = document.createElement("div");
    tooltipContainer.setAttribute("id", "tooltip-container-" + rewardBar.fullName);
    tooltipContainer.setAttribute("style", "position:absolute;left:" + tooltipContainerOriginX + "px;top:" + toolTipContainerOriginY + "px;visibility:hidden");

    var id = convertNameToLegalId("tooltip-" + rewardBar.fullName);
    var ttDiv = document.createElement("div");
    ttDiv.setAttribute("id",id);
    var xDistanceBetweenBars = Math.abs(rewardBar.msxChartGeometry.tooltipPairOriginX1 - rewardBar.msxChartGeometry.tooltipPairOriginX2);
    var fullTooltipWidth = xDistanceFromTooltipEdgeToArrowTip * 2 + xDistanceBetweenBars;
    ttDiv.setAttribute("style", 'width:' + fullTooltipWidth + 'px;height:' + tooltipBubbleHeight + 'px;white-space: pre-wrap;' + 
    'padding:4px;background-color:' + tooltipColor + ';' + 
    'z-index:' + zIndexMap["tooltip"] + ';' + 
    'color:black;font-family:Arial;' + 
    'border-radius:.4em;');
    
    ttDiv.innerHTML = text;

    tooltipContainer.append(ttDiv);

    $("#explanations-rewards").append(tooltipContainer);
    // Tooltip positioning has computed the tips of both downward arrows of the two arrow bubble.
    // rewardBar.msxChartGeometry.tooltipPairOriginX1
    // rewardBar.msxChartGeometry.tooltipPairOriginY1
    // rewardBar.msxChartGeometry.tooltipPairOriginX2
    // rewardBar.msxChartGeometry.tooltipPairOriginY2
    // 
    
    var leftArrowOriginRelativeToTTDivX = xDistanceFromTooltipEdgeToArrowTip - arrowHalfWidth;
    var rightArrowOriginRelativeToTTDivX = xDistanceFromTooltipEdgeToArrowTip + xDistanceBetweenBars - arrowHalfWidth;
    var barHeightDifference = Math.abs(y1 - y2);
    var leftArrowOriginRelativeToTTDivY;
    var rightArrowOriginRelativeToTTDivY;
    var spaceToAvoidOverwritingValueLeft = 0;
    var spaceToAvoidOverwritingValueRight = 0;
    if (rewardBar.msxChartGeometry.leftBarIsPositive){
        spaceToAvoidOverwritingValueLeft = spaceToAvoidValueTooltipOverwrite;
    }
    if (rewardBar.msxChartGeometry.rightBarIsPositive){
        spaceToAvoidOverwritingValueRight = spaceToAvoidValueTooltipOverwrite;
    }
    if (y1 >= y2){ // right bar is taller or same
        leftArrowOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength + barHeightDifference - spaceToAvoidOverwritingValueLeft;
        rightArrowOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength - spaceToAvoidOverwritingValueRight;
    }
    else { // left bar is taller 
        leftArrowOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength - spaceToAvoidOverwritingValueLeft;
        rightArrowOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength + barHeightDifference - spaceToAvoidOverwritingValueRight;
    }
    var arrowHeadLeft  = createDownwardArrowhead("arrow-left-"  + rewardBar.fullName,arrowHeight, arrowHalfWidth, leftArrowOriginRelativeToTTDivX, leftArrowOriginRelativeToTTDivY, tooltipColor);
    var arrowHeadRight = createDownwardArrowhead("arrow-right-" + rewardBar.fullName,arrowHeight, arrowHalfWidth, rightArrowOriginRelativeToTTDivX, rightArrowOriginRelativeToTTDivY, tooltipColor);
    tooltipContainer.appendChild(arrowHeadLeft);
    tooltipContainer.appendChild(arrowHeadRight);
     
    var stemHeightLeft = leftArrowOriginRelativeToTTDivY - tooltipBubbleHeight;
    var stemHeightRight = rightArrowOriginRelativeToTTDivY - tooltipBubbleHeight;
    var stemWidth = (arrowHalfWidth - 4) * 2;
    var leftArrowStemOriginRelativeToTTDivX = xDistanceFromTooltipEdgeToArrowTip - (stemWidth/2);
    var leftArrowStemOriginRelativeToTTDivY = tooltipBubbleHeight 
    var rightArrowStemOriginRelativeToTTDivX = xDistanceFromTooltipEdgeToArrowTip - (stemWidth/2) + xDistanceBetweenBars;
    var rightArrowStemOriginRelativeToTTDivY = tooltipBubbleHeight
    // if (y1 >= y2){ // right bar is taller or same
    //     leftArrowStemOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength + barHeightDifference - spaceToAvoidOverwritingValueLeft;
    //     rightArrowStemOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength - spaceToAvoidOverwritingValueRight;
    // }
    // else { // left bar is taller 
    //     leftArrowOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength - spaceToAvoidOverwritingValueLeft;
    //     rightArrowOriginRelativeToTTDivY = tooltipBubbleHeight + minArrowStemLength + barHeightDifference - spaceToAvoidOverwritingValueRight;
    // }
    var arrowStemLeft  = createArrowStem("arrow-stem-left-"  + rewardBar.fullName, stemHeightLeft, stemWidth, leftArrowStemOriginRelativeToTTDivX, leftArrowStemOriginRelativeToTTDivY, tooltipColor);
    var arrowStemRight = createArrowStem("arrow-stem-right-" + rewardBar.fullName, stemHeightRight, stemWidth, rightArrowStemOriginRelativeToTTDivX, rightArrowStemOriginRelativeToTTDivY, tooltipColor);
    tooltipContainer.appendChild(arrowStemLeft);
    tooltipContainer.appendChild(arrowStemRight);  //var ttContainerDiv = document.getElementById("tooltip-container-" + rewardBar.fullName);
   // ttContainerDiv.style.top = Number(y - (ttDivFromDOM.clientHeight / 2)) + "px";

    return id;
}

function createArrowStem(stemId,stemHeight, stemWidth, relativePositionLeft, relativePositionTop, arrowColor){
    var stem = document.createElement("div");
    stem.setAttribute("id", stemId);
    stem.setAttribute("style", "position:absolute;left:" + relativePositionLeft + "px;top:" + relativePositionTop + "px;width:"+stemWidth + "px; height:" + stemHeight +"px; background-color:" + arrowColor + ";");
    return stem;
}

function createDownwardArrowhead(arrowId,arrowHeight, arrowHalfWidth, relativePositionLeft, relativePositionTop, arrowColor){
    var arrowHead = document.createElement("div");
    arrowHead.setAttribute("id", arrowId);
    arrowHead.setAttribute("style", "position:absolute;left:" + relativePositionLeft + "px;top:" + relativePositionTop + "px;width:0; height:0; border-top: " + arrowHeight + "px solid " + arrowColor + "; border-left: " + arrowHalfWidth + "px solid transparent; border-right:" + arrowHalfWidth + "px solid transparent;");
    return arrowHead;
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