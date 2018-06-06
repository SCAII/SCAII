
function getStateMonitor() {
    sm = {};
    

    sm.getRewardKey = function(){ return "rewardsVisible"; }
    sm.getSaliencyKey = function(){ return "saliencyVisible"; }
    sm.getSaliencyViewKey = function(){ return "saliencyView"; }
    
    return sm;
}