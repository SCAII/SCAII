function getSaliencyV2UI() {
    var ui = {};
    ui.uimap = getSaliencyV2UIMap();

    ui.renderSaliencyAccessControls = function() {
        clearSaliencyControls();
        populateSaliencyQuestionSelector();
        addWhatButton();
    }
   
    ui.getContextStringForDetailedSaliencyMapRow = function(barType){
        if (barType == "action"){
            return "Saliency maps for action";
        }
        else {
            // assume "reward"
            return "Saliency maps for reward";
        }
    }
    
    ui.getContextStringForCombinedSaliencyMapRow = function(barType){
        if (barType == "action"){
            return "Combined saliency map for action";
        }
        else {
            // assume "reward"
            return "Combined saliency map for reward";
        }
	}


	ui.renderSaliencyDetailed = function(chartData) {
        $("#saliency-div").remove();
        createSaliencyContainers();
        
        var selectedBars = chartData.getBarsFlaggedForShowingSaliency();
        var rewardOrAction = selectedBars[0].type;
        this.uimap.normalizationFactor = getNormalizationFactorForDisplayStyleAndResolution('detailed', rewardOrAction, chartData.actions);
		
		for (var i in selectedBars){
            var scaleFactor = 1.0;
            // if (i > 0){
            //     scaleFactor = 0.8;
            // }
			var bar = selectedBars[i];
			var saliencyId = bar.saliencyId;
			var layerMessage = saliencyLookupMap.get(saliencyId);
			if (layerMessage == undefined){
				console.log("ERROR - no Layer message for saliencyID " + saliencyId);
			}
			else {
                var expLayers = layerMessage.getLayersList();
                var contextString = this.getContextStringForDetailedSaliencyMapRow(bar.type);
				var nameContainerDiv = getNameDivForRow(i, bar, contextString);
				$("#saliency-maps").append(nameContainerDiv);
                var rowInfoString = getRowInfoString(bar);
				//var normalizationFactor = getNormalizationFactor(expLayers);
				for (var j in expLayers) {
					expLayer = expLayers[j];
					//console.log('found layer ' + expLayer.getName());
					var name = expLayer.getName();
					var cells = expLayer.getCellsList();
					var width = expLayer.getWidth();
                    var height = expLayer.getHeight();
                    var realUIName = renameEntityInfoForIUI(name);
					this.uimap.renderExplLayer(saliencyId, Number( j ) + Number( 1 ), i, realUIName, rowInfoString + realUIName, cells, width, height, this.uimap.normalizationFactor, scaleFactor);
				} 
			}
        }
        if (this.uimap.currentlyHighlightedSaliencyMapKey != undefined) {
            this.uimap.showSaliencyMapOutline(this.uimap.currentlyHighlightedSaliencyMapKey);
        }
	}

	
	ui.renderSaliencyCombined = function(chartData) {
        $("#saliency-div").remove();
        createSaliencyContainers();
        var selectedBars = chartData.getBarsFlaggedForShowingSaliency();
        var rewardOrAction = selectedBars[0].type;
        this.uimap.normalizationFactor = getNormalizationFactorForDisplayStyleAndResolution('combined', rewardOrAction, chartData.actions);
		for (var i in selectedBars){
			var bar = selectedBars[i];
			var saliencyId = bar.saliencyId;
			var layerMessage = saliencyLookupMap.get(saliencyId);
			if (layerMessage == undefined){
				console.log("ERROR - no Layer message for saliencyID " + saliencyId);
			}
			else {
                var expLayers = layerMessage.getLayersList();
                var contextString = this.getContextStringForCombinedSaliencyMapRow(bar.type);
				var nameContainerDiv = getNameDivForRow(i, bar, contextString);
				$("#saliency-maps").append(nameContainerDiv);
				var rowInfoString = getRowInfoString(bar);
                var aggregatedCells = getAggregatedCells(expLayers);
                
				//var normalizationFactor = getNormalizationFactorFromCells(aggregatedCells);
				var width = expLayers[0].getWidth();
				var height = expLayers[0].getHeight();
				this.uimap.renderExplLayer(saliencyId, 1, i, "all features cumulative", rowInfoString, aggregatedCells, width, height, this.uimap.normalizationFactor, 1.0);
			}
		}
	}

    return ui;
}


function getRowInfoString(bar) {
    var parts = bar.fullName.split(".");
    var result = "";
    if (parts.length == 1){
        result = parts[0]; 
    }
    else {
        result = parts[0] + ', ' + parts[1];
    } 
	return result;
}


function getAggregatedCells(expLayers){
	var result = [];
	var cellsCount = expLayers[0].getCellsList().length;
	for (i = 0; i < cellsCount; i++) {
		var totalForCell = 0;
		for (var j in expLayers){
			var expLayer = expLayers[j];
			totalForCell = totalForCell + expLayer.getCellsList()[i];
		}
		result[i] = totalForCell;
	}
	return result;
}

function getNameDivForRow(rowIndex, bar, contextString){
    var nameContainerDiv = document.createElement("div");
    nameContainerDiv.setAttribute("class", "flex-column");
	nameContainerDiv.setAttribute("style", getGridPositionStyle(0,rowIndex) + '; width:200px;text-align:center; border-style: solid; border-width:1px;font-family:Arial;');
    
    var contextDiv = document.createElement("div");
	contextDiv.setAttribute("style", 'width:200px;padding-top:100px; text-align:center; font-family:Arial;');
    contextDiv.innerHTML = contextString; 
    nameContainerDiv.append(contextDiv);

    var nameDiv = document.createElement("div");
	nameDiv.setAttribute("style", 'width:200px;padding-top:25px; text-align:center; font-family:Arial;');
    nameDiv.innerHTML = getRowInfoString(bar);     
    nameContainerDiv.append(nameDiv);
	return nameContainerDiv;
}

function createSaliencyContainers() {
	var saliencyDiv = document.createElement("DIV");
	saliencyDiv.setAttribute("id", "saliency-div");
	saliencyDiv.setAttribute("class", "saliencies-bg");
	saliencyDiv.setAttribute("style", "display:block;clear:both;");
	$("#scaii-interface").append(saliencyDiv);

	var saliencyGroup = document.createElement("DIV");
	saliencyGroup.setAttribute("id", "saliency-group");
	saliencyGroup.setAttribute("class", "flex-row saliencies-bg");
	//saliencyGroup.setAttribute("style", "margin-left:20px; margin-top:20px; margin-right: 20px;");
	$("#saliency-div").append(saliencyGroup);

	var saliencyContent = document.createElement("DIV");
	saliencyContent.setAttribute("id", "saliency-content");
	saliencyContent.setAttribute("class", "flex-column saliencies-bg");
	$("#saliency-group").append(saliencyContent);

	
	var saliencyMapsTitledContainer = document.createElement("DIV");
	saliencyMapsTitledContainer.setAttribute("id", "saliency-maps-titled-container");
	saliencyMapsTitledContainer.setAttribute("class", "titled-container flex-column saliencies-bg");
	$("#saliency-content").append(saliencyMapsTitledContainer);

	var saliencyMaps = document.createElement("DIV");
	saliencyMaps.setAttribute("id", "saliency-maps");
	saliencyMaps.setAttribute("class", "grid");
	$("#saliency-maps-titled-container").append(saliencyMaps);

    $("#saliency-div")      .on("click",regionClickHandlerSaliency);
}


function populateSaliencyQuestionSelector(){
	$("#what-radios").empty();
	
	// SALIENCY SECTION
	var radioCombinedSaliency = document.createElement("input");
	radioCombinedSaliency.setAttribute("type","radio");
	radioCombinedSaliency.setAttribute("name","saliencyView");
	radioCombinedSaliency.setAttribute("id","relevance-combined-radio");
	radioCombinedSaliency.setAttribute("value","saliencyCombined");
    radioCombinedSaliency.setAttribute("style", "margin-left:20px;");
    if (currentExplManager.saliencyCombined){
        radioCombinedSaliency.setAttribute("checked", "true");
    }
	radioCombinedSaliency.onclick = function(e) {
        currentExplManager.saliencyCombined = true;
        targetClickHandler(e, "setSaliencyView:combinedSaliency");
        currentExplManager.render();
	};

	var combinedSaliencyLabel = document.createElement("div");
	combinedSaliencyLabel.setAttribute("style", "margin-left:10px;margin-top:3px;font-family:Arial;font-size:14px;");
	combinedSaliencyLabel.innerHTML = "relevance combined";
	combinedSaliencyLabel.setAttribute("id","relevance-combined-label");

	var radioDetailedSaliency = document.createElement("input");
	radioDetailedSaliency.setAttribute("type","radio");
	radioDetailedSaliency.setAttribute("name","saliencyView");
	radioDetailedSaliency.setAttribute("id","relevance-detailed-radio");
	radioDetailedSaliency.setAttribute("value","saliencyDetailed");
    radioDetailedSaliency.setAttribute("style", "margin-left:20px;");
    if (!currentExplManager.saliencyCombined){
        radioDetailedSaliency.setAttribute("checked", "true");
    }
	radioDetailedSaliency.onclick = function(e) {
        currentExplManager.saliencyCombined = false;
        targetClickHandler(e, "setSaliencyView:detailedSaliency");
        currentExplManager.render();
	};

	var detailedSaliencyLabel = document.createElement("div");
	detailedSaliencyLabel.setAttribute("style", "margin-left:10px;margin-top:3px;font-family:Arial;font-size:14px;");
	detailedSaliencyLabel.innerHTML = "relevance details";
	detailedSaliencyLabel.setAttribute("id","relevance-detailed-label");
	
	$("#what-radios").append(radioCombinedSaliency);
	$("#what-radios").append(combinedSaliencyLabel);
	$("#what-radios").append(radioDetailedSaliency);
	$("#what-radios").append(detailedSaliencyLabel);
}


function clearSaliencyControls() {
    $("#relevance-combined-radio").remove();
	$("#relevance-detailed-radio").remove();
	$("#relevance-combined-label").remove();
	$("#relevance-detailed-label").remove();
}

function processWhatClick() {
    if (currentExplManager.saliencyVisible){
        currentExplManager.saliencyVisible = false;
        $("#what-questions").toggleClass('saliency-active');
        $("#what-label").toggleClass('saliency-active');
        currentExplManager.render();
    }
    else {
        currentExplManager.saliencyVisible = true;
        $("#what-questions").toggleClass('saliency-active');
        $("#what-label").toggleClass('saliency-active');
        currentExplManager.render();
    }
}


function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
	  x: evt.clientX - rect.left,
	  y: evt.clientY - rect.top
	};
  }