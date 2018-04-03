// gameboard
var gameboardWidth;
var gameboardHeight;

//canvases
var gameboard_canvas = document.createElement("canvas");
var gameboard_ctx = gameboard_canvas.getContext("2d");
var game_background_color = "#123456";

var timeline_canvas = document.createElement("canvas");
var timeline_ctx = timeline_canvas.getContext("2d");

// navigation 
var pauseResumeButton = document.createElement("BUTTON");
var rewindButton = document.createElement("BUTTON");
rewindButton.disabled = true;
rewindButton.setAttribute("id", "rewindButton");
pauseResumeButton.disabled = true;
pauseResumeButton.setAttribute("id", "pauseResumeButton");
//var speedSlider = document.createElement("input");

// explanation controls
var expl_ctrl_canvas = document.createElement("canvas");
var expl_ctrl_ctx = expl_ctrl_canvas.getContext("2d");
expl_ctrl_ctx.imageSmoothingEnabled = false;
var actionLabel = document.createElement("LABEL");
var actionNameLabel = document.createElement("LABEL");

// controlsManager encapsulates:
// - enabling/disabling controls
// - blocking/unblocking user input
// - changing graphics on buttons
var controlsManager = configureControlsManager(pauseResumeButton, rewindButton);

//scaling
var gamePixelDimension = 40;
var gameScaleFactor = 6;
var spacingFactor = 1;
var sizingFactor = 1;

// entities, shapes
var entitiesList = undefined;
var shapePositionMapForContext = {};
var primaryHighlightedShapeIds = [];
var secondaryHighlightedShapeIds = [];
var shape_outline_color = '#202020';
var shape_outline_width = 2;
var use_shape_color_for_outline = false;

function getTrueGameWidth() {
	return gamePixelDimension * gameScaleFactor;
}

function getTrueGameHeight() {
	return gamePixelDimension * gameScaleFactor;
}

function configureGameboardCanvas(){
	gameboard_canvas.width = getTrueGameWidth();
	gameboard_canvas.height = getTrueGameHeight();
	$("#scaii-gameboard").css("width", gameboard_canvas.width);
	$("#scaii-gameboard").css("height", gameboard_canvas.height);
	$("#scaii-gameboard").css("background-color", game_background_color);
	$("#scaii-gameboard").append(gameboard_canvas);
	//addZoomControlToGameboardCanvas(gameboard_canvas);
}

function configureLabelContainers() {
	configureLabelContainer("#progress-label","14px","progress", "right");
	configureLabelContainer("#explanation-control-label","14px","explanations", "right");
	configureLabelContainer("#playback-label","14px","", "right");
}

function configureNavigationButtons(){
	configureRewindButton();
	configurePauseResumeButton();
}

function configureRewindButton(){
	rewindButton.setAttribute("class", "playbackButton");
	rewindButton.setAttribute("id", "rewindButton");
	rewindButton.innerHTML = '<img src="imgs/rewind.png", height="14px" width="14px"/>';
	rewindButton.onclick = tryRewind;
	$("#playback-panel").append(rewindButton);
	$("#rewindButton").css("padding-top","4px");
	$("#rewindButton").css("opacity", "0.6");
	rewindButton.disabled = true;
}

function configurePauseResumeButton(){
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
}

function configureNavigationTimeline() {
	$("#game-progress").click(tryProcessTimelineClick);
}

function configureExplanationLabels(){
	actionLabel.setAttribute("id", "action-label");
	$("#action-label-div").append(actionLabel);
	$("#action-label").html(" ");
	//$("#action-label").html("action");
	actionNameLabel.setAttribute("id", "action-name-label");
	$("#action-name-div").append(actionNameLabel);
	$("#action-name-label").html(" ");
}


function drawExplanationTimeline() {
	expl_ctrl_ctx.clearRect(0,0, expl_ctrl_canvas.width, expl_ctrl_canvas.height);
	// just use width of gameboard for now, may need to be bigger
	var can_width = getTrueGameWidth();
	
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

function initUI() {
	//configureSpeedSlider();
	//configureZoomBox
	configureGameboardCanvas();
	drawExplanationTimeline();
	controlsManager.setControlsNotReady();
	controlsManager.registerJQueryHandleForWaitCursor($("#scaii-interface"));
	configureLabelContainers();
	configureNavigationButtons();
	configureNavigationTimeline();
	configureExplanationLabels();
}

function clearGameBoards() {
	clearGameBoard(gameboard_ctx, gameboard_canvas, "game");
	clearGameBoard(gameboard_zoom_ctx, gameboard_zoom_canvas, "zoom");
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
	$("#replay-speed-panel").append(speedSlider);
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