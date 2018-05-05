var activeDataTable = undefined;
var activeOptions = undefined;
//Why was action chosen
const rewardQuestionAggregate = "(Showing summed rewards for actions)";
const rewardQuestionDetailed  = "(Showing detailed rewards for actions)";

function getBarChartManager(barChartMessage,selectionManager,saliencyDisplayManager,isCombined,isRewardMode) {
	
	// selection
	var bcm = {};
	bcm.barChartMessage = barChartMessage;
	bcm.groupsList = barChartMessage.getGroupsList();
	bcm.selectionManager = selectionManager;
	bcm.saliencyDisplayManager = saliencyDisplayManager;
	bcm.isCombined = isCombined;
	bcm.isRewardMode = isRewardMode;
	
	bcm.convertGoogleChartSelectionsToSelectionsByName = function(googleChartSelections){
		var selectionsByName = [];
		console.log("SELECTION from getSelection() looks like: ");
		console.log(googleChartSelections);
		for (var i in googleChartSelections){
			var selection = googleChartSelections[i];
			var col = selection["column"];
			var row = selection["row"];
			var selectionByName = this.getNameInfoForChartCoords([row, col]);
			selectionsByName.push(selectionByName);
		}
		return selectionsByName;
	}
	
	bcm.convertSelectionsByNameToGoogleChartSelections = function(selectionsByName) {
		var googleChartSelections = [];
		for (var i in selectionsByName) {
			var selectionByName = selectionsByName[i];
			var coordsForChart = this.getChartCoordsForNames(selectionByName[0], selectionByName[1]);
			var row = coordsForChart[0];
			var col = coordsForChart[1];
			var googleChartSelection = {};
			googleChartSelection["column"] = col;
			googleChartSelection["row"] = row;
			googleChartSelections.push(googleChartSelection);
		}
		return googleChartSelections;
	}
	
	bcm.getNameInfoForChartCoords = function(rowCol) {
		var row = rowCol[0];
		var col = rowCol[1];
		var groups = this.groupsList;
		for (var i in groups){
			var group = groups[i];
			var curName = group.getName();
			if (i == row){
				if (this.isCombined) {
					return [curName, "*"];
				}
				else {
					var bars = group.getBarsList();
					for (var j in bars){
						if (j == col - 1) {// account for name column on the left side of the table
							var bar = bars[j];
							var curBarName = bar.getName();
							return [curName, curBarName];
						}
					}
				}
			}
		}
	}
	
	// chart coords in data model given to chart renderer
	bcm.getChartCoordsForNames = function(groupName, barName){
		var row = undefined;
		var col = undefined;
		var groups = this.groupsList;
		for (var i in groups){
			var group = groups[i];
			var curName = group.getName();
			if (curName == groupName) {
				row = i;
				if (barName == "*") {
					col = 1;
				}
				else {
					var bars = group.getBarsList();
					for (var j in bars){
						var bar = bars[j];
						var curBarName = bar.getName();
						if (curBarName == barName) {
							col = j + 1 // account for name column on the left side of the table
						}
					}
				}
			}
		}
		//the col was undefined when I clicked on attack top right agent death
		return [row, col];
	}
	
	
	bcm.getTableForGoogleChart = function(){
		var chartTable = undefined;
		if (this.isCombined && this.isRewardMode) {
			chartTable = this.getTableForGoogleChartAggregateRewards();
		}
		else if (this.isCombined && !this.isRewardMode){
			// combined advantage
			chartTable = this.getTableForGoogleChartAggregateAdvantage();
		}
		else if (!this.isCombined && this.isRewardMode){
			chartTable = this.getTableForGoogleChartDetailedReward();
		}
		else {
			// !this.isCombined && !this.isRewardMode i.e. detailed advantage
			chartTable = this.getTableForGoogleChartDetailedAdvantage();
		}
		return chartTable;
	}



	bcm.getTableForGoogleChartAggregateRewards = function() {
		// need structure to look like this
		// var chartTable = [
			// ['', 'r', ],
			// ['unit victorious', 0.77],
			// ['unit loses', -0.39],
			// ['adversary flees', 0.2]
		  // ]; 
		 var rowWithRewardNames = getRewardNameRowOneBarPerAction();
		 var chartTable = [];
		 chartTable.push(rowWithRewardNames);
		 
		 var barGroups = this.groupsList;
		 for (var i in barGroups){
			 var barGroup = barGroups[i];
			 var barValuesRow = getBarValuesRowOneBarPerAction(barGroup);
			 chartTable.push(barValuesRow);
		 }
		 //console.log("chartTable for actions:");
		 //console.log(chartTable);
		 return chartTable;
	}

	
	bcm.getTableForGoogleChartAggregateAdvantage = function() {
		// need structure to look like this
		// var chartTable = [
			// ['', 'r', ],
			// ['unit victorious', 0.77],
			// ['unit loses', -0.39],
			// ['adversary flees', 0.2]
		  // ]; 
		 var rowWithRewardNames = getRewardNameRowOneBarPerAction();
		 var chartTable = [];
		 chartTable.push(rowWithRewardNames);
		 
		 var barGroups = this.groupsList;
		 var maxBarGroup = this.getMaxValueBarGroup();
		 for (var i in barGroups){
			 var barGroup = barGroups[i];
			 var barValuesRow = this.getBarAdvantagesRowOneBarPerAction(barGroup, maxBarGroup);
			 chartTable.push(barValuesRow);
		 }
		 //console.log("chartTable for actions:");
		 //console.log(chartTable);
		 return chartTable;
	}

	bcm.getTableForGoogleChartDetailedReward = function() {
		// need structure to look like this
		// var chartTable = [
			// ['', 'r1', 'r2'],
			// ['unit victorious', 0.77, 0.4],
			// ['unit loses', -0.39, 0.6],
			// ['adversary flees', 0.2, 0.3]
		  // ]; 
		 var rowWithRewardNames = this.getRewardNameRowNBarsPerAction();
		 var chartTable = [];
		 chartTable.push(rowWithRewardNames);
		 
		 var barGroups = this.groupsList;
		 for (var i in barGroups){
			 var barGroup = barGroups[i];
			 var barValuesRow = this.getBarValuesRowNBarsPerAction(barGroup);
			 chartTable.push(barValuesRow);
		 }
		 //console.log("chartTable for types:");
		 //console.log(chartTable);
		 return chartTable;
	}
	
	
	bcm.getTableForGoogleChartDetailedAdvantage = function() {
		// need structure to look like this
		// var chartTable = [
			// ['', 'r1', 'r2'],
			// ['unit victorious', 0.77, 0.4],
			// ['unit loses', -0.39, 0.6],
			// ['adversary flees', 0.2, 0.3]
		  // ]; 
		 var rowWithRewardNames = this.getRewardNameRowNBarsPerAction();
		 var chartTable = [];
		 chartTable.push(rowWithRewardNames);
		 
		 var maxBarGroup = this.getMaxValueBarGroup();
		 var barGroups = this.groupsList;
		 for (var i in barGroups){
			 var barGroup = barGroups[i];
			 var barValuesRow = this.getBarAdvantagesRowNBarsPerAction(barGroup, maxBarGroup);
			 chartTable.push(barValuesRow);
		 }
		 //console.log("chartTable for types:");
		 //console.log(chartTable);
		 return chartTable;
	}

	
	
	bcm.getBarAdvantagesRowOneBarPerAction = function(barGroup, maxBarGroup) {
		var barValueRow = [];
		barValueRow.push(barGroup.getName());
		var barGroupValue = getValueForBarGroup(barGroup);
		var maxBarGroupValue = getValueForBarGroup(maxBarGroup);
		var diff = barGroupValue - maxBarGroupValue;
		barValueRow.push(diff);
		return barValueRow;
	}
	
	bcm.getBarValuesRowNBarsPerAction = function(barGroup) {
		var barValueRow = [];
		barValueRow.push(barGroup.getName());
		var bars = barGroup.getBarsList();
		for (var i in bars){
			 var bar = bars[i];
			 var value = bar.getValue();
			 barValueRow.push(value);
		 }
		 return barValueRow;
	}
	
	bcm.getBarAdvantagesRowNBarsPerAction = function(barGroup, maxBarGroup) {
		var barValueRow = [];
		barValueRow.push(barGroup.getName());
		var bars = barGroup.getBarsList();
		var maxBars = maxBarGroup.getBarsList();
		for (var i in bars){
			 var bar = bars[i];
			 var maxBar = maxBars[i];
			 var value = bar.getValue() - maxBar.getValue();
			 barValueRow.push(value);
		 }
		 return barValueRow;
	}

	bcm.getRewardNameRowNBarsPerAction = function() {
		var rewardNameRow = [''];
		// any of the BarGroups can be used to fill in the reward names
		var barGroups = this.groupsList;
		var barGroup = barGroups[0];
		var bars = barGroup.getBarsList();
		for (var i in bars){
			var bar = bars[i];
			rewardNameRow.push(bar.getName());
		}
		return rewardNameRow;
	}
	bcm.getOptionsForBarChartMessage = function() {
		var options = {
			//legend: { position: "none" },
			title: this.barChartMessage.getTitle(),
			//chartArea: {width: '50%', left:70},
			chartArea: {width: '50%', left:"15%"},
			hAxis: {
			  title: this.barChartMessage.getVTitle(),
			  //minValue: 0
			},
			vAxis: {
			  title: this.barChartMessage.getHTitle(),
			},
			'width':700,
			'height':400
		  };
		  return options;
	}
	
	
	bcm.getSaliencyIdForActionNameAndBar = function(actionName, barName) {
		var barGroups = this.groupsList;
		for (var i in barGroups){
			var barGroup = barGroups[i];
			if (barGroup.getName() == actionName) {
				if (barName == "*"){
					var saliencyId = barGroup.getSaliencyId();
					return saliencyId;
				}
				else {
					var bars = barGroup.getBarsList();
					for (var j in bars){
						var bar = bars[j];
						var curBarName = bar.getName();
						if (curBarName == barName) {
							var saliencyId = bar.getSaliencyId();
							return saliencyId;
						}
					}
				}
			}
		}
		alert('could not find saliencyId for actionName ' + actionName);
	}
	
	bcm.renderExplanationBarChart = function() {
		if ($("#explanations-rewards").length) {
			$("#explanations-rewards").empty();
		}
		var options = this.getOptionsForBarChartMessage();
		var chartTable = this.getTableForGoogleChart();
		if (chartTable == undefined){
			console.log("ERROR - chartTable could not be harvested for barChart ");
		} else if (options == undefined){
			console.log("ERROR - chartOptions could not be harvested for barChart ");
		}
		else {
			drawBarChart(chartTable, options);
			var selection = this.createGoogleChartSelections();
			//console.log("selection I created looks like: ");
			//console.log(selection);
			googleChart.setSelection(selection);
		}
	}
	
	bcm.createGoogleChartSelections = function(){
		var selections = this.selectionManager.getSelections();
		var googleChartSelections = this.convertSelectionsByNameToGoogleChartSelections(selections);
		return googleChartSelections;
	}
	
	// default to highest score, aggregate i.e. highest scoring task
	bcm.setDefaultSelections = function() {
		var barGroup = this.getMaxValueBarGroup();
		var barGroupName = barGroup.getName();
		var selections = [];
		var rowInfo = undefined;
		if (this.isCombined) {
			rowInfo = [ barGroupName, "*"];
		}
		else {
			rowInfo = this.getRowInfoForHighestRewardBar();
		}
		selections.push(rowInfo);
		this.selectionManager.setSelections(selections);	
		this.saliencyDisplayManager.adjustCheckboxes(selections);		
	}
	
	bcm.getSelections = function() {
		return this.selectionManager.getSelections();
	}
	bcm.isSelected = function(selection) {
		return this.selectionManager.isSelected(selection);
	}

	bcm.removeSelection = function(selection) {
		this.selectionManager.removeSelection(selection);
	}

	bcm.addSelection = function(selection) {
		return this.selectionManager.addSelection(selection);
	}

	bcm.getRowInfoForHighestRewardBar = function() {
		var barGroup = this.getMaxValueBarGroup();
		var actionName = barGroup.getName();
		var bars = barGroup.getBarsList();
		//var maxBarIndex = undefined;
		var maxBar = undefined;
		for (var i in bars){
			var bar = bars[i];
			if  (maxBar == undefined) {
				maxBar = bar;
			}
			else if (bar.getValue() > maxBar.getValue()) {
				maxBar = bar;
			}
			else {
				//skip
			}
		}
		return [ actionName, maxBar.getName()];
	}

	
	bcm.getMaxValueBarGroup = function(){
		var barGroups = this.groupsList;
		var barGroupWithMaxValue = undefined;
		for (var i in barGroups) {
			barGroup = barGroups[i];
			if (barGroupWithMaxValue == undefined) {
				barGroupWithMaxValue = barGroup;
			}
			else {
				var curValue = getValueForBarGroup(barGroup);
				var maxValue = getValueForBarGroup(barGroupWithMaxValue);
				if (curValue > maxValue) {
					barGroupWithMaxValue = barGroup;
				}
			}
		}
		return barGroupWithMaxValue;
	}
	bcm.getChosenActionName = function() {
		var group = this.getMaxValueBarGroup();
		return group.getName();
	}
	return bcm;
}


function getRewardNameRowOneBarPerAction() {
	var rewardNameRow = ['', 'total reward'];
	return rewardNameRow;
}

function getBarValuesRowOneBarPerAction(barGroup) {
	var barValueRow = [];
	barValueRow.push(barGroup.getName());
	var barGroupValue = getValueForBarGroup(barGroup);
	barValueRow.push(barGroupValue);
	return barValueRow;
}

var drawBarChart = function(chartData, options) {
    activeDataTable = google.visualization.arrayToDataTable(chartData);
	//chart = new google.visualization.BarChart(document.getElementById('explanations-rewards'));
	googleChart = new google.visualization.ColumnChart(document.getElementById('explanations-rewards'));
	google.visualization.events.addListener(googleChart, 'select', selectHandler);
	activeOptions = options;
    googleChart.draw(activeDataTable, options);
	
}

var keys = {};
window.onkeyup = function(e) { 
	keys[e.keyCode] = false; 
	debug(1, keys); 
}
window.onkeydown = function(e) { 
	keys[e.keyCode] = true; 
	debug(1,keys);
}

function selectHandler(e) {
	var googleChartSelections = googleChart.getSelection();
	var selectionsByName = activeBarChartManager.convertGoogleChartSelectionsToSelectionsByName(googleChartSelections);
	if (keys[17]){
		for (var i in selectionsByName){
			var selection = selectionsByName[i];
			if (activeBarChartManager.isSelected(selection)) {
				activeBarChartManager.removeSelection(selection);
			}
			else {
				activeBarChartManager.addSelection(selection);
			}
		}
		
		activeSaliencyDisplayManager.adjustCheckboxes(activeBarChartManager.getSelections());
	}
	else {
		activeSaliencyDisplayManager.adjustCheckboxes(selectionsByName);
	}
	
	if (!salienciesAreShowing) {
		renderWhatInfo();
	}
}
//'stroke-color: #871B47; stroke-opacity: 0.6; stroke-width: 8; fill-color: #BC5679; fill-opacity: 0.2'
function getValueForBarGroup(barGroup) {
	var statedValue = barGroup.getValue();
	if (statedValue == 0.0){
		var total = addRowValues(barGroup);
		return total;
	}
	else {
		return statedValue;
	}
}

function addRowValues(barGroup){
	var bars = barGroup.getBarsList();
	var total = 0.0;
	for (var i in bars){
		var bar = bars[i];
		var value = bar.getValue();
		total = total + value;
	}
	return total;
}

function renderTabActiveActionRewards() {
	$("#showRewardsPerActionButton").addClass("active");
	$("#showRewardsPerRewardTypeButton").removeClass("active");
}
function renderTabActiveRewardTypes() {
	$("#showRewardsPerRewardTypeButton").addClass("active");
	$("#showRewardsPerActionButton").removeClass("active");
}
// message BarChart {
  // repeated BarGroup group = 1;
  // optional string title = 2;
  // optional string v_title = 3;
  // optional string h_title = 4;
// }

// message BarGroup {
	// optional double value = 1;
    // repeated Bar bars = 2;
    // optional string saliency_id = 3;
    // optional string name = 4;
// }

// message Bar {
    // required double value = 1;
    // optional string saliency_id = 2;
    // optional string name = 3;
// }

var getBogusChartData = function() {
	var chartData = [
        ['Decision', 'r1', 'r2'],
        ['unit victorious', 0.77, 0.4],
        ['unit loses', -0.39, 0.6],
        ['adversary flees', 0.2, 0.3]
      ];  
	 return chartData;
}

var getBogusOptions = function() {
	var options = {
		//legend: { position: "none" },
        title: "chart title",
        //chartArea: {width: '50%', left:70},
        chartArea: {width: '50%', left:"15%"},
        hAxis: {
          title: "horiz title",
          //minValue: 0
        },
        vAxis: {
          title: "vert title"
        },
		'width':800,
        'height':400
      };
	  return options;
}
