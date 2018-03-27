google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(dummy);
var chart;
var columnsAreAggregate = true;
var firstValueColumn= 1;
var saliencyMapPercentSize = 0.75;
//
// when clicking on a bar, the saliency will be looked up as follows:
// we'll know which mode we are displaying (aggregate vs details)
// if aggregate, we get the 
//
//
var saliencyCoordinatesMap = {};
var saliencyLookupMap = {};

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

var getMatchingExplanationStep = function(ctx, x, y){
	var matchingStep = undefined;
	for (key in explanationBoxMap) {
		var eBox = explanationBoxMap[key];
		if (x > eBox.left_x && x < eBox.right_x && y > eBox.upper_y && y < eBox.lower_y) {
			matchingStep = eBox.step;
		}
	}
	return matchingStep;
}

var getMaxValueBarGroup = function(barGroups){
	var barGroupWithMaxValue = undefined;
	for (var i in barGroups) {
		barGroup = barGroups[i];
		if (barGroupWithMaxValue == undefined) {
			barGroupWithMaxValue = barGroup;
		}
		else {
			var curValue = barGroup.getValue();
			var maxValue = barGroupWithMaxValue.getValue();
			if (curValue > maxValue) {
				barGroupWithMaxValue = barGroup;
			}
		}
	}
	return barGroupWithMaxValue;
}

var getMaxValueBarGroupIndex = function(barGroups){
	var barGroupWithMaxValue = undefined;
	var barGroupWithMaxValueIndex = undefined;
	for (var i in barGroups) {
		barGroup = barGroups[i];
		if (barGroupWithMaxValue == undefined) {
			barGroupWithMaxValue = barGroup;
			barGroupWithMaxValueIndex = i;
		}
		else {
			var curValue = barGroup.getValue();
			var maxValue = barGroupWithMaxValue.getValue();
			if (curValue > maxValue) {
				barGroupWithMaxValue = barGroup;
				barGroupWithMaxValueIndex = i;
			}
		}
	}
	return barGroupWithMaxValueIndex;
}
var populateSaliencyCoordinatesMap = function(explPoint) {
	
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	for (var i in barGroups) {
		var barGroup = barGroups[i];
		var saliencyId = barGroup.getSaliencyId();
		var coordsKey = getCoordinatesKey(i, firstValueColumn, true);
		console.log('populating... ' + coordsKey + '  ' + saliencyId);
		saliencyCoordinatesMap[coordsKey] = saliencyId;
		var bars = barGroup.getBarsList();
		for (var j in bars){
			var bar = bars[j];
			var final_j = Number(j) + firstValueColumn;
			var saliencyId = bar.getSaliencyId();
			var coordsKey = getCoordinatesKey(i, final_j, false);
			console.log('populating... ' + coordsKey + '  ' + saliencyId);
			saliencyCoordinatesMap[coordsKey] = saliencyId;
		}
	}
}

var renderExplanationPoint = function(explPoint){
	renderActionName(explPoint);
	populateSaliencyCoordinatesMap(explPoint);
	var saliency = explPoint.getSaliency();
	saliencyLookupMap = saliency.getSaliencyMapMap();
	columnsAreAggregate = true; // default to highest score, aggregate i.e. highest scoring task
	
	// look through the data to discover which saliency to express
	var barChart = explPoint.getBarChart();
	var barGroups = barChart.getGroupsList();
	//var defaultBarGroup = getMaxValueBarGroup(barGroups);
	var maxValueBarGroupIndex = getMaxValueBarGroupIndex(barGroups);
	var coordsKey = getCoordinatesKey(maxValueBarGroupIndex, firstValueColumn, true);
	var maxValueSaliencyId = saliencyCoordinatesMap[coordsKey];
	renderExplanationSaliencyMaps(maxValueSaliencyId);
    
	var chartData = getChartData(barChart);
	renderExplanationBarChart(barChart, chartData);
}

function getChartData(barChart){
	var chartData = undefined;
	if (columnsAreAggregate) {
		chartData = getChartDataOneBarPerAction(barChart)
	}
	else {
		chartData = getChartDataNBarsPerAction(barChart)
	}
	return chartData;
}
var renderActionName = function(explPoint){
	var title = explPoint.getTitle();
	$("#action-name-label").html(title);
}
var renderExplanationSaliencyMaps = function(saliencyId) {
	$("#saliency-maps").empty();
	var layerMessage = saliencyLookupMap.get(saliencyId);
	if (layerMessage == undefined){
		console.log("ERROR - no Layer message for saliencyID " + defaultSaliencyId);
	}
	else {
		var expLayers = layerMessage.getLayersList();
		var normalizationFactor = getNormalizationFactor(expLayers);
		for (var i in expLayers) {
			expLayer = expLayers[i];
			console.log('found layer ' + expLayer.getName());
			var name = expLayer.getName();
			var cells = expLayer.getCellsList();
			var width = expLayer.getWidth();
			var height = expLayer.getHeight();
			renderExplLayer(name, cells, width, height, normalizationFactor);
		} 
	}
}

var renderExplanationBarChart = function(barChart, chartData) {
	$("#explanations-rewards").empty();
	var options = getOptionsForBarChartMessage(barChart);
	if (chartData == undefined){
		console.log("ERROR - chartData could not be harvested for barChart ");
	} else if (options == undefined){
		console.log("ERROR - chartOptions could not be harvested for barChart ");
	}
	else {
		console.log(chartData);
		drawBarChart(chartData, options);
	}
}

var getNormalizationFactor = function(expLayers){
	var max = 0.0
	for (var i in expLayers) {
		expLayer = expLayers[i];
		var value = getMaxValueForLayer(expLayer.getCellsList());
		if (value > max) {
			max = value;
		}
	} 
    var factor = 1 / max;
	return factor;
}

var getMaxValueForLayer = function(vals){
	var max = 0.0;
	for (var i in vals) {
		var value = vals[i];
		if (value > max) {
			max = value;
		}
	}
	return max;
}

var getRewardNameRowOneBarPerAction = function(barChart) {
	var rewardNameRow = ['', 'total reward'];
	return rewardNameRow;
}

var getBarValuesRowOneBarPerAction = function(barGroup) {
	var barValueRow = [];
	barValueRow.push(barGroup.getName());
	var bars = barGroup.getBarsList();
	var total = 0.0;
	for (var i in bars){
		var bar = bars[i];
		var value = bar.getValue();
		total = total + value;
	}
	barValueRow.push(total);
	return barValueRow;
}
var getChartDataOneBarPerAction = function(barChart) {
	columnsAreAggregate = true;
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
	 return chartData;
}
var getChartDataNBarsPerAction = function(barChart) {
	columnsAreAggregate = false;
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
var renderExplanationPointOld = function(explPoint){
	$("#saliency-maps").empty();
	var title = explPoint.getTitle();
	$("#action-name-label").html(title);
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

var renderExplLayer = function(name, cells, width, height, normalizationFactor) {
	var uiName = name;
	name = name.replace(" ","");
	console.log('render layer ' + name);
	var explCanvas = document.createElement("canvas");
	var explCtx = explCanvas.getContext("2d");
	// canvas size should be same a gameboardHeight
	explCanvas.width  = gameboard_canvas.width * saliencyMapPercentSize;
	explCanvas.height = gameboard_canvas.height * saliencyMapPercentSize;
	renderSaliencyMap(explCanvas, explCtx, cells, width, height, normalizationFactor);
	// the div that will contain it should be a bit wider
	// and tall enough to contain title text
	var mapContainerDivHeight = explCanvas.height + 30;
	
	var mapContainerDiv = document.createElement("div");
	$("#saliency-maps").append(mapContainerDiv);
	var mapId = 'mapContainer_' + name;
	mapContainerDiv.setAttribute("id", mapId);
	var mapContainerDivSelector = "#" + mapId;
	$(mapContainerDivSelector).css("display", "flex");
	$(mapContainerDivSelector).css("flex-direction", "column");
	$(mapContainerDivSelector).css("width", explCanvas.width+'px');
	$(mapContainerDivSelector).css("height", mapContainerDivHeight+'px');
	$(mapContainerDivSelector).css("margin-right", '4px');
	$(mapContainerDivSelector).css("border", '1px solid #0063a6');
	
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

var renderSaliencyMap = function(canvas, ctx, cells, width, height, normalizationFactor){
	var scaleFactor = gameScaleFactor*saliencyMapPercentSize;
	var maxCellValue = 0.0;
	for (var x= 0; x < width; x++){
		for (var y = 0; y < height; y++){
			//var index = width * y + x; // assumes 
			var index = height * x + y;
			var cellValue = cells[index];
			if (cellValue != 0.0) {
				if (cellValue > maxCellValue) {
					maxCellValue = cellValue;
				}
				ctx.fillStyle = getWhiteRGBAString(cellValue * normalizationFactor);
				ctx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
				ctx.fill();
			}
		}
	}
	console.log('MAX cell value : ' + maxCellValue);
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
	//chart = new google.visualization.BarChart(document.getElementById('explanations-rewards'));
	chart = new google.visualization.ColumnChart(document.getElementById('explanations-rewards'));
	google.visualization.events.addListener(chart, 'select', selectHandler);
    chart.draw(data, options);
}



function selectHandler(e) {
	var selection = chart.getSelection();
	var col = selection[0]["column"];
	var row = selection[0]["row"];
	if (columnsAreAggregate) {
		var coordKey = getCoordinatesKey(row,col,true);
		console.log('render saliency maps for key ' + coordKey);
		displaySaliencyForCoordinates(coordKey);
	}
	else {
		var coordKey = getCoordinatesKey(row,col,false);
		console.log('render saliency maps for key ' + coordKey);
		displaySaliencyForCoordinates(coordKey);
	}
	var foo = 3;
}

function displaySaliencyForCoordinates(coordKey){
	console.log('displaySaliencyFor Coordinates ' + coordKey);
	var saliencyId = saliencyCoordinatesMap[coordKey];
	console.log('saliencyId looked up is ' + saliencyId);
	renderExplanationSaliencyMaps(saliencyId);
}
function getCoordinatesKey(row, col, isAggregate){
	var coordKey = '';
	if (isAggregate) {
		coordKey = 'group_'+ row + "_" + col;
	}
	else {
		coordKey = 'bar_'+ row + "_" + col;
	}
	return coordKey;
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