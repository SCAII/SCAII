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