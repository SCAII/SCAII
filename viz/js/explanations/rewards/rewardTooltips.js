function getRewardBarTooltipManager(){
    var ttm = {};

    ttm.chartData = undefined;
    ttm.canvas = undefined;

    ttm.setChartData = function(chartData) {
        this.chartData = chartData;
    }

    ttm.setCanvas = function(canvas){
        this.canvas = canvas;
        this.canvas.onmousemove = function(e){
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