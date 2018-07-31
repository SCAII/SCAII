function getRewardBarTooltipManager(canvas, chartData){
    var ttm = {};

    ttm.chartData = chartData;
    ttm.canvas = canvas;

    ttm.generateTooltips= function(){
        this.chartData.positionTooltips();
        for (var i in this.chartData.actionRewardNames){
            var actionRewardName = this.chartData.actionRewardNames[i];
            var rewardBar = this.chartData.actionRewardForNameMap[actionRewardName];
            var tooltipText = "Value of " + rewardBar.name + " is " + Math.floor(rewardBar.value);
            rewardBar.tooltipID = createTooltipDiv(tooltipText, rewardBar, this.canvas);
        }
    }
    ttm.generateTooltips();

    canvas.onmousemove = function(e){
        var x = e.offsetX;
        var y = e.offsetY;
        var actionRewardName = chartData.getActionBarNameForCoordinates(x, y);
        if (actionRewardName == "None"){
            ttm.hideAllToolTips();
        }
        else {
            if (ttm.isToolTipShowingForRewardBar(actionRewardName)){
                // do nothing, it's already showing
            }
            else {
                ttm.hideAllToolTips();
                ttm.showTooltipForRewardBar(actionRewardName);
            }
        }
    }

    ttm.isToolTipShowingForRewardBar = function(actionRewardName){
        var rewardBar = chartData.actionRewardForNameMap[actionRewardName];
        var ttVisibility = $("#" + rewardBar.tooltipID).css("visibility");
        return (ttVisibility == "visible");
    }
    ttm.hideAllToolTips = function(){
        for (var i in this.chartData.actionRewardNames){
            var rewardBar = chartData.actionRewardForNameMap[this.chartData.actionRewardNames[i]];
            $("#" + rewardBar.tooltipID).css("visibility","hidden");
        }
    }
    ttm.showTooltipForRewardBar = function(actionRewardName){
        var rewardBar = chartData.actionRewardForNameMap[actionRewardName];
        $("#" + rewardBar.tooltipID).css("visibility","visible");
    }
    return ttm;
}

function createTooltipDiv(text, rewardBar, canvas) {
    var id = convertNameToLegalId("tooltip-" + rewardBar.fullName);
    var ttDiv = document.createElement("div");
    ttDiv.setAttribute("id",id);
    var canvas_bounds = canvas.getBoundingClientRect();
    var x = rewardBar.tooltipOriginX + canvas_bounds.left;
    var y = rewardBar.tooltipOriginY  + canvas_bounds.top;
    ttDiv.setAttribute("style", 'position:absolute;visibility:hidden;padding:4px;background-color:lightgrey;z-index:' + zIndexMap["tooltip"] + ';left:' + x + 'px;top:' + y + 'px;color:black;font-family:Arial');
    var textNode = document.createTextNode(text);
    ttDiv.append(textNode)
    $("#explanations-rewards").append(ttDiv);
    return id;
}