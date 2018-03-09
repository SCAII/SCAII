google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var chart;

function getExplanationBox(left_x,right_x, upper_y, lower_y, step){
	eBox = {};
	eBox.left_x = left_x;
	eBox.right_x = right_x;
	eBox.upper_y = upper_y;
	eBox.lower_y = lower_y;
	eBox.step = step;
	return eBox;
}

var configure_explanation = function(step_count, step, title){
	var total_width = expl_ctrl_canvas.width;
	var rect_width = total_width / step_count;
	var left_x = rect_width * step;
	var right_x = rect_width * (step + 1);
	var upper_left_x = left_x;
	var dist_from_line = 8
	var upper_left_y = 14 - dist_from_line;
	var ctx = expl_ctrl_ctx;
	// (canvas height is 30, line is at y==14, so diamond height is
	ctx.beginPath();
	ctx.fillStyle = 'white';
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'black';
	var rect_height = dist_from_line + dist_from_line + 1;
	ctx.rect(upper_left_x, upper_left_y, rect_width, rect_height);
	ctx.stroke();
	ctx.fill();
	var eBox = getExplanationBox(left_x,right_x,upper_left_y, upper_left_y + rect_height, step);
    explanationBoxMap[step] = eBox;
}

function getMatchingExplanationStep(ctx, x, y){
	var matchingStep = undefined;
	for (key in explanationBoxMap) {
		var eBox = explanationBoxMap[key];
		if (x > eBox.left_x && x < eBox.right_x && y > eBox.upper_y && y < eBox.lower_y) {
			matchingStep = eBox.step;
		}
	}
	return matchingStep;
}



var renderExplanationPoint = function(explPoint){
	$("#explanation-maps").empty();
	var title = explPoint.getTitle();
	var description = explPoint.getDescription();
	var expLayers = explPoint.getLayersList();
	for (var i in expLayers) {
		expLayer = expLayers[i];
		console.log('found layer ' + expLayer.getName());
		var name = expLayer.getName();
		var cells = expLayer.getCellsList();
		var width = expLayer.getWidth();
		var height = expLayer.getHeight();
		renderExplLayer(name, cells, width, height)
	}
}

var renderExplLayer = function(name, cells, width, height) {
	console.log('render layer ' + name);
	var explCanvas = document.createElement("canvas");
	var explCtx = explCanvas.getContext("2d");
	// canvas size should be same a gameboardHeight
	explCanvas.width  = gameboard_canvas.width;
	explCanvas.height = gameboard_canvas.height;
	// the div that will contain it should be a bit wider
	// and tall enough to contain title text
	var mapContainerDivHeight = explCanvas.height + 60;
	
	var mapContainerDiv = document.createElement("div");
	$("#explanation-maps").append(mapContainerDiv);
	var mapId = 'mapContainer_' + name;
	mapContainerDiv.setAttribute("id", mapId);
	var mapContainerDivSelector = "#" + mapId;
	$(mapContainerDivSelector).css("display", "flex");
	$(mapContainerDivSelector).css("flex-direction", "column");
	$(mapContainerDivSelector).css("width", explCanvas.width+'px');
	$(mapContainerDivSelector).css("height", mapContainerDivHeight+'px');
	$(mapContainerDivSelector).css("margin-right", '4px');
	
	var mapTitleId = 'title_' + name;
	var mapTitleDiv   = document.createElement("div");
	$(mapContainerDivSelector).append(mapTitleDiv);
	mapTitleDiv.setAttribute("id", mapTitleId);
	var mapTitleDivSelector = "#" + mapTitleId;
	$(mapTitleDivSelector).html(name);
	configureMapTitle(mapTitleDivSelector);
	
	var mapId = 'map_' + name;
	var mapDiv = document.createElement("div");
	$(mapContainerDivSelector).append(mapDiv);
	mapDiv.setAttribute("id", mapId);
	var mapDivSelector = "#" + mapId;
	$(mapDivSelector).css("width",explCanvas.width + 'px');
	$(mapDivSelector).css("height",explCanvas.height + 'px');
	$(mapDivSelector).css("background-color", "#123456");
	$(mapDivSelector).append(explCanvas);
}

var configureMapTitle = function(mapTitleDivSelector){
	$(mapTitleDivSelector).css("font-family", "Fira Sans");
	$(mapTitleDivSelector).css("font-size", "12px");
	$(mapTitleDivSelector).css("padding-left", "6px");
	$(mapTitleDivSelector).css("padding-right", "6px");
	$(mapTitleDivSelector).css("padding-top", "2px");
	$(mapTitleDivSelector).css("padding-bottom", "2px");
	$(mapTitleDivSelector).css("text-align", "center");
	$(mapTitleDivSelector).css("height", "40px");
}
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
		'width':600,
        'height':400
      };

      chart.draw(data, options);
}
*/
var getOptionsFromChartInfo = function(chartInfo, gameboardHeight){
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
        //chartArea: {width: '50%', left:70},
        chartArea: {width: '50%', left:"15%"},
        hAxis: {
          title: hAxisTitle,
          //minValue: 0
        },
        vAxis: {
          title: vAxisTitle
        },
		'width':600,
        'height':gameboardHeight
      };
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
	return grid;
}
var renderChartInfo = function(chartInfo, gameboardHeight){
	var options = getOptionsFromChartInfo(chartInfo, gameboardHeight);
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