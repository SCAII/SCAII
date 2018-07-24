function wrapChartData(rawChartData) {
    var rd = rawChartData;
    for (var i in rd.actions) {
        for (var j in rd.actions[i].bars) {
            rd.actions[i].bars[j].selected = false;
            rd.actions[i].bars[j].saliencyMapSelected = false;
        }
    }

    rd.getActionForName = function (actionName) {
        for (var i in rd.actions) {
            if (rd.actions[i].actionBarName == actionName) {
                return rd.actions[i];
            }
        }
    }
    rd.getRewardForName = function (actionName, rewardName) {
        for (var i in rd.actions) {
            if (rd.actions[i].actionBarName == actionName) {
                for (var j in rd.actions[i].bars) {
                    if (rd.actions[i].bars[j].rewardBarNames == rewardName) {
                        return rd.actions[i].bars[j];
                    }
                }
            }
        }
    }
    rd.clearSelections = function () {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                rd.actions[i].bars[j].selected = false;
            }
        }
    }
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
    rd.selectSingleRewardBar = function (barName) {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                if (rd.actions[i].bars[j].selected == true) {
                    rd.actions[i].bars[j].selected = false;
                }
                if (rd.actions[i].bars[j].name == barName) {
                    rd.actions[i].bars[j].selected = true;
                }
            }
        }
    }
    rd.multiSelectRewardBar = function (barName) {
        for (var i in rd.actions) {
            for (var j in rd.actions[i].bars) {
                if (rd.actions[i].bars[j].name == barName) {
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
                if (rd.actions[i].bars[j].name == barName) {
                    rd.actions[i].bars[j].saliencyMapSelected = true;
                }
            }
        }
    }

    return rd;
}