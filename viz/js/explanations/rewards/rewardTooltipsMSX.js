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
            var tooltipText;
            if (rewardBar2.msxImportantBar){
                tooltipText = "Values of " + rewardBar2.name + " are " + Math.floor(rewardBar1.value) + " and " + Math.floor(rewardBar2.value);
            }
            else {
                tooltipText = "The agent did not find this as influential as the colored bars in its decision."
            }
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
            var toolContainerID = document.getElementById(convertNameToLegalId("tooltip-container-" + rewardBar.fullName));
            toolContainerID.style.visibility = "hidden";
            $("#" + rewardBar.tooltipValueID).css("visibility","hidden");
        }
    }
    ttm.showTooltipForRewardBar = function(actionRewardName){
        var rewardBar = chartData.actionRewardForNameMap[actionRewardName];
        var toolContainerID = document.getElementById(convertNameToLegalId("tooltip-container-" + rewardBar.fullName));
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
function getMSXTooltipConstants(rewardBar, canvas) {
    var c = {};
    c.arrowHalfWidth = 9;
    c.arrowheadHeight = 12; 
    c.minArrowStemLength = 30;
    c.spaceToAvoidValueTooltipOverwrite = 15;
    c.tooltipColor = "#00aabb";
    c.canvas_bounds = canvas.getBoundingClientRect();
    c.xDistanceFromTooltipEdgeToArrowTip = 40;
    c.bubblePadding = 4;
    c.stemWidth = (c.arrowHalfWidth - 4) * 2;
    c.xDistanceBetweenBars = Math.abs(rewardBar.msxChartGeometry.tooltipPairOriginX1 - rewardBar.msxChartGeometry.tooltipPairOriginX2);
    c.bubbleWidth = c.xDistanceFromTooltipEdgeToArrowTip * 2 + c.xDistanceBetweenBars;
    return c;
}
function getBlankMSXTooltipInfo(){
    var tti = {};
    tti.spaceToAvoidOverwritingValueLeft = 0;
    tti.spaceToAvoidOverwritingValueRight = 0;
    tti.maxSpaceToAvoidOverwritingValue = undefined;
    tti.bubbleDivId = undefined;
    tti.bubbleDiv = undefined;
    tti.tooltipContainerOriginX = undefined;
    tti.tooltipContainerOriginy = undefined;

    // arrowhead coords
    tti.leftArrowheadTipY = undefined;
    tti.rightArrowheadTipY = undefined;
    tti.leftArrowheadOriginX = undefined;
    tti.leftArrowheadOriginY = undefined;
    tti.rightArrowheadOriginX = undefined;
    tti.rightArrowheadOriginY = undefined;

    // stem size and coords
    tti.stemHeightLeft = undefined;
    tti.stemHeightRight =undefined;
    tti.leftArrowStemOriginX = undefined;
    tti.leftArrowStemOriginY = undefined;
    tti.rightArrowStemOriginX = undefined;
    tti.rightArrowStemOriginY = undefined;

    tti.barHeightDifference = undefined;
    return tti;
}
function allowSpaceAbovePositiveBarsSoDontBlockValue(constants, rewardBar, tti){
    if (rewardBar.msxChartGeometry.leftBarIsPositive){
        tti.spaceToAvoidOverwritingValueLeft = constants.spaceToAvoidValueTooltipOverwrite;
    }
    if (rewardBar.msxChartGeometry.rightBarIsPositive){
        tti.spaceToAvoidOverwritingValueRight = constants.spaceToAvoidValueTooltipOverwrite;
    }
    tti.maxSpaceToAvoidOverwritingValue = Math.max(tti.spaceToAvoidOverwritingValueRight, tti.spaceToAvoidOverwritingValueLeft)
}
function createBubbleDiv(constants, rewardBar, tti, text){
    tti.bubbleDivId = convertNameToLegalId("tooltip-bubble-" + rewardBar.fullName);
    tti.bubbleDiv = document.createElement("div");
    tti.bubbleDiv.setAttribute("id",tti.bubbleDivId);
    tti.bubbleDiv.setAttribute("style", 'width:' + constants.bubbleWidth + 'px;white-space: pre-wrap;' + 
    'padding:' + constants.bubblePadding + 'px;background-color:' + constants.tooltipColor + ';' + 
    'z-index:' + zIndexMap["tooltip"] + ';' + 
    'color:black;font-family:Arial;' + 
    'border-radius:.4em;');
    tti.bubbleDiv.innerHTML = text;
    return tti.bubbleDiv;
}
function setMSXTooltipContainerOrigin(constants, rewardBar, tti){
    tti.tooltipContainerOriginX = constants.canvas_bounds.left + rewardBar.msxChartGeometry.tooltipPairOriginX1 - constants.xDistanceFromTooltipEdgeToArrowTip;
    // make y 80 higher than the highest of the two bars
    tti.leftArrowheadTipY = rewardBar.msxChartGeometry.tooltipPairOriginY1;
    tti.rightArrowheadTipY = rewardBar.msxChartGeometry.tooltipPairOriginY2;
    var yCoordOfTopOfTallestRewardBarInPair = Math.min(tti.leftArrowheadTipY,tti.rightArrowheadTipY);

    // to calculate the y coord of the top of the tooltip container,we start at the origin of the canvas...
    var y = constants.canvas_bounds.top;
    //...add the distance to the tallest reward bar of the pair...
    y += yCoordOfTopOfTallestRewardBarInPair;
    // ... subtract enough to avoid covering the value tooltip that is above any positive bar (computed prior)
    y -= tti.maxSpaceToAvoidOverwritingValue;
    //...subtract the height of the arrowhead...
    y -= constants.arrowheadHeight;
    //...subtract the shortest arrow stem...
    y -= constants.minArrowStemLength;
    //... subtract the height of the bubble...
    y -= tti.tooltipBubbleHeight;
    tti.toolTipContainerOriginY = y;
}
function setArrowheadOrigins(constants, tti){
    tti.leftArrowheadOriginX = constants.xDistanceFromTooltipEdgeToArrowTip - constants.arrowHalfWidth;
    tti.rightArrowheadOriginX = constants.xDistanceFromTooltipEdgeToArrowTip + constants.xDistanceBetweenBars - constants.arrowHalfWidth;
    tti.barHeightDifference = Math.abs(tti.leftArrowheadTipY - tti.rightArrowheadTipY);
    tti.leftArrowheadOriginY;
    tti.rightArrowheadOriginY;
    
    if (tti.leftArrowheadTipY >= tti.rightArrowheadTipY){ // right bar is taller or same
        tti.leftArrowheadOriginY = tti.tooltipBubbleHeight + constants.minArrowStemLength + tti.barHeightDifference;
        tti.rightArrowheadOriginY = tti.tooltipBubbleHeight + constants.minArrowStemLength;
    }
    else { // left bar is taller 
        tti.leftArrowheadOriginY = tti.tooltipBubbleHeight + constants.minArrowStemLength;
        tti.rightArrowheadOriginY = tti.tooltipBubbleHeight + constants.minArrowStemLength + tti.barHeightDifference;
    }
}

function setArrowStemOrigins(constants, tti){
    var c = constants;
    tti.stemHeightLeft = tti.leftArrowheadOriginY - tti.tooltipBubbleHeight - c.bubblePadding;
    tti.stemHeightRight = tti.rightArrowheadOriginY - tti.tooltipBubbleHeight - c.bubblePadding;
    tti.leftArrowStemOriginX = c.xDistanceFromTooltipEdgeToArrowTip - (c.stemWidth/2);
    tti.leftArrowStemOriginY = tti.tooltipBubbleHeight + c.bubblePadding;
    tti.rightArrowStemOriginX = c.xDistanceFromTooltipEdgeToArrowTip - (c.stemWidth/2) + c.xDistanceBetweenBars;
    tti.rightArrowStemOriginY = tti.tooltipBubbleHeight + c.bubblePadding;
}
function createMsxPairedTooltipDiv(text, rewardBar, canvas) {
    // game-chart-container is an unpositioned div
    // contains rewards-titled-container which is unpositioned
    // contains explanations-rewards which is unpositions
    // below we add tooltipContainer into explanations-rewards positioned absolute from browser origin
    //
    
    // Tooltip positioning has computed the tips of both downward arrows of the two arrow bubble.
    // rewardBar.msxChartGeometry.tooltipPairOriginX1
    // rewardBar.msxChartGeometry.leftArrowheadTipY
    // rewardBar.msxChartGeometry.tooltipPairOriginX2
    // rewardBar.msxChartGeometry.rightArrowheadTipY
    var c = getMSXTooltipConstants(rewardBar, canvas);
    var tti = getBlankMSXTooltipInfo();
    allowSpaceAbovePositiveBarsSoDontBlockValue(c, rewardBar, tti);

    // create bubble and add it in so we can compute the height based on text needs
    var bubbleDiv = createBubbleDiv(c, rewardBar, tti, text);
    var tooltipContainer = document.createElement("div");
    
    tooltipContainer.append(bubbleDiv);
    $("#explanations-rewards").append(tooltipContainer);
    tti.tooltipBubbleHeight = $("#" + tti.bubbleDivId).height();
    // setting origin must wait until bubble size is known
    setMSXTooltipContainerOrigin(c,rewardBar, tti);
    var id = convertNameToLegalId("tooltip-container-" + rewardBar.fullName);
    tooltipContainer.setAttribute("id", id);
    tooltipContainer.setAttribute("style", "position:absolute;left:" + tti.tooltipContainerOriginX + "px;top:" + tti.toolTipContainerOriginY + "px;visibility:hidden");

    setArrowheadOrigins(c, tti);
    var arrowHeadLeft  = createDownwardArrowhead(convertNameToLegalId("arrow-left-"  + rewardBar.fullName),c, tti.leftArrowheadOriginX, tti.leftArrowheadOriginY);
    var arrowHeadRight = createDownwardArrowhead(convertNameToLegalId("arrow-right-" + rewardBar.fullName),c, tti.rightArrowheadOriginX, tti.rightArrowheadOriginY);
    tooltipContainer.appendChild(arrowHeadLeft);
    tooltipContainer.appendChild(arrowHeadRight);
     
    setArrowStemOrigins(c, tti);
    var arrowStemLeft  = createArrowStem(convertNameToLegalId("arrow-stem-left-"  + rewardBar.fullName), tti.stemHeightLeft, c, tti.leftArrowStemOriginX, tti.leftArrowStemOriginY);
    var arrowStemRight = createArrowStem(convertNameToLegalId("arrow-stem-right-" + rewardBar.fullName), tti.stemHeightRight, c, tti.rightArrowStemOriginX, tti.rightArrowStemOriginY);
    tooltipContainer.appendChild(arrowStemLeft);
    tooltipContainer.appendChild(arrowStemRight);
    return id;
}

function createArrowStem(stemId,stemHeight, constants, stemOriginX, stemOriginY){
    var c = constants;
    var stem = document.createElement("div");
    stem.setAttribute("id", stemId);
    stem.setAttribute("style", "position:absolute;z-index:" + zIndexMap["tooltip"] + ";left:" + stemOriginX + "px;top:" + stemOriginY + "px;width:"+c.stemWidth + "px; height:" + stemHeight +"px; background-color:" + c.tooltipColor + ";");
    return stem;
}

function createDownwardArrowhead(arrowId, constants, originX, originY){
    var arrowHead = document.createElement("div");
    arrowHead.setAttribute("id", arrowId);
    arrowHead.setAttribute("style", "position:absolute;left:" + originX + "px;top:" + originY + 
                            "px;width:0; height:0; border-top: " + constants.arrowheadHeight + "px solid " + constants.tooltipColor + 
                            "; border-left: " + constants.arrowHalfWidth + 
                            "px solid transparent; border-right:" + constants.arrowHalfWidth + "px solid transparent;");
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