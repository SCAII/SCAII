var entityHPToolTipIds = [];
var selectedToolTipIds = {};
var entityAllDataToolTipIds = [];
var hoveredAllDataToolTipIds = {};
var masterEntities = {};
var shapeLogStrings = {};


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
    renderState(gameboard_ctx, gameboard_canvas, masterEntities, gameScaleFactor, 0, 0, shapePositionMapForContext["game"]);
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
function renderState(ctx, canvas, entities, zoom_factor, xOffset, yOffset, shapePositionMap) {
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
                    layoutEntityAtPosition(Number(i), ctx, x, y, entity, zoom_factor, xOffset, yOffset, shapePositionMap);
                }
            }
        }
    }
}


function layoutEntityAtPosition(entityIndex, ctx, x, y, entity, zoom_factor, xOffset, yOffset, shapePositionMap) {
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
            renderTriangle(si, shape);
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
            createToolTips(si);
        }
    }
}

function renderArrow(si, shape) {
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
}

function renderCircle(si, shape) {
    var circ = shape.getCircle();
    si.radius = zoom(40);
    if (circ.hasRadius()) {
        si.radius = zoom(rect.getRadius());
    }

    var shapePoints = getShapePoints(si.x, si.y, si.radius + 6, si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawCircle(si);
}

function renderRectangle(si, shape) {
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
    drawRect(si);
}

function renderOctagon(si, shape) {
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
    drawOctagon(si);
}

function renderTriangle(shapeInfo, shape) {
    var si = shapeInfo;
    var triangle = shape.getTriangle();
    si.baseLen = zoom(triangle.getBaseLen());
    var shapePoints = getShapePoints(si.x, si.y, si.baseLen + 6, si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    //drawTriangle(ctx, x, y, baseLen, orientation, colorRGBA);
    drawTriangle(si);
}

function renderKite(shapeInfo, shape) {
    var si = shapeInfo;
    var kite = shape.getKite();
    si.length = zoom(kite.getLength());
    si.width = zoom(kite.getWidth());
    var shapePoints = getShapePoints(si.x, si.y, Math.max(si.width, si.length), si.shapeId);
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawKite(si);
}

function drawCircle(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x, si.y);
    ctx.rotate(si.rotation_in_radians);
    ctx.beginPath();
    ctx.arc(0, 0, si.radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}



function drawRect(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x, si.y);
    ctx.rotate(si.rotation_in_radians);
    x = 0;
    y = 0;
    var x1 = x - (si.height / 2);
    //if (x1 < 0) {
    //  x1 = 0;
    //}
    var y1 = y - (si.width / 2);
    //if (y1 < 0) {
    //  y1 = 0;
    //}
    var x2 = x + (si.height / 2);
    var y2 = y + (si.width / 2);
    ctx.beginPath();

    ctx.lineWidth = shape_outline_width;
    ctx.strokeStyle = shape_outline_color;
    if (use_shape_color_for_outline) {
        ctx.strokeStyle = si.colorRGBA;
    }
    ctx.strokeRect(x1, y1, si.height, si.width);
    ctx.fillStyle = si.colorRGBA;
    //ctx.fillStyle = colorRGBA;
    ctx.fillRect(x1, y1, si.height, si.width);
    ctx.restore();
}


function drawRectWithGradient(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x, si.y);
    ctx.rotate(si.rotation_in_radians);
    x = 0;
    y = 0;
    var x1 = x - (si.height / 2);
    //if (x1 < 0) {
    //  x1 = 0;
    //}
    var y1 = y - (si.width / 2);
    //if (y1 < 0) {
    //  y1 = 0;
    //}
    var x2 = x + (si.height / 2);
    var y2 = y + (si.width / 2);

    var gradient = ctx.createLinearGradient(x1, si.y, x2, si.y);
    gradient.addColorStop(0, si.colorRGBA);
    gradient.addColorStop(1, 'white');
    ctx.beginPath();

    ctx.lineWidth = shape_outline_width;
    ctx.strokeStyle = shape_outline_color;
    if (use_shape_color_for_outline) {
        ctx.strokeStyle = si.colorRGBA;
    }
    ctx.strokeRect(x1, y1, height, width);
    ctx.fillStyle = gradient;
    //ctx.fillStyle = colorRGBA;
    ctx.fillRect(x1, y1, height, width);
    ctx.restore();
}

function drawTriangle(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x, si.y);
    ctx.rotate(si.rotation_in_radians);
    x = 0;
    y = 0;
    var radians = 60 * Math.PI / 180;
    var height = (Math.tan(radians) * si.baseLen) / 2;
    var yTip = y - height / 2;
    var yBottom = y + height / 2;
    var xTip = x;
    var xBottomLeft = x - si.baseLen / 2;
    var xBottomRight = x + si.baseLen / 2;
    ctx.beginPath();
    ctx.moveTo(xTip, yTip);
    ctx.lineTo(xBottomRight, yBottom);
    ctx.lineTo(xBottomLeft, yBottom);
    ctx.closePath();

    // the outline
    ctx.lineWidth = shape_outline_width;
    ctx.strokeStyle = shape_outline_color;
    if (use_shape_color_for_outline) {
        ctx.strokeStyle = si.colorRGBA;
    }
    ctx.stroke();

    // the fill color
    ctx.fillStyle = si.colorRGBA;
    ctx.fill();
    ctx.restore();
}


function drawKite(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x, si.y);
    ctx.rotate(si.rotation_in_radians);
    x = 0;
    y = 0;
    var yTip = y;
    var yBottom = y;
    var xTip = x + si.width / 2;
    var xBottom = x - si.width / 2;
    var xLeftWing = x - si.width / 4;
    var yLeftWing = y - si.length / 3;
    var xRightWing = x - si.width / 4;
    var yRightWing = y + si.length / 3;

    var gradient = ctx.createLinearGradient(xBottom, yBottom, xTip, yTip);
    gradient.addColorStop(0, si.colorRGBA);
    gradient.addColorStop(1, 'white');

    ctx.beginPath();
    ctx.moveTo(xTip, yTip);
    ctx.lineTo(xLeftWing, yLeftWing);
    ctx.lineTo(xBottom, yBottom);
    ctx.lineTo(xRightWing, yRightWing);
    ctx.closePath();

    // the outline
    ctx.lineWidth = shape_outline_width;
    ctx.strokeStyle = shape_outline_color;
    if (use_shape_color_for_outline) {
        ctx.strokeStyle = si.colorRGBA;
    }
    ctx.stroke();

    // the fill color
    //ctx.fillStyle = colorRGBA;
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
}


function drawOctagon(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x, si.y);
    ctx.rotate(si.rotation_in_radians);
    var x1 = si.x - si.edgeTop / 2;
    var y1 = si.y - getOctagonHeight(si) / 2;
    var x2 = si.x + si.edgeTop / 2;
    var y2 = y1;

    var x3 = si.x + getOctagonWidth(si) / 2;
    var y3 = si.y - si.edgeLeft / 2;
    var x4 = x3;
    var y4 = si.y + si.edgeLeft / 2;

    var x5 = x2;
    var y5 = si.y + getOctagonHeight(si) / 2;
    var x6 = x1;
    var y6 = y5;

    var x7 = si.x - getOctagonWidth(si) / 2;
    var y7 = y4;
    var x8 = x7;
    var y8 = y3;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.lineTo(x5, y5);
    ctx.lineTo(x6, y6);
    ctx.lineTo(x7, y7);
    ctx.lineTo(x8, y8);
    ctx.lineTo(x1, y1);
    ctx.closePath();

    // the outline
    ctx.lineWidth = shape_outline_width;
    ctx.strokeStyle = shape_outline_color;
    if (use_shape_color_for_outline) {
        ctx.strokeStyle = si.colorRGBA;
    }
    ctx.stroke();

    // the fill color
    ctx.fillStyle = si.colorRGBA;
    ctx.fill();
    ctx.restore();
}

function drawArrow(shapeInfo) {
    var si = shapeInfo;
    var fromx = si.x;
    var fromy = si.y;
    var tox = si.targetX;
    var toy = si.targetY;
    //variables to be used when creating the arrow

    var ctx = si.ctx;
    var headlen = si.headlength;

    var angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.save();
    //starting path of the arrow from the start square to the end square and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.strokeStyle = si.colorRGBA;
    ctx.lineWidth = si.thickness;
    ctx.stroke();

    //starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7), toy - headlen * Math.sin(angle + Math.PI / 7));

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));

    //draws the paths created above
    ctx.strokeStyle = si.colorRGBA;
    ctx.lineWidth = si.thickness;
    ctx.stroke();
    ctx.fillStyle = si.colorRGBA;
    ctx.fill();
    ctx.restore();
}