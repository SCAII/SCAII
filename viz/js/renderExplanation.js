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

var configureExplanation = function(step_count, step, title, selected){
	var totalWidth = expl_ctrl_canvas.width;
	var rectWidth = totalWidth / step_count;
	var leftX = rectWidth * step;
	var rightX = rectWidth * (step + 1);
	var upperLeftX = leftX;
	var distFromLine = 8
	var upperLeftY = explanationControlYPosition - distFromLine;
	var ctx = expl_ctrl_ctx;
	ctx.beginPath();
	if (selected){
		ctx.fillStyle = 'yellow';
	}
	else {
		ctx.fillStyle = 'blue';
	}
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'black';
	var leftVertexX = leftX;
	var leftVertexY = explanationControlYPosition;
	var rightVertexX = rightX;
	var rightVertexY = explanationControlYPosition;
	var topVertexX = leftVertexX + (rightVertexX - leftVertexX)/2 ;
	var topVertexY = explanationControlYPosition - distFromLine;
	var bottomVertexX = topVertexX;
	var bottomVertexY = explanationControlYPosition + distFromLine;
	
	ctx.moveTo(leftVertexX, leftVertexY);
	ctx.lineTo(topVertexX,topVertexY);
	ctx.lineTo(rightVertexX, rightVertexY);
	ctx.lineTo(bottomVertexX, bottomVertexY);
	ctx.lineTo(leftVertexX, leftVertexY);
	ctx.closePath();
	ctx.fill();
	
	var rectHeight = distFromLine + distFromLine + 1;
	//ctx.rect(upper_left_x, upper_left_y, rect_width, rect_height);
	var eBox = getExplanationBox(leftX,rightX,upperLeftY, upperLeftY + rectHeight, step);
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
	var chartData = getBogusChartData();
	var options = getBogusOptions();
	drawBarChart(chartData, options);
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

var renderExplLayer = function(name, cells, width, height) {
	var uiName = name;
	name = name.replace(" ","");
	console.log('render layer ' + name);
	var explCanvas = document.createElement("canvas");
	var explCtx = explCanvas.getContext("2d");
	// canvas size should be same a gameboardHeight
	explCanvas.width  = gameboard_canvas.width;
	explCanvas.height = gameboard_canvas.height;
	renderSaliencyMap(explCanvas, explCtx, cells, width, height);
	// the div that will contain it should be a bit wider
	// and tall enough to contain title text
	var mapContainerDivHeight = explCanvas.height + 30;
	
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
	$(mapTitleDivSelector).html(uiName);
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
	$(mapTitleDivSelector).css("font-size", "16px");
	$(mapTitleDivSelector).css("padding-left", "6px");
	$(mapTitleDivSelector).css("padding-right", "6px");
	$(mapTitleDivSelector).css("padding-top", "6px");
	$(mapTitleDivSelector).css("padding-bottom", "2px");
	$(mapTitleDivSelector).css("text-align", "center");
	$(mapTitleDivSelector).css("height", "30px");

}

var renderSaliencyMap = function(canvas, ctx, cells, width, height){
	for (var x= 0; x < width; x++){
		for (var y = 0; y < height; y++){
			var index = width * y + x;
			var cellValue = cells[index];
			if (cellValue != 0.0) {
				ctx.fillStyle = getWhiteRGBAString(cellValue);
				ctx.fillRect(x*gameScaleFactor, y*gameScaleFactor, gameScaleFactor, gameScaleFactor);
				ctx.fill();
			}
		}
	}
}


function getWhiteRGBAString(saliencyValue) {
  color = {};
  color['R'] = 255;
  color['G'] = 255;
  color['B'] = 255;
  color['A'] = saliencyValue;
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
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