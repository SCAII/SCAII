google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var chart;
var dummy = function(){
	
}
var drawBarChart = function(chartData, options) {
      var data = google.visualization.arrayToDataTable(chartData);
	  if (chart == undefined){
		  chart = new google.visualization.BarChart(document.getElementById('explanations-interface'));
	  }
      chart.draw(data, options);
}
/*var redrawChart = function() {
	console.log("trigger button clicked...");
        var data = google.visualization.arrayToDataTable([
        ['Decision', 'Probability'],
        ['unit victorious', 0.77],
        ['unit loses', 0.39],
        ['adversary flees', 0.2]
      ]);

      var options = {
		legend: { position: "none" },
        title: 'Probable outcomes for action',
        chartArea: {width: '50%'},
        hAxis: {
          title: 'outcome probability',
          minValue: 0
        },
        vAxis: {
          title: 'decision'
        },
		'width':400,
        'height':400
      };

      chart.draw(data, options);
}
*/
var getOptionsFromChartInfo = function(chartInfo){
	var chartTitle = "explanations";
	if (chartInfo.hasChartTitle){
		chartTitle = chartInfo.getChartTitle();
	}
	
	var hAxisTitle = "?";
	if (chartInfo.hasHAxisTitle){
		hAxisTitle = chartInfo.getHAxisTitle();
	}
	
	var vAxisTitle = "?";
	if (chartInfo.hasVAxisTitle){
		vAxisTitle = chartInfo.getVAxisTitle();
	}
	
	var options = {
		//legend: { position: "none" },
        title: chartTitle,
        chartArea: {width: '50%'},
        hAxis: {
          title: hAxisTitle,
          //minValue: 0
        },
        vAxis: {
          title: vAxisTitle
        },
		'width':400,
        'height':400
      };
	  console.log("options looks like: " + options);
	  return options;
}
var getChartDataFromChartInfo = function(chartInfo){
	var actions = "?";
	if (chartInfo.hasActions){
		actions = chartInfo.getActions();
	}
	
	var actionsLabel = "?";
	if (actions.hasActionsLabel()){
		actionsLabel = actions.getActionsLabel();
	}
	var actionNames = actions.getActionNamesList();
	var grid = [];
	var headerArray = [actionsLabel];
	grid.push(headerArray);
	for (var i = 0; i < actionNames.length; i++) {
		var actionName = actionNames[i];
		var row = [actionName];
		grid.push(row);
	}
	// by now the left column of the grid is in place
	var valueVectors = chartInfo.getValueVectorsList();
	for (var i = 0; i < valueVectors.length ; i++){
		var label = "?";
		var valueVector = valueVectors[i];
		console.log("valueVector: " + valueVector);

		if (valueVector.hasLabel()){
			label = valueVector.getLabel();
		}
		var headerArray = grid[0];
		headerArray.push(label);
		
		var actionValues = valueVector.getActionValuesList();
		var index = 1;
		for (var j = 0; j < actionValues.length; j++){
			var actionValue = actionValues[j];
			var rowArray = grid[index];
			rowArray.push(actionValue);
			index = index + 1;
		}
	}
	// gridArray should look something like this now:
	//var chartData = [
    //    ['Decision', 'r1', 'r2'],
    //    ['unit victorious', 0.77, 0.4],
    //    ['unit loses', -0.39, 0.6],
    //    ['adversary flees', 0.2, 0.3]
    //  ];  
	console.log("grid looks like :" + grid);
	return grid;
}
var renderChartInfo = function(chartInfo){
	var options = getOptionsFromChartInfo(chartInfo);
	var chartData = getChartDataFromChartInfo(chartInfo);
	drawBarChart(chartData, options);
}
/*
message ChartInfo {

	repeated ChartRow chart_rows = 5;
}
message ChartDataLabels {
	optional string label_type = 1;
	repeated string labels = 2;
}
message ChartRow {
	optional string header = 1;
	repeated double row_values = 2;
}
*/