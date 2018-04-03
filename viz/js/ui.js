
var gameboardWidth;
var gameboardHeight;
var timeline_canvas = document.createElement("canvas");
var timeline_ctx = timeline_canvas.getContext("2d");
var pauseResumeButton = document.createElement("BUTTON");
var rewindButton = document.createElement("BUTTON");
//var speedSlider = document.createElement("input");
var zoomSlider = document.createElement("input");
rewindButton.disabled = true;
rewindButton.setAttribute("id", "rewindButton");
pauseResumeButton.disabled = true;
pauseResumeButton.setAttribute("id", "pauseResumeButton");

// Create the gameboard canvas
var gameboard_canvas = document.createElement("canvas");
var gameboard_ctx = gameboard_canvas.getContext("2d");

var gameboard_zoom_canvas = document.createElement("canvas");
var gameboard_zoom_ctx = gameboard_zoom_canvas.getContext("2d");

var expl_ctrl_canvas = document.createElement("canvas");
var expl_ctrl_ctx = expl_ctrl_canvas.getContext("2d");
expl_ctrl_ctx.imageSmoothingEnabled = false;

var gameScaleFactor = 6;
var spacingFactor = 1;
var sizingFactor = 1;
var zoomFactor = 3;
var zoomBoxOriginX = 0;
var zoomBoxOriginY = 0;


var entitiesList = undefined;
var shapePositionMapForContext = {};
var primaryHighlightedShapeIds = [];
var secondaryHighlightedShapeIds = [];
var game_background_color = "#123456";

var initUI = function () {
	//configureSpeedSlider();
	//configureZoomSlider();
	drawExplanationTimeline();
	controlsManager.setControlsNotReady();
	gameboard_canvas.width = 40 * gameScaleFactor;
	gameboard_canvas.height = 40 * gameScaleFactor;
	gameboard_zoom_canvas.width = gameboard_canvas.width;
	gameboard_zoom_canvas.height = gameboard_canvas.height;
	$("#scaii-gameboard").append(gameboard_canvas);
	
	controlsManager.registerJQueryHandleForWaitCursor($("#scaii-interface"));
	$("#scaii-gameboard").css("width", gameboard_canvas.width);
	$("#scaii-gameboard").css("height", gameboard_canvas.height);
	$("#scaii-gameboard").css("background-color", game_background_color);

	$("#scaii-gameboard-zoom").append(gameboard_zoom_canvas);
	$("#scaii-gameboard-zoom").css("width", gameboard_zoom_canvas.width);
	$("#scaii-gameboard-zoom").css("height", gameboard_zoom_canvas.height);
	$("#scaii-gameboard-zoom").css("background-color", game_background_color);

	configureLabelContainer("#progress-label","14px","progress", "right");
	configureLabelContainer("#explanation-control-label","14px","explanations", "right");
	configureLabelContainer("#playback-label","14px","", "right");
	
	//$("#replay-speed-panel").append(speedSlider);

	rewindButton.setAttribute("class", "playbackButton");
	rewindButton.setAttribute("id", "rewindButton");
	rewindButton.innerHTML = '<img src="imgs/rewind.png", height="14px" width="14px"/>';
	rewindButton.onclick = tryRewind;
	$("#playback-panel").append(rewindButton);
	$("#rewindButton").css("padding-top","4px");
	$("#rewindButton").css("opacity", "0.6");
	rewindButton.disabled = true;
	//$("#scaii-game-controls").css("text-align", "center");

	pauseResumeButton.setAttribute("class", "playbackButton");
	pauseResumeButton.setAttribute("id", "pauseResumeButton");
	pauseResumeButton.innerHTML = '<img src="imgs/play.png", height="16px" width="14px"/>';

	$("#playback-panel").append(pauseResumeButton);
	$("#pauseResumeButton").css("padding-top","2px");
	$("#pauseResumeButton").css("padding-bottom","0px");
	$("#pauseResumeButton").css("margin-left","20px");
	pauseResumeButton.onclick = tryPause;
	$("#pauseResumeButton").css("opacity", "0.6");
	pauseResumeButton.disabled = true;


	var zoomSliderLabel = document.createElement("div");
	$("#scaii-zoom-controls").append(zoomSliderLabel);
	zoomSliderLabel.setAttribute("id", "zoom-slider-label");
	$("#zoom-slider-label").html("zoom");
	$("#zoom-slider-label").css("font-family", "Fira Sans");
	$("#zoom-slider-label").css("font-size", "12px");
	$("#zoom-slider-label").css("padding-left", "6px");
	$("#zoom-slider-label").css("padding-right", "4px");
	$("#zoom-slider-label").css("padding-top", "2px");
	$("#scaii-zoom-controls").append(zoomSlider);

	$("#game-progress").click(tryProcessTimelineClick);
	actionLabel.setAttribute("id", "action-label");
	$("#action-label-div").append(actionLabel);
	$("#action-label").html(" ");
	//$("#action-label").html("action");
	actionNameLabel.setAttribute("id", "action-name-label");
	$("#action-name-div").append(actionNameLabel);
	$("#action-name-label").html(" ");
}


gameboard_canvas.addEventListener('click', function (event) {
	if (event.shiftKey) {
		adjustZoomBoxPosition(event.offsetX, event.offsetY);
		handleEntities(entitiesList);
	}
	else {
		shapeId = getClosestInRangeShapeId(gameboard_ctx, event.offsetX, event.offsetY, shapePositionMapForContext["game"]);
		primaryHighlightedShapeIds = [];
		if (shapeId != undefined) {
			primaryHighlightedShapeIds.push(shapeId);
		}
		handleEntities(entitiesList);
	}

});
gameboard_zoom_canvas.addEventListener('click', function (event) {
	shapeId = getClosestInRangeShapeId(gameboard_zoom_ctx, event.offsetX, event.offsetY, shapePositionMapForContext["zoom"]);
	primaryHighlightedShapeIds = [];
	if (shapeId != undefined) {
		primaryHighlightedShapeIds.push(shapeId);
	}
	handleEntities(entitiesList);


});

function adjustZoomBoxPosition(x, y) {
	// they clicked at new target for center of box.
	var boxWidth = gameboard_canvas.width / zoomFactor;
	var boxHeight = gameboard_canvas.height / zoomFactor;
	zoomBoxOriginX = x - boxWidth / 2;
	zoomBoxOriginY = y - boxHeight / 2;
	if (zoomBoxOriginX < 0) {
		zoomBoxOriginX = 0;
	}
	else if (zoomBoxOriginX > gameboard_canvas.width - boxWidth) {
		zoomBoxOriginX = gameboard_canvas.width - boxWidth;
	}
	else {
		// a-ok - they clicked in the middle somewhere
	}
	if (zoomBoxOriginY < 0) {
		zoomBoxOriginY = 0;
	}
	else if (zoomBoxOriginY > gameboard_canvas.height - boxHeight) {
		zoomBoxOriginY = gameboard_canvas.height - boxHeight;
	}
	else {
		// a-ok - they clicked in the middle somewhere
	}
}

function clearGameBoards() {
	clearGameBoard(gameboard_ctx, gameboard_canvas, "game");
	clearGameBoard(gameboard_zoom_ctx, gameboard_zoom_canvas, "zoom");
}

var drawExplanationTimeline = function() {
	expl_ctrl_ctx.clearRect(0,0, expl_ctrl_canvas.width, expl_ctrl_canvas.height);
	var can_width = 240;
	
	expl_ctrl_canvas.width = can_width;
	expl_ctrl_canvas.height = 30;
	$("#explanation-control-panel").append(expl_ctrl_canvas);
	let ctx = expl_ctrl_ctx;
	
	ctx.beginPath();
	ctx.moveTo(0,explanationControlYPosition);
	ctx.lineTo(can_width,explanationControlYPosition);
	ctx.stroke();

	console.log("drawing explanation control");
	ctx.restore();
}

function drawZoomBox(ctx, canvas, originX, originY, zoom) {
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'white';
	var width = canvas.width / zoom;
	var height = canvas.height / zoom;
	ctx.rect(originX, originY, width, height);
	ctx.stroke();
	//ctx.strokeRect(originX, originY, height, width);
}
function clearGameBoard(ctx, canvas, shapePositionMapKey) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//gameboard_ctx.clearRect(0, 0, gameboard_canvas.width, gameboard_canvas.height);
	//gameboard_zoom_ctx.clearRect(0, 0, gameboard_zoom_canvas.width, gameboard_zoom_canvas.height);
	shapePositionMapForContext[shapePositionMapKey] = {};
}

var draw_example_shapes = function () {
	clearGameBoard(gameboard_ctx, gameboard_canvas, "game");
	colorRGBA = getBasicColorRGBA();
	drawRect(gameboard_ctx, 100, 100, 80, 80, colorRGBA);
	drawTriangle(gameboard_ctx, 200, 200, 80, 'red');
}

var configureSpeedSlider = function () {
	speedSlider.setAttribute("type", "range");
	speedSlider.setAttribute("min", "1");
	speedSlider.setAttribute("max", "100");
	speedSlider.setAttribute("value", "90");
	speedSlider.setAttribute("class", "slider");
	speedSlider.setAttribute("id", "speed-slider");
	speedSlider.setAttribute("orient","vertical");
	speedSlider.oninput = function () {
		var speedString = "" + this.value;
		var args = [speedString];
		var userCommand = new proto.scaii.common.UserCommand;
		userCommand.setCommandType(proto.scaii.common.UserCommand.UserCommandType.SET_SPEED);
		userCommand.setArgsList(args);
		stageUserCommand(userCommand);
	}
	//<input type="range" min="1" max="100" value="50" class="slider" id="myRange">
}
var configureZoomSlider = function () {
	zoomSlider.setAttribute("type", "range");
	zoomSlider.setAttribute("min", "100");
	zoomSlider.setAttribute("max", "600");
	zoomSlider.setAttribute("value", "200");
	zoomSlider.setAttribute("class", "slider");
	zoomSlider.setAttribute("id", "zoom-slider");
	zoomSlider.oninput = function () {
		zoomFactor = "" + this.value / 100;
		console.log("zoom factor " + zoomFactor);
		handleEntities(entitiesList);
	}
}
var configureLabelContainer = function(id, fontSize, textVal, textAlign) {
	$(id).css("font-family", "Fira Sans");
	$(id).css("font-size", fontSize);
	$(id).css("padding-left", "0px");
	$(id).css("padding-right", "4px");
	$(id).css("padding-top", "2px");
	$(id).css("text-align", textAlign);
	$(id).html(textVal);
}
var subtractPixels = function(a,b){
	var intA = a.replace("px", "");
	var intB = b.replace("px", "");
	return intA - intB;
}