
var masterEntities = {};


function handleEntities(entitiesList) {
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

  
function renderState(ctx, canvas, entities, zoom_factor, xOffset, yOffset, shapePositionMap) {
    clearGameBoard(ctx, canvas);
    for (var i in entities) {
        var entity = entities[i];
        if (entity != undefined) {
            if (entity.hasPos()) {
                var pos = entity.getPos();
                if (pos.hasX() && pos.hasY()) {
                    var x = pos.getX();
                    var y = pos.getY();
                    layoutEntityAtPosition(Number(i), ctx, x , y , entity, zoom_factor, xOffset, yOffset, shapePositionMap);
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
            si.tooltipX = si.x - si.width/2 - 10;
            si.tooltipY = si.y - si.height/2 - 10;
        }
        else if (shape.hasTriangle()) {
            renderTriangle(si, shape);
            si.tooltipX = si.x - (si.baseLen + 6)/2 - 10;
            si.tooltipY = si.y - (si.baseLen + 6)/2 - 10;
        }
        createToolTips(si);
    }
}


function drawRect(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x,si.y);
    ctx.rotate(si.rotation_in_radians);
    var x_orig = si.x;
    var y_orig = si.y;
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


function drawRectWithGradient(ctx, x, y, width, height, rotation_in_radians, colorRGBA) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotation_in_radians);
  var x_orig = x;
  var y_orig = y;
  x = 0; 
  y = 0;
  var x1 = x - (height / 2);
  //if (x1 < 0) {
  //  x1 = 0;
  //}
  var y1 = y - (width / 2);
  //if (y1 < 0) {
  //  y1 = 0;
  //}
  var x2 = x + (height / 2);
  var y2 = y + (width / 2);

  var gradient = ctx.createLinearGradient(x1, y_orig, x2, y_orig);
  gradient.addColorStop(0, colorRGBA);
  gradient.addColorStop(1, 'white');
  ctx.beginPath();

  ctx.lineWidth = shape_outline_width;
  ctx.strokeStyle = shape_outline_color;
  if (use_shape_color_for_outline) {
    ctx.strokeStyle = colorRGBA;
  }
  ctx.strokeRect(x1, y1, height, width);
  ctx.fillStyle = gradient;
  //ctx.fillStyle = colorRGBA;
  ctx.fillRect(x1, y1, height, width);
  ctx.restore();
}

function drawTriangle(ctx, x, y, baseLen, rotation_in_radians, colorRGBA) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotation_in_radians);
  x = 0;
  y = 0;
  var radians = 60 * Math.PI / 180;
  var height = (Math.tan(radians) * baseLen) / 2;
  var yTip = y - height / 2;
  var yBottom = y + height / 2;
  var xTip = x;
  var xBottomLeft = x - baseLen / 2;
  var xBottomRight = x + baseLen / 2;
  ctx.beginPath();
  ctx.moveTo(xTip, yTip);
  ctx.lineTo(xBottomRight, yBottom);
  ctx.lineTo(xBottomLeft, yBottom);
  ctx.closePath();

  // the outline
  ctx.lineWidth = shape_outline_width;
  ctx.strokeStyle = shape_outline_color;
  if (use_shape_color_for_outline) {
    ctx.strokeStyle = colorRGBA;
  }
  ctx.stroke();

  // the fill color
  ctx.fillStyle = colorRGBA;
  ctx.fill();
  ctx.restore();
}


function drawKite(shapeInfo) {
    var si = shapeInfo;
    var ctx = si.ctx;
    ctx.save();
    ctx.translate(si.x,si.y);
    ctx.rotate(si.rotation_in_radians);
    x = 0;
    y = 0;
    var radians = 60 * Math.PI / 180;
    var height = (Math.tan(radians) * si.baseLen) / 2;
    // var yTip = y - height / 2;
    // var yBottom = y + height / 2;
    // var xTip = x;
    var yTip = y;
    var yBottom = y;
    var xTip = x + height / 2;
    var xBottom = x - height / 2;
    var xLeftWing = x - height / 4;
    var yLeftWing = y - si.baseLen / 3;
    var xRightWing = x - height / 4;
    var yRightWing = y + si.baseLen / 3;
    
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
    var shapePoints = getShapePoints(si.x,si.y,Math.max(si.width, si.height) + 6 , si.shapeId) ;
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    drawRect(si);
}


function renderTriangle(shapeInfo, shape) {
    var si = shapeInfo;
    var triangle = shape.getTriangle();
    si.baseLen = zoom(triangle.getBaseLen());
    var shapePoints = getShapePoints(si.x,si.y,si.baseLen + 6, si.shapeId) ;
    si.shapePositionMap[si.shapeId] = shapePoints;
    //	highlightShape(ctx,shapeId,shapePositionMap);
    si.colorRGBA = loadShapeColorAsRGBAString(shape);
    //drawTriangle(ctx, x, y, baseLen, orientation, colorRGBA);
    drawKite(si);
}







