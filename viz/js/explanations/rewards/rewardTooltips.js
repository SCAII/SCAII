function getRewardBarTooltipManager(canvas, chartData){
    var ttm = {};

    ttm.chartData = chartData;
    ttm.canvas = canvas;

    canvas.onmousemove = function(e){
        var x = e.offsetX;
        var y = e.offsetY;
        var rewardBarName = chartData.getBarNameForCoordinates(x, y);
        if (this.isToolTipShowingForRewardBar(rewardBarName)){
            // do nothing, it's already showing
        }
        else {
            this.hideAllToolTips();
            this.showTooltipForRewardBar(rewardBarName);
        }
    }

    ttm.isToolTipShowingForRewardBar = function(rewardBarName){
        return true;
    }
    ttm.hideAllToolTips = function(){

    }
    ttm.showTooltipForRewardBar = function(rewardBarName){

    }
    return ttm;
}