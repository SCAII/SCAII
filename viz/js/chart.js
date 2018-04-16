
var drawBarChart = function(chartData, options, ) {
    var data = google.visualization.arrayToDataTable(chartData);
	//chart = new google.visualization.BarChart(document.getElementById('explanations-rewards'));
	chart = new google.visualization.ColumnChart(document.getElementById('explanations-rewards'));
	google.visualization.events.addListener(chart, 'select', selectHandler);
    chart.draw(data, options);
	
}

function getDataCoordinatesKey(row, col, isAggregate){
	var coordKey = '';
	if (isAggregate) {
		coordKey = 'group_'+ row + "_" + col;
	}
	else {
		coordKey = 'bar_'+ row + "_" + col;
	}
	return coordKey;
}

function getColumnFromCoordKey(coordKey){
	var parts = coordKey.split("_");
	var col = parts[2];
	return col;
}


function getRowFromCoordKey(coordKey){
	var parts = coordKey.split("_");
	var row = parts[1];
	return row;
}

function selectHandler(e) {
	var selection = chart.getSelection();
	console.log("SELKECTION from getSelection() looks like: ");
	console.log(selection);
	var col = selection[0]["column"];
	var final_col = col - 1;  // ignore name column for generating key
	var row = selection[0]["row"];
	if (chartMode == chartModeAggregate) {
		chosenAggregateCoordKey = getDataCoordinatesKey(row,final_col,true);
		chosenSaliencyIdForAggregate = saliencyCoordinatesMap[chosenAggregateCoordKey];
		console.log('render saliency map id ' + chosenSaliencyIdForAggregate + ' for key ' + chosenAggregateCoordKey);
		renderExplanationSaliencyMaps(chosenSaliencyIdForAggregate);
	}
	else {
		chosenDetailCoordKey = getDataCoordinatesKey(row,final_col,false);
		chosenSaliencyIdForDetailed = saliencyCoordinatesMap[chosenDetailCoordKey];
		console.log('render saliency map id ' + chosenSaliencyIdForDetailed + ' for key ' + chosenDetailCoordKey);
		renderExplanationSaliencyMaps(chosenSaliencyIdForDetailed);
	}
}

function createSelectionFromCoordKey(coordKey){
	var selection0 = {};
	selection0.column = Number(getColumnFromCoordKey(coordKey)) + 1;
	selection0.row = Number(getRowFromCoordKey(coordKey));
	var selection = [];
	selection.push(selection0);
	return selection;
}

function getChartData(barChart, chartMode){
	var chartData = undefined;
	if (chartMode == chartModeAggregate) {
		chartData = getChartDataOneBarPerAction(barChart)
	}
	else {
		chartData = getChartDataNBarsPerAction(barChart)
	}
	return chartData;
}


var renderExplanationBarChart = function(barChart, chartMode, selectedCoordKey) {
	$("#explanations-rewards").empty();
	var options = getOptionsForBarChartMessage(barChart);
	var chartData = getChartData(barChart, chartMode);
	if (chartData == undefined){
		console.log("ERROR - chartData could not be harvested for barChart ");
	} else if (options == undefined){
		console.log("ERROR - chartOptions could not be harvested for barChart ");
	}
	else {
		drawBarChart(chartData, options);
		var selection = createSelectionFromCoordKey(selectedCoordKey);
		console.log("selection I created looks like: ");
		console.log(selection);
		chart.setSelection(selection);
	}
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
var getBarValuesRowOneBarPerAction = function(barGroup) {
	var barValueRow = [];
	barValueRow.push(barGroup.getName());
	var barGroupValue = getValueForBarGroup(barGroup);
	barValueRow.push(barGroupValue);
	return barValueRow;
}
var getChartDataOneBarPerAction = function(barChart) {
	// need structure to look like this
	// var chartData = [
        // ['', 'r', ],
        // ['unit victorious', 0.77],
        // ['unit loses', -0.39],
        // ['adversary flees', 0.2]
      // ]; 
	 var rowWithRewardNames = getRewardNameRowOneBarPerAction(barChart);
	 var chartData = [];
	 chartData.push(rowWithRewardNames);
	 
	 var barGroups = barChart.getGroupsList();
	 for (var i in barGroups){
		 var barGroup = barGroups[i];
		 var barValuesRow = getBarValuesRowOneBarPerAction(barGroup);
		 chartData.push(barValuesRow);
	 }
	 console.log("chart data for actions:");
	 console.log(chartData);
	 return chartData;
}
var getChartDataNBarsPerAction = function(barChart) {
	// need structure to look like this
	// var chartData = [
        // ['', 'r1', 'r2'],
        // ['unit victorious', 0.77, 0.4],
        // ['unit loses', -0.39, 0.6],
        // ['adversary flees', 0.2, 0.3]
      // ]; 
	 var rowWithRewardNames = getRewardNameRowNBarsPerAction(barChart);
	 var chartData = [];
	 chartData.push(rowWithRewardNames);
	 
	 var barGroups = barChart.getGroupsList();
	 for (var i in barGroups){
		 var barGroup = barGroups[i];
		 var barValuesRow = getBarValuesRowNBarsPerAction(barGroup);
		 chartData.push(barValuesRow);
	 }
	 console.log("chart data for types:");
	 console.log(chartData);
	 return chartData;
}
var getBarValuesRowNBarsPerAction = function(barGroup) {
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
var getRewardNameRowNBarsPerAction = function(barChart) {
	var rewardNameRow = [''];
	// any of the BarGroups can be used to fill in the reward names
	var barGroups = barChart.getGroupsList();
	var barGroup = barGroups[0];
	var bars = barGroup.getBarsList();
	for (var i in bars){
		var bar = bars[i];
		rewardNameRow.push(bar.getName());
	}
	return rewardNameRow;
}
var getOptionsForBarChartMessage = function(barChart) {
	var options = {
		//legend: { position: "none" },
        title: barChart.getTitle(),
        //chartArea: {width: '50%', left:70},
        chartArea: {width: '50%', left:"15%"},
        hAxis: {
          title: barChart.getHTitle(),
          //minValue: 0
        },
        vAxis: {
          title: barChart.getVTitle(),
        },
		'width':800,
        'height':400
      };
	  return options;
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


var getRewardNameRowOneBarPerAction = function(barChart) {
	var rewardNameRow = ['', 'total reward'];
	return rewardNameRow;
}

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