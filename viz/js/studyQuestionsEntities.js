
function highlightShapeForIdForClickCollectionFeedback(shapeId){
    if (isStudyQuestionMode()){
        var info = shapeInfoForHighlighting[shapeId];
        if (info != undefined) {
            highlightShapeForClickCollectionFeedback(info);
        }
    }
}

function highlightShapeForClickCollectionFeedback(info){
    if (studyQuestionManager.renderer.controlsWaitingForClick.length == 0) {
        return;
    }
    var legalClickTargetRegions = studyQuestionManager.getLegalInstrumentationTargetsForCurrentQuestion();
    if (studyQuestionManager.renderer.isLegalRegionToClickOn("target:gameboard", legalClickTargetRegions)){
        // redraw from scratch in case this is our second click andwe have to delete evidence of prior click
        renderState(gameboard_canvas, masterEntities, gameScaleFactor, 0, 0, true);
        if (info.type == "rect") {
            drawRect(info, "outline");
        }
        else if (info.type == "kite") {
            drawKite(info, "outline");
        }
        else if (info.type == "circle"){
            drawCircle(info, "outline");
        }
        else if (info.type == "octagon"){
            drawOctagon(info, "outline");
        }
        else if (info.type == "triangle"){
            drawTriangle(info, "outline");
        }
        activeSaliencyDisplayManager.hideAllSaliencyMapOutlines();
    }
}

function clearHighlightedShapesOnGameboard(){
    renderState(gameboard_canvas, masterEntities, gameScaleFactor, 0, 0, true);
}

