
var masterEntities = {};
function handleEntities(entitiesList) {
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



function getClosestInRangeShapeId(ctx, x, y, shapePositionMap){
	console.log("");
	console.log("X " + x + " Y " + y);
	var closestId = undefined;
	for (key in shapePositionMap) {
		var shapePoints = shapePositionMap[key];
		if (closestId == undefined){
			var d = getDistance(x,y,shapePoints.x, shapePoints.y);
			if (d <= shapePoints.radius){
				closestId = shapePoints.id;
			}
		}
		else {
			var d = getDistance(x,y,shapePoints.x, shapePoints.y);
			if (d <= shapePoints.radius){
				var dClosest = getDistance(x,y,closest.x, closest.y);
				if(d < dClosest) {
					closestId = shapePoints.id;
				}
			}
		}
	}
	return closestId;
}

function getDistance(x1,y1,x2,y2){
	console.log("x2 " + x2 + " y2 " + y2);
	var a = x2 - x1;
	var b = y2 - y1;
	var d = Math.sqrt( a*a + b*b );
	console.log('a ' + a + ' b ' + b + ' d ' + d);
	return d;
}
function getShapePoints(x,y,radiusBasis, id){
	shape = {};
	shape.x = x;
	shape.y = y;
	shape.radius = radiusBasis / 2.0;
	shape.id = id;
	return shape;
}
function drawRect(ctx, x, y, width, height, rotation_in_radians, colorRGBA) {
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
  ctx.beginPath();

  ctx.lineWidth = shape_outline_width;
  ctx.strokeStyle = shape_outline_color;
  if (use_shape_color_for_outline) {
    ctx.strokeStyle = colorRGBA;
  }
  ctx.strokeRect(x1, y1, height, width);
  ctx.fillStyle = colorRGBA;
  //ctx.fillStyle = colorRGBA;
  ctx.fillRect(x1, y1, height, width);
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
  //console.log('drawing rect ' + x1 + ' ' + x2 + ' ' + y1 + ' ' + y2 + ';' + colorRGBA);
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

function getAbsoluteOrigin(x, y, relPos, zoom_factor) {
  var xDelta = 0;
  var yDelta = 0;
  if (relPos.hasX()) {
    xDelta = relPos.getX();
  }
  if (relPos.hasY()) {
    yDelta = relPos.getY();
  }
  // x and y are already zoomed prior to being passed in
  var absX = x + xDelta * zoom_factor;
  var absY = y + yDelta * zoom_factor;
  //if (absX < 0) {
  //  absX = 0;
  //}
  //if (absY < 0) {
  //  absY = 0;
  //}
  return [absX, absY];
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
  //console.log('drawing triangle ' + xTip + ',' + yTip + ' ; ' + xBottomRight + ',' + yBottom + ' ; ' + xBottomLeft + ',' + yBottom + ';' + colorRGBA);
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


function drawDiamond(ctx, x, y, baseLen, rotation_in_radians, colorRGBA) {
  var sizeFudgeFactor = 1.4; // with math below, diamond is too small so just boost the baselen so we can keep the math simple later
  baseLen = baseLen * sizeFudgeFactor;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotation_in_radians);
  x = 0;
  y = 0;
  var radians = 60 * Math.PI / 180;
  var height = (Math.tan(radians) * baseLen) / 2;
 // var yTip = y - height / 2;
 // var yBottom = y + height / 2;
 // var xTip = x;
  var yTip = y;
  var yBottom = y;
  var xTip = x + height / 2;
  var xBottom = x - height / 2;
  var xLeftWing = x - height / 4;
  var yLeftWing = y - baseLen / 3;
  var xRightWing = x - height / 4;
  var yRightWing = y + baseLen / 3;
  
  var gradient = ctx.createLinearGradient(xBottom, yBottom, xTip, yTip);
  gradient.addColorStop(0, colorRGBA);
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
    ctx.strokeStyle = colorRGBA;
  }
  ctx.stroke();

  // the fill color
  //ctx.fillStyle = colorRGBA;
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

function layoutEntityAtPosition(ctx, x, y, entity, zoom_factor, xOffset, yOffset, shapePositionMap) {
  var final_x = (x - xOffset) * zoom_factor;
  var final_y = (y - yOffset) * zoom_factor;
  var shapesList = entity.getShapesList();
  for (var j in shapesList) {
    var shape = shapesList[j];
    //
	var shapeId = entity.getId() + "." + shape.getId();
	var relPos = undefined;
    if (shape.hasRelativePos()) {
      relPos = shape.getRelativePos();
    }
	else {
      relPos = new proto.scaii.common.Pos;
      relPos.setX(0.0);
      relPos.setY(0.0);
    }
	var absPos = getAbsoluteOrigin(final_x, final_y, relPos, zoom_factor);
	var absX = absPos[0];
	var absY = absPos[1];
	var orientation = 0.0;
	orientation = shape.getRotation();
	if (shape.hasRect()) {
	  var rect = shape.getRect();
	  var width = 40;
	  var height = 30;
	  if (rect.hasWidth()) {
	    width = rect.getWidth();
	  }
	  if (rect.hasHeight()) {
	    height = rect.getHeight();
	  }
	  var final_width = width * zoom_factor;
	  var final_height = height * zoom_factor;
      var shapePoints = getShapePoints(absX,absY,Math.max(final_width, final_height) + 6 * zoom_factor, shapeId) ;
      shapePositionMap[shapeId] = shapePoints;
//	  highlightShape(ctx,shapeId,shapePositionMap);
	  var colorRGBA = loadShapeColorAsRGBAString(shape);
	  drawRect(ctx, absX, absY, final_width, final_height, orientation, colorRGBA);
	}
	else if (shape.hasTriangle()) {
	  var triangle = shape.getTriangle();
	  var baseLen = triangle.getBaseLen();
	  var finalBaseLen = baseLen * zoom_factor;
      var shapePoints = getShapePoints(absX,absY,finalBaseLen + 6 * zoom_factor, shapeId) ;
      shapePositionMap[shapeId] = shapePoints;
//	  highlightShape(ctx,shapeId,shapePositionMap);
	  var colorRGBA = loadShapeColorAsRGBAString(shape);
	  //drawTriangle(ctx, x, y, baseLen, orientation, colorRGBA);
	  drawDiamond(ctx, absX, absY, finalBaseLen, orientation, colorRGBA);
	}
  }
}

function getColorRGBA(r,g,b,a) {
  color = {};
  color['R'] = r;
  color['G'] = g;
  color['B'] = b;
  color['A'] = a;
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
}
function getBasicColorRGBA() {
  color = {};
  color['R'] = 200;
  color['G'] = 200;
  color['B'] = 200;
  color['A'] = 0.5;
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
}
function loadShapeColorAsRGBAString(shape) {
  color = {};
  color['R'] = 200;
  color['G'] = 200;
  color['B'] = 200;
  color['A'] = 0.5;
  if (shape.hasColor()) {
    var color = shape.getColor();
    if (color.hasR()) {
      color['R'] = color.getR();
    }
    if (color.hasG()) {
      color['G'] = color.getG();
    }
    if (color.hasB()) {
      color['B'] = color.getB();
    }
    if (color.hasA()) {
      color['A'] = color.getA() / 255;
    }
  }
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
}

function limitFilterColorValue(value) {
  if (value < 0) {
    return 0;
  }
  else if (value > 255) {
    return 255;
  }
  else return value;
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
          layoutEntityAtPosition(ctx, x , y , entity, zoom_factor, xOffset, yOffset, shapePositionMap);
        }
      }
    }
  }
}

function highlightShape(ctx, shapeId, shapePositionMap) {
  if (-1 != $.inArray(shapeId,primaryHighlightedShapeIds)){
	  highlightShapePrimary(ctx,shapeId, shapePositionMap);
  }
  else if (-1 != $.inArray(shapeId,secondaryHighlightedShapeIds)){
	  highlightShapeSecondary(ctx, shapeId, shapePositionMap);
  }
  else {
	  // do nothing
  }
}


function highlightShapePrimary(ctx, shapeId, shapePositionMap){
  var shapePoints = shapePositionMap[shapeId];
  ctx.beginPath();
  ctx.arc(shapePoints.x, shapePoints.y, shapePoints.radius, 0, 2 * Math.PI, false);
  //ctx.fillStyle = 'red';
  //ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'red';
  ctx.stroke();
}

function highlightShapeSecondary(ctx, shapeId, shapePositionMap){
  var shapePoints = shapePositionMap[shapeId];
  ctx.beginPath();
  ctx.arc(shapePoints.x, shapePoints.y, shapePoints.radius, 0, 2 * Math.PI, false);
  //ctx.fillStyle = 'white';
  //ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'white';
  ctx.stroke();
}








