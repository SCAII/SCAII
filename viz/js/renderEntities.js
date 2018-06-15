var entityHPToolTipIds = [];
var selectedToolTipIds = {};
var entityAllDataToolTipIds = [];
var hoveredAllDataToolTipIds = {};
var masterEntities = {};
var shapeLogStrings = {};
var shapeInfoForHighlighting = {};


function removeFullShapeIdFromTrackingLists(fullShapeId) {
    removeMemoryOfToolTip(selectedToolTipIds, entityHPToolTipIds, fullShapeId);
    removeMemoryOfToolTip(hoveredAllDataToolTipIds, entityAllDataToolTipIds, fullShapeId);
}

var masterEntities = {};


function handleEntities(entitiesList) {
    shapeLogStrings = {};
    cleanToolTips();
    for (var i in entitiesList) {
        var entity = entitiesList[i];
        if (entity.hasId()) {
            var idString = '' + entity.getId();
            if (masterEntities[idString] == undefined) {
                if (entity.hasDelete() && entity.getDelete()) {
                    // do not add new entity that is marked as delete
                }
                else {
                    masterEntities[idString] = entity;
                    copyMapsIntoUpdateablePosition(entity)
                }
            }
            else {
                if (entity.hasDelete() && entity.getDelete()) {
                    delete masterEntities[idString];
                }
                else {
                    var masterEntity = masterEntities[idString];
                    updateMasterEntity(masterEntity, entity);
                }
            }
        }
        else {
            console.log('-----ERROR----- no entity ID on entity');
        }
    }
    renderState(gameboard_ctx, gameboard_canvas, masterEntities, gameScaleFactor, 0, 0, shapePositionMapForContext["game"], true);
    // disable zoom box for now
    //drawZoomBox(gameboard_ctx, gameboard_canvas, zoomBoxOriginX, zoomBoxOriginY, zoomFactor);
    //renderState(gameboard_zoom_ctx, gameboard_zoom_canvas, masterEntities, zoomFactor, zoomBoxOriginX, zoomBoxOriginY, shapePositionMapForContext["zoom"]);
}

function sortEntitiesAsPerUILayer(entities) {
    var uiLayerEntities = [];
    var nonUiLayerEntities = [];
    for (var i in entities) {
        var entity = entities[i];
        if (entity.hasUiLayer()) {
            uiLayerEntities.push(entity);
        }
        else {
            nonUiLayerEntities.push(entity);
        }
    }
    var sortedUiLayerEntities = sortUiLayerEntities(uiLayerEntities);
    var result = [];
    result = result.concat(nonUiLayerEntities);
    result = result.concat(uiLayerEntities);
    return result;
}

function sortUiLayerEntities(entities) {
    var layerList = [];
    var layerMap = {};
    for (var i in entities) {
        var entity = entities[i];
        var uiLayer = entity.getUiLayer();
        if (!layerList.includes(uiLayer)) {
            layerList.push(uiLayer);
        }
        var entityAtLayerList = layerMap[uiLayer];
        if (undefined == entityAtLayerList) {
            entityAtLayerList = [];
            layerMap[uiLayer] = entityAtLayerList;
        }
        entityAtLayerList.push(entity);
    }
    var entitiesSortedByLayer = [];
    layerList.sort();
    for (var i in layerList) {
        var layer = layerList[i];
        var entityAtLayerList = layerMap[layer];
        for (var j in entityAtLayerList) {
            var entity = entityAtLayerList[j];
            entitiesSortedByLayer.push(entity);
        }
    }
    return entitiesSortedByLayer;
}
function renderState(ctx, canvas, entities, zoom_factor, xOffset, yOffset, shapePositionMap, generateTooltips) {
    clearGameBoard(ctx, canvas);
    var uiLayerSortedEntities = sortEntitiesAsPerUILayer(entities);
    for (var i in uiLayerSortedEntities) {
        var entity = uiLayerSortedEntities[i];
        if (entity != undefined) {
            if (entity.hasPos()) {
                var pos = entity.getPos();
                if (pos.hasX() && pos.hasY()) {
                    var x = pos.getX();
                    var y = pos.getY();
                    layoutEntityAtPosition(Number(i), ctx, x, y, entity, zoom_factor, xOffset, yOffset, shapePositionMap, generateTooltips);
                }
            }
        }
    }
}


function layoutEntityAtPosition(entityIndex, ctx, x, y, entity, zoom_factor, xOffset, yOffset, shapePositionMap, generateTooltips) {
    var entityX = zoom(x - xOffset);
    var entityY = zoom(y - yOffset);
    var shapesList = entity.getShapesList();
    for (var j in shapesList) {
        var shape = shapesList[j];
        var shapeInfo = {}; // so we remember what this is
        var si = shapeInfo;
        //
        si.entity = entity;
        si.shapePositionMap = shapePositionMap;
        si.ctx = ctx;
        si.entityIndex = entityIndex;
        si.entityX = entityX;
        si.entityY = entityY;
        si.zoom_factor = zoom_factor;
        si.shapeId = getShapeId(entity, shape);
        setRelativePosition(si, shape);
        setAbsolutePosition(si);
        si.rotation_in_radians = shape.getRotation();
        setHitPointsInfo(si, entity);

        //console.log('entity had hp ' + hitPoints);
        if (shape.hasRect()) {
            renderRectangle(si, shape);
            si.tooltipX = si.x - si.width / 2 - 10;
            si.tooltipY = si.y - si.height / 2 - 10;
        }
        else if (shape.hasTriangle()) {
           // renderTriangle(si, shape);
            renderTriangleAsKite(si, shape);
            si.tooltipX = si.x - (si.baseLen + 6) / 2 - 10;
            si.tooltipY = si.y - (si.baseLen + 6) / 2 - 10;
        }
        else if (shape.hasKite()) {
            renderKite(si, shape);
            si.tooltipX = si.x - (si.baseLen + 6) / 2 - 10;
            si.tooltipY = si.y - (si.baseLen + 6) / 2 - 10;
        }
        else if (shape.hasCircle()) {
            renderCircle(si, shape);
            si.tooltipX = si.x - (si.radius + 6) / 2 - 10;
            si.tooltipY = si.y - (si.radius + 6) / 2 - 10;
        }
        else if (shape.hasOctagon()) {
            renderOctagon(si, shape);
            si.tooltipX = si.x - 10;
            si.tooltipY = si.y - (getOctagonHeight(si) + 6) / 2 - 10;
        }

        else if (shape.hasArrow()) {
            renderArrow(si, shape);
            si.tooltipX = undefined;
            si.tooltipY = undefined;
        }
        if (si.tooltipX != undefined) {
            if (generateTooltips){
                createToolTips(si);
            }
        }
    }
}

function renderArrow(si, shape) {
    si.type = "arrow";
    var arrow = shape.getArrow();
    if (!arrow.hasTargetPos()) {
        return;
    }
    var targetPos = arrow.getTargetPos();
    if (!pos.hasX() || !pos.hasY()) {
        return;
    }
    si.targetX = targetPos.getX();
    si.targetY = targetPos.getY();
    si.thickness = 2;
    si.headlength = 6;
    si.headwidth = 2;
    if (arrow.hasThickness()) {
        si.thickness = arrow.getThickness();
    }
    if (arrow.hasHeadLength()) {
        si.headlength = arrow.getHeadLength();
    }
    if (arrow.hasHeadWidth()) {
        si.headwidth = arrow.getHeadWidth();
    }

    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawArrow(si);
    shapeInfoForHighlighting[si.shapeId] = si;
}

function renderCircle(si, shape) {
    si.type = "circle";
    var circ = shape.getCircle();
    si.radius = zoom(40);
    if (circ.hasRadius()) {
        si.radius = zoom(circ.getRadius());
    }

    var shapePoints = getShapePoints(si.x, si.y, si.radius + 6, si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawCircle(si, "normal");
    shapeInfoForHighlighting[si.shapeId] = si;
}

function renderRectangle(si, shape) {
    si.type = "rect";
    var rect = shape.getRect();
    si.width = zoom(40);
    si.height = zoom(30);
    if (rect.hasWidth()) {
        si.width = zoom(rect.getWidth());
    }
    if (rect.hasHeight()) {
        si.height = zoom(rect.getHeight());
    }
    var shapePoints = getShapePoints(si.x, si.y, Math.max(si.width, si.height) + 6, si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawRect(si,"normal");
    shapeInfoForHighlighting[si.shapeId] = si;
}

function renderOctagon(si, shape) {
    si.type = "octagon";
    var oct = shape.getOctagon();
    si.edgeTop = zoom(40);
    si.edgeCorner = zoom(40);
    si.edgeLeft = zoom(40);
    if (oct.hasEdgeTop()) {
        si.edgeTop = zoom(oct.getEdgeTop());
    }
    if (oct.hasEdgeLeft()) {
        si.edgeLeft = zoom(oct.getEdgeLeft());
    }
    if (oct.hasEdgeCorner()) {
        si.edgeCorner = zoom(oct.getEdgeCorner());
    }
    var shapePoints = getShapePoints(si.x, si.y, Math.max(getOctagonHeight(si), getOctagonWidth(si)) + 6, si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawOctagon(si, "normal");
    shapeInfoForHighlighting[si.shapeId] = si;
}

function renderTriangle(si, shape) {
    si.type = "triangle";
    var triangle = shape.getTriangle();
    si.baseLen = zoom(triangle.getBaseLen());
    var shapePoints = getShapePoints(si.x, si.y, si.baseLen + 6, si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    //drawTriangle(ctx, x, y, baseLen, orientation, colorRGBA);
    drawTriangle(si, "normal");
    shapeInfoForHighlighting[si.shapeId] = si;
}

function renderTriangleAsKite(si, shape) {
    si.type = "kite";
    var triangle = shape.getTriangle();
    si.baseLen = zoom(triangle.getBaseLen());
    var sizeFudgeFactor = 2.5;
    si.baseLen = si.baseLen * sizeFudgeFactor;
    var radians = 60 * Math.PI / 180;
    si.width = (Math.tan(radians) * si.baseLen) / 2;
    si.length = si.baseLen;
    var shapePoints = getShapePoints(si.x, si.y, si.baseLen + 6, si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    //drawTriangle(ctx, x, y, baseLen, orientation, colorRGBA);
    drawKite(si, "normal");
    shapeInfoForHighlighting[si.shapeId] = si;
}

function renderKite(si, shape) {
    si.type = "kite";
    var kite = shape.getKite();
    si.length = zoom(kite.getLength());
    si.width = zoom(kite.getWidth());
    var shapePoints = getShapePoints(si.x, si.y, Math.max(si.width, si.length), si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawKite(si, "normal");
    shapeInfoForHighlighting[si.shapeId] = si;
}
