
function getSelectionManager() {
	var sm = {};
    sm.selections = [];
    sm.defaultSelectionMade = false;
	
	sm.setSelections = function(info) {
		this.selections = info;
	}
    
    sm.clearSelections = function() {
        if (this.selections.length != 0) {
            var tempSelections = [];
            for (var i in this.selections) {
                var selection = this.selections[i];
                tempSelections.push(selection);
                
            }
            for (var i in tempSelections){
                var selection = tempSelections[i];
                this.removeSelection(selection);
            }
        }
    }
    
	sm.addSelection = function(selection) {
        //since not doing our own highlighting of bar, don't need to do isLegalTarget checking
        if (userStudyMode){
            var targetName = "rewardBar(" + selection[0] + "/" + selection[1] + ")";
            var targetArg = selection[0] + "/" + selection[1];
            if (this.defaultSelectionMade) {
				var logLine = templateMap["selectedRewardBar"];
				logLine = logLine.replace("<REGION>", "rewardChart");
				logLine = logLine.replace("<SLCT_RWRD_BAR>", targetArg);
        		chartTargetClickHandler(targetName, logLine);
                //chartTargetClickHandler(targetName, "selectRewardBar:" + targetArg);
                // clear any highlighing that might have been done for those items
                activeSaliencyDisplayManager.hideAllSaliencyMapOutlines();
                clearHighlightedShapesOnGameboard()
            }
        }
        this.defaultSelectionMade = true;
		this.selections.push(selection);
	}

	sm.removeSelection = function (selection) {
        //since not doing our own highlighting of bar, don't need to do isLegalTarget checking
        if (userStudyMode){
            var targetName = "rewardBar(" + selection[0] + "/" + selection[1] + ")";
            var targetArg = selection[0] + "/" + selection[1];
            if (this.defaultSelectionMade) {
				var logLine = templateMap["unselectedRewardBar"];
				logLine = logLine.replace("<REGION>", "rewardChart");
				logLine = logLine.replace("<UNSLCT_RWRD_BAR>", targetArg);
        		chartTargetClickHandler(targetName, logLine);
                //chartTargetClickHandler(targetName, "unselectRewardBar:" + targetArg);
            }
        }
		var newList = [];
		for (var i in this.selections) {
			var curSel = this.selections[i];
			if (curSel[0] == selection[0] && curSel[1] == selection[1]) {
				// skip
			}
			else {
				newList.push(curSel);
			}
		}
		this.selections = newList;
	}

	sm.isSelected = function(selection) {
		for (var i in this.selections) {
			var cur = this.selections[i];
			if (cur[0] == selection[0] && cur[1] == selection[1]) {
				return true;
			}
		}
		return false;
	}

	sm.getSelections = function(){
		return this.selections;
	}
	return sm;
}


var defaultSelectionsSet = {};

function clearDefaultSelections() {
    defaultSelectionsSet["rewards.combined"] = false;
    defaultSelectionsSet["rewards.detailed"] = false;
    defaultSelectionsSet["advantage.combined"] = false;
    defaultSelectionsSet["advantage.detailed"] = false;
}
clearDefaultSelections();

function rememberDefaultSelection(displayModeKey) {
    defaultSelectionsSet[displayModeKey] = true;
}
function wasDefaultSelectionDone(displayModeKey){
    return defaultSelectionsSet[displayModeKey];
}