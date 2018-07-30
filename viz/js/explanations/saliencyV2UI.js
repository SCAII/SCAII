function getSaliencyV2UI() {
    var ui = {};
    ui.renderSaliencyAccessControls = function() {
        clearSaliencyControls();
        //FIXME
        alert("called renderSaliencyAccessControls");
    }
    ui.renderSaliencyCombined = function() {
        clearSaliencies();
        createSaliencyContainers();
        //FIXME
        
        alert("called renderSaliencyCombined");
    }
    
    ui.renderSaliencyDetailed = function() {
        clearSaliencies();
        createSaliencyContainers();
        //FIXME
        alert("called renderSaliencyDetailed");
    }
    return ui;
}


function createSaliencyContainers() {
	var saliencyDiv = document.createElement("DIV");
	saliencyDiv.setAttribute("id", "saliency-div");
    saliencyDiv.setAttribute("class", "r1c0_2 saliencies-bg");
	$("#scaii-interface").append(saliencyDiv);

	var saliencyGroup = document.createElement("DIV");
	saliencyGroup.setAttribute("id", "saliency-group");
	saliencyGroup.setAttribute("class", "flex-row saliencies-bg");
	//saliencyGroup.setAttribute("style", "margin-left:20px; margin-top:20px; margin-right: 20px;");
	$("#saliency-div").append(saliencyGroup);

	
	// selections area will be hidden so wedon't see checkboxes
	var saliencySelections = document.createElement("DIV");
	saliencySelections.setAttribute("id", "saliency-selections");
	saliencySelections.setAttribute("class", "flex-column  saliencies-bg");
	//saliencySelections.setAttribute("style", "visibility:hidden;");
	$("#saliency-group").append(saliencySelections);

	var saliencySelectionsTitle = document.createElement("DIV");
	saliencySelectionsTitle.setAttribute("id", "saliency-selections-title");
	saliencySelectionsTitle.setAttribute("class", "saliencies-bg");
	saliencySelectionsTitle.html = 'Generating Rewards';
	$("#saliency-selections").append(saliencySelectionsTitle);
	
	var saliencyCheckboxes = document.createElement("DIV");
	saliencyCheckboxes.setAttribute("id", "saliency-checkboxes");
	saliencyCheckboxes.setAttribute("class", "grid saliencies-bg");
	$("#saliency-selections").append(saliencyCheckboxes);



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
    if (currentChartV2.saliencyCombined){
        radioCombinedSaliency.setAttribute("checked", "true");
    }
	radioCombinedSaliency.onclick = function(e) {
        currentChartV2.saliencyCombined = true;
        targetClickHandler(e, "setSaliencyView:combinedSaliency");
        currentChartV2.render();
	};

	var combinedSaliencyLabel = document.createElement("div");
	combinedSaliencyLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	combinedSaliencyLabel.innerHTML = "relevance combined";
	combinedSaliencyLabel.setAttribute("id","relevance-combined-label");

	var radioDetailedSaliency = document.createElement("input");
	radioDetailedSaliency.setAttribute("type","radio");
	radioDetailedSaliency.setAttribute("name","saliencyView");
	radioDetailedSaliency.setAttribute("id","relevance-detailed-radio");
	radioDetailedSaliency.setAttribute("value","saliencyDetailed");
    radioDetailedSaliency.setAttribute("style", "margin-left:20px; ");
    if (!currentChartV2.saliencyCombined){
        radioDetailedSaliency.setAttribute("checked", "true");
    }
	radioDetailedSaliency.onclick = function(e) {
        currentChartV2.saliencyCombined = false;
        targetClickHandler(e, "setSaliencyView:detailedSaliency");
        currentChartV2.render();
	};

	var detailedSaliencyLabel = document.createElement("div");
	detailedSaliencyLabel.setAttribute("style", "margin-left:10px;font-family:Arial;font-size:14px;");
	detailedSaliencyLabel.innerHTML = "relevance details";
	detailedSaliencyLabel.setAttribute("id","relevance-detailed-label");
	
	$("#what-radios").append(radioCombinedSaliency);
	$("#what-radios").append(combinedSaliencyLabel);
	$("#what-radios").append(radioDetailedSaliency);
	$("#what-radios").append(detailedSaliencyLabel);
}



function clearSaliencies() {
    $("#saliency-div").remove();
}
function clearSaliencyControls() {
    $("#relevance-combined-radio").remove();
	$("#relevance-detailed-radio").remove();
	$("#relevance-combined-label").remove();
	$("#relevance-detailed-label").remove();
}