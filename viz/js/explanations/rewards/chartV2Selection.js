function addSelectionFunctions (rawChartData) {
    var rd = rawChartData;

    rd.clearSaliencyMapSelections = function() {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                rd.actions[i].bars[j].saliencyMapSelected = false;
            }
        }
    }
    rd.clearRewardBarSelections = function () {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                rd.actions[i].bars[j].selected = false;
            }
        }
    }

    rd.clearRewardBarSelections();
    rd.clearSaliencyMapSelections();
    
    rd.getRewardBarSelectionCount = function () {
        var count = 0;
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                if (rd.actions[i].bars[j].selected) {
                    count++;
                }
            }
        }
        return count;
    }
    rd.getSelectedBars = function(){
        result = [];
        for (var i in rd.actionRewardNames){
            var name = rd.actionRewardNames[i];
            var bar = rd.actionRewardForNameMap[name];
            if (bar.selected){
                result.push(bar);
            }
        }
        return result;
    }
    rd.selectSingleRewardBar = function (barName) {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                if (rd.actions[i].bars[j].selected == true) {
                    rd.actions[i].bars[j].selected = false;
                }
                if (rd.actions[i].bars[j].fullName == barName) {
                    rd.actions[i].bars[j].selected = true;
                }
            }
        }
    }
    rd.multiSelectRewardBar = function (barName) {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                if (rd.actions[i].bars[j].fullName == barName) {
                    rd.actions[i].bars[j].selected = !(rd.actions[i].bars[j].selected);
                }
            }
        }
    }
    rd.clearRewardBarSaliencyHighlightSelections = function () {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                rd.actions[i].bars[j].saliencyMapSelected = false;
            }
        }
    }
    rd.highlightRewardBarSaliencyMap = function (barName) {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                if (rd.actions[i].bars[j].saliencyMapSelected == true) {
                    rd.actions[i].bars[j].saliencyMapSelected = false;
                }
                if (rd.actions[i].bars[j].fullName == barName) {
                    rd.actions[i].bars[j].saliencyMapSelected = true;
                }
            }
        }
    }
    rd.clearShowSaliencies = function() {
        for (var i in this.actionRewardNames){
            var name = this.actionRewardNames[i];
            var bar = this.actionRewardForNameMap[name];
            bar.showSaliencyMap = false;
        }
    }
    rd.showSalienciesForRewardBar = function(bar) {
        this.clearShowSaliencies();
        var matchingRewardName = bar.name;
        for (var i in this.actionRewardNames){
            var name = this.actionRewardNames[i];
            var bar = this.actionRewardForNameMap[name];
            if (bar.name == matchingRewardName){
                bar.showSaliencyMap = true;
            }
        }
    }
    rd.getBarsFlaggedForShowingSaliency = function(){
        var result = [];
        for (var i in this.actionRewardNames){
            var name = this.actionRewardNames[i];
            var bar = this.actionRewardForNameMap[name];
            if (bar.showSaliencyMap){
                result.push(bar);
            }
        }
        return result;
    }
    return rd;
}