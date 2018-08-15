const saliencyModeAggregate = "show combined saliency";
const saliencyModeDetailed = "show all saliencies";

const saliencyQuestionAggregate = "(Showing areas of greatest attention)";
const saliencyQuestionDetailed  = "(Showing areas of greatest attention by feature)";

 function getSaliencyDisplayManager(selectionManager) {
     var sdm = {};
//     sdm.saliencyMode = saliencyModeAggregate;
// 	sdm.saliencyMapPercentSize = 1.0;
// 	sdm.activeCheckBoxes = [];
// 	sdm.activeCheckBoxLabels = [];
// 	//A list of strings such as "attack bottom left *"  (for all bars) or "attack bottom left rewardX" 
// 	sdm.xaiSelectionManager = selectionManager;
//     sdm.rowInfosByName = {};
//     sdm.currentlyHighlightedSaliencyMapKey = undefined;
    
// 	sdm.setActiveRowInfo = function(activeRowInfos) {
//         // NEW_SAL control which saliency rows are visible
//         // NEW_SAL in one mode at least, saliency maps for losing actions are smaller
// 		this.rowInfosByName = {};
// 	}
	
// 	sdm.setSaliencyMode = function(mode){
// 		this.saliencyMode = mode;
//     }
    
// 	sdm.getSaliencyMode = function(mode){
// 		return this.saliencyMode;
// 	}
	
// 	sdm.registerRowInfoString = function(rowInfo, rowInfoString) {
//         //NEW_SAL info displayed to left of saliency; has to be UI friendly 
// 		this.rowInfosByName[rowInfoString] = rowInfo;
// 	}
	
// 	sdm.getRowInfoForRowInfoString = function(rowInfoString) {
// 		return this.rowInfosByName[rowInfoString];
// 	}
	
	// sdm.adjustCheckboxes = function(selectionsByName){
	// 	for (var i in this.activeCheckBoxes){
	// 		var checkBox = this.activeCheckBoxes[i];
	// 		checkBox.checked = false;
	// 	}
	// 	for (var i in selectionsByName) {
	// 		var selection = selectionsByName[i];
	// 		var checkBoxName = getRowInfoString(selection);
	// 		var checkBox = this.getCheckBoxWithName(checkBoxName);
	// 		checkBox.checked = true;
	// 	}
	// }
	
	// sdm.getCheckBoxWithName = function(name){
	// 	for (var i in this.activeCheckBoxes){
	// 		var cb = this.activeCheckBoxes[i];
	// 		var curName = cb.getAttribute("name");
	// 		if (curName == name) {
	// 			return cb;
	// 		}
	// 	}
	// 	alert("could not find checkbox with name " + name);
	// }
	
	// use checkboxes (which may have changed) to adjust the selection



	// sdm.isSelectedRow = function(rowInfo){
	// 	var rowInfos = this.xaiSelectionManager.getSelections();
	// 	for (var i in rowInfos){
	// 		var curRowInfo = rowInfos[i];
	// 		var curActionName = curRowInfo[0];
	// 		var curBarName = curRowInfo[1];
	// 		if (curActionName == rowInfo[0] && curBarName == rowInfo[1]){
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// }

	// sdm.hideCheckboxes = function() {
	// 	$("#saliency-checkboxes").empty();
	// }
	// sdm.renderCheckboxes = function() {
	// 	if (showCheckboxes) {
	// 		$("#saliency-checkboxes").empty();
	// 		for (var i in this.activeCheckBoxes){
	// 			var checkBox = this.activeCheckBoxes[i];
	// 			var checkBoxLabel = this.activeCheckBoxLabels[i];
	// 			$("#saliency-checkboxes").append(checkBox);
	// 			$("#saliency-checkboxes").append(checkBoxLabel);
	// 		}
	// 	}
    // }
    sdm.rankString = {};
    sdm.createRankStrings = function(barGroups) {
        //NEW_SAL UI friendly text to explain ranking of rowxs
        this.rankStrings ={};
        for (var i in barGroups) {
            var barGroup= barGroups[i];
            if (i == 0){
                this.rankString[barGroup.getName()] = "best action at D" + activeStudyQuestionManager.squim.getCurrentDecisionPointNumber();
            }
            else if (i == 1){
                this.rankString[barGroup.getName()] = "2nd best action at D" + activeStudyQuestionManager.squim.getCurrentDecisionPointNumber();
            }
            else {
                this.rankString[barGroup.getName()] = "";
            }
        }
    }
	// sdm.populateActionCheckBoxes = function() {	
    //     var barGroups = activeBarChartManager.groupsList;
    //     barGroups = rankThings(barGroups, getMaxValueBarGroupFromList);
    //     this.createRankStrings(barGroups);
	// 	for (var i in barGroups) {
	// 		var barGroup = barGroups[i];
	// 		var actionName = barGroup.getName();
	// 		var rowInfo = [ actionName, '*' ];
	// 		var checkBoxNameString = getRowInfoString(rowInfo);
	// 		this.registerRowInfoString(rowInfo, checkBoxNameString);
	// 		var checkBox = createCheckBox(checkBoxNameString);
	// 		checkBox.onclick = renderExplanationSaliencyMaps_Bridge;
	// 		if (this.isSelectedRow(rowInfo)) {
	// 			checkBox.checked = true;
	// 		}
	// 		var checkBoxLabel = document.createElement("LABEL");
			
	// 		var t = document.createTextNode(checkBoxNameString);
	// 		checkBoxLabel.appendChild(t);
			
	// 		var gridPositionInfoCheck = getGridPositionStyle(0,i);
	// 		checkBox.setAttribute("style", gridPositionInfoCheck + '; margin-left:30px; margin-top:10px;');
			
	// 		var gridPositionInfoName = getGridPositionStyle(1,i);
	// 		checkBoxLabel.setAttribute("style", gridPositionInfoName + '; width:200px; margin-top:10px; font-family:Arial;');
	// 		this.activeCheckBoxes.push(checkBox);
	// 		this.activeCheckBoxLabels.push(checkBoxLabel);
	// 	}
	// }
		
	// sdm.populateActionBarCheckBoxes = function(){
    //     var barGroups = activeBarChartManager.groupsList;
    //     barGroups = rankThings(barGroups, getMaxValueBarGroupFromList);
    //     this.createRankStrings(barGroups);
	// 	for (var i in barGroups) {
	// 		var barGroup = barGroups[i];
	// 		var actionName = barGroup.getName();
    //         var barsList = barGroup.getBarsList();
    //         barsList = rankThings(barsList, getMaxValueBarFromList);
	// 		var barCount = barsList.length;
	// 		for (var j in barsList){
	// 			var bar = barsList[j];
	// 			var barName = bar.getName();
	// 			var rowInfo = [ actionName, barName ];
	// 			var checkBoxNameString = getRowInfoString(rowInfo);
	// 			this.registerRowInfoString(rowInfo, checkBoxNameString);
	// 			var checkBox = createCheckBox(checkBoxNameString);
	// 			checkBox.onclick = renderExplanationSaliencyMaps_Bridge;
	// 			if (this.isSelectedRow(rowInfo)) {
	// 				checkBox.checked = true;
	// 			}
	// 			var checkBoxLabel = document.createElement("LABEL");
				
	// 			var t = document.createTextNode(checkBoxNameString);
	// 			checkBoxLabel.appendChild(t);
	// 			var rowIndex = Number(i * barCount) + Number(j);
	// 			var gridPositionInfoCheck = getGridPositionStyle(0,rowIndex);
	// 			checkBox.setAttribute("style", gridPositionInfoCheck + '; margin-left:30px; margin-top:10px; ');
				
	// 			var gridPositionInfoName = getGridPositionStyle(1,rowIndex);
	// 			checkBoxLabel.setAttribute("style", gridPositionInfoName + '; width:200px; margin-top:10px; font-family:Arial;');
	// 			this.activeCheckBoxes.push(checkBox);
	// 			this.activeCheckBoxLabels.push(checkBoxLabel);
	// 		}
	// 	}
	// }
	
	
	return sdm;
}

	

function createCheckBox(name) {
	var x = document.createElement("INPUT");
	x.setAttribute("type", "checkbox");
	x.setAttribute("name", name);
	return x;
}


