var activeBarChartInfo = undefined;

//Why was action chosen
const rewardQuestionAggregate = "total rewards/punishments for actions";
const rewardQuestionDetailed  = "specific rewards/punishments for actions";

function addHelperFunctionsToBarChartInfo(barChartInfo) {
	
	// selection
	
	barChartInfo.xaiSelectionManager = undefined;
	
	barChartInfo.setSelectionManager = function(selectionManager){
		this.xaiSelectionManager = selectionManager;
	}
	
	barChartInfo.convertGoogleChartSelectionsToSelectionsByName = function(googleChartSelections){
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
	
	barChartInfo.convertSelectionsByNameToGoogleChartSelections = function(selectionsByName) {
		var googleChartSelections = [];
		for (var i in selectionsByName) {
			var selectionByName = selectionsByName[i];
			var coordsForChart = this.getChartCoordsForNames(selectionByName[0], selectionsByName[1]);
			var row = coordsForChart[0];
			var col = coordsForChart[1];
			var googleChartSelection = {};
			googleChartSelection["column"] = col;
			googleChartSelection["row"] = row;
			googleChartSelections.push(googleChartSelection);
		}
		return googleChartSelections;
	}
	
	barChartInfo.getNameInfoForChartCoords = function(rowCol) {
		var row = rowCol[0];
		var col = rowCol[1];
		var groups = this.getGroupsList();
		for (var i in groups){
			var group = groups[i];
			var curName = group.getName();
			if (i == row){
				if (this.isAggregate()) {
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
	
	
	// handle awareness of aggregate vs detailed
	barChartInfo.xaiChartModeIsAggregate = true;
	
	barChartInfo.isAggregate = function(){
		return this.xaiChartModeIsAggregate;
	}
	barChartInfo.setAggregate = function(boolValue) {
		this.xaiChartModeIsAggregate = boolValue;
		this.xaiSelectionManager.setAggregate(boolValue);
	}
	
	// chart coords in data model given to chart renderer
	barChartInfo.getChartCoordsForNames = function(groupName, barName){
		var row = undefined;
		var col = undefined;
		var groups = this.getGroupsList();
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
	
	
	barChartInfo.getTableForGoogleChart = function(){
		var chartTable = undefined;
		if (this.isAggregate()) {
			chartTable = this.getTableForGoogleChartAggregate()
		}
		else {
			chartTable = this.getTableForGoogleChartDetailed()
		}
		return chartTable;
	}



	barChartInfo.getTableForGoogleChartAggregate = function() {
		// need structure to look like this
		// var chartTable = [
			// ['', 'r', ],
			// ['unit victorious', 0.77],
			// ['unit loses', -0.39],
			// ['adversary flees', 0.2]
		  // ]; 
		 var rowWithRewardNames = this.getRewardNameRowOneBarPerAction();
		 var chartTable = [];
		 chartTable.push(rowWithRewardNames);
		 
		 var barGroups = this.getGroupsList();
		 for (var i in barGroups){
			 var barGroup = barGroups[i];
			 var barValuesRow = this.getBarValuesRowOneBarPerAction(barGroup);
			 chartTable.push(barValuesRow);
		 }
		 //console.log("chartTable for actions:");
		 //console.log(chartTable);
		 return chartTable;
	}
	
	barChartInfo.getTableForGoogleChartDetailed = function() {
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
		 
		 var barGroups = this.getGroupsList();
		 for (var i in barGroups){
			 var barGroup = barGroups[i];
			 var barValuesRow = this.getBarValuesRowNBarsPerAction(barGroup);
			 chartTable.push(barValuesRow);
		 }
		 //console.log("chartTable for types:");
		 //console.log(chartTable);
		 return chartTable;
	}
	
	

	barChartInfo.getRewardNameRowOneBarPerAction = function() {
		var rewardNameRow = ['', 'total reward'];
		return rewardNameRow;
	}

	
	barChartInfo.getBarValuesRowOneBarPerAction = function(barGroup) {
		var barValueRow = [];
		barValueRow.push(barGroup.getName());
		var barGroupValue = getValueForBarGroup(barGroup);
		barValueRow.push(barGroupValue);
		return barValueRow;
	}
	
	barChartInfo.getBarValuesRowNBarsPerAction = function(barGroup) {
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
	barChartInfo.getRewardNameRowNBarsPerAction = function() {
		var rewardNameRow = [''];
		// any of the BarGroups can be used to fill in the reward names
		var barGroups = this.getGroupsList();
		var barGroup = barGroups[0];
		var bars = barGroup.getBarsList();
		for (var i in bars){
			var bar = bars[i];
			rewardNameRow.push(bar.getName());
		}
		return rewardNameRow;
	}
	barChartInfo.getOptionsForBarChartMessage = function() {
		var options = {
			//legend: { position: "none" },
			title: this.getTitle(),
			//chartArea: {width: '50%', left:70},
			chartArea: {width: '50%', left:"15%"},
			hAxis: {
			  title: this.getVTitle(),
			  //minValue: 0
			},
			vAxis: {
			  title: this.getHTitle(),
			},
			'width':800,
			'height':400
		  };
		  return options;
	}
	
	
	barChartInfo.getSaliencyIdForActionNameAndBar = function(actionName, barName) {
		var barGroups = this.getGroupsList();
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
	
	barChartInfo.displayAnswerToRewardQuestion = function(){
		var chosenQuestion = $( "#reward-question-selector option:selected" ).text();
		if (chosenQuestion == rewardQuestionAggregate){
			showRewards(true);
		}
		else {
			showRewards(false);
		}
	}
	
	barChartInfo.renderExplanationBarChart = function() {
		$("#explanations-rewards").empty();
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
	
	barChartInfo.createGoogleChartSelections = function(){
		var selections = this.xaiSelectionManager.getSelections();
		var googleChartSelections = this.convertSelectionsByNameToGoogleChartSelections(selections);
		return googleChartSelections;
	}
	
	// default to highest score, aggregate i.e. highest scoring task
	barChartInfo.setDefaultSelections = function() {
		var barGroup = this.getMaxValueBarGroup();
		var barGroupName = barGroup.getName();
		var selections = [];
		var rowInfo = undefined;
		if (this.isAggregate()) {
			rowInfo = [ barGroupName, "*"];
		}
		else {
			rowInfo = this.getRowInfoForHighestRewardBar();
		}
		selections.push(rowInfo);
		this.xaiSelectionManager.setSelections(selections);			
	}
	
	// default to highest score, aggregate i.e. highest scoring task
	// barChartInfo.setDefaultSelectionsIfNoneSet = function() {
		// if (!this.hasSelections()){
			// var barGroup = this.getMaxValueBarGroup();
			// var barGroupName = barGroup.getName();
			// var selections = [];
			// var rowInfo = undefined;
			// if (this.isAggregate()) {
				// rowInfo = [ barGroupName, "*"];
			// }
			// else {
				// rowInfo = this.getRowInfoForHighestRewardBar();
			// }
			// selections.push(rowInfo);
			// this.xaiSelectionManager.setSelections(selections);			
		// }
	// }
	
	// barChartInfo.hasSelections = function() {
		// if (this.xaiSelectionManager.getSelections().length == 0) {
			// return false;
		// }
		// return true;
	// }
	
	barChartInfo.getRowInfoForHighestRewardBar = function() {
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

	
	barChartInfo.getMaxValueBarGroup = function(){
		var barGroups = this.getGroupsList();
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
	barChartInfo.getChosenActionName = function() {
		var group = this.getMaxValueBarGroup();
		return group.getName();
	}
}


function showRewardAnswer() {
	activeBarChartInfo.displayAnswerToRewardQuestion();
}

var drawBarChart = function(chartData, options) {
    var data = google.visualization.arrayToDataTable(chartData);
	//chart = new google.visualization.BarChart(document.getElementById('explanations-rewards'));
	googleChart = new google.visualization.ColumnChart(document.getElementById('explanations-rewards'));
	google.visualization.events.addListener(googleChart, 'select', selectHandler);
    googleChart.draw(data, options);
	
}


function selectHandler(e) {
	var googleChartSelections = googleChart.getSelection();
	var selectionsByName = activeBarChartInfo.convertGoogleChartSelectionsToSelectionsByName(googleChartSelections);
	saliencyDisplayManager.adjustCheckboxes(selectionsByName);
	saliencyDisplayManager.renderExplanationSaliencyMaps();
}



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
