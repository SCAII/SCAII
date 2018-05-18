var entityHPToolTipIds = [];
var selectedToolTipIds = {};
var entityAllDataToolTipIds = [];
var hoveredAllDataToolTipIds = {};
var masterEntities = {};


function removeFullShapeIdFromTrackingLists(fullShapeId){
  removeMemoryOfToolTip(selectedToolTipIds, entityHPToolTipIds, fullShapeId);
  removeMemoryOfToolTip(hoveredAllDataToolTipIds, entityAllDataToolTipIds, fullShapeId);
}

function removeMemoryOfToolTip(someDict, someArray, someId) {
  var index = someArray.indexOf(someId);
  if (index !== -1) {
    someArray.splice(index, 1);
    delete someDict[someId];
  }
}

function cleanToolTips(){
	for (var i in entityHPToolTipIds){
		var id = entityHPToolTipIds[i];
		$("#"+id).remove();
  }
  entityHPToolTipIds = [];
  for (var i in entityAllDataToolTipIds){
		var id = entityAllDataToolTipIds[i];
		$("#"+id).remove();
    }
    entityAllDataToolTipIds = [];
}

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

function getClosestInRangeShapeId(ctx, x, y, shapePositionMap){
	var closestId = undefined;
	var closestDistance = undefined;
	for (key in shapePositionMap) {
		var shapePoints = shapePositionMap[key];
		if (closestId == undefined){
			var d = getDistance(x,y,shapePoints.x, shapePoints.y);
			if (d <= shapePoints.radius){
				closestId = shapePoints.id;
				closestDistance = d;
			}
		}
		else {
			var d = getDistance(x,y,shapePoints.x, shapePoints.y);
			if (d <= shapePoints.radius){
				if(d < closestDistance) {
					closestId = shapePoints.id;
					closestDistance = d;
				}
			}
		}
	}
	return closestId;
}

function getDistance(x1,y1,x2,y2){
    var a = x2 - x1;
    var b = y2 - y1;
    var d = Math.sqrt( a*a + b*b );
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

function getShapeId(entity, shape) {
  return entity.getId() + "_" + shape.getId();
}

function zoom(value) {
    return value * gameScaleFactor;
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

function createToolTips(shapeInfo) {
    createHPToolTip(shapeInfo);
    createAllDataToolTip(shapeInfo);
}

function setRelativePosition(shapeInfo, shape) {
    if (shape.hasRelativePos()) {
        shapeInfo.relPos = shape.getRelativePos();
    }
    else {
        var relPos = new proto.scaii.common.Pos;
        relPos.setX(0.0);
        relPos.setY(0.0);
        shapeInfo.relPos = relPos;
    }
}

function setAbsolutePosition(si) {
    var absPos = getAbsoluteOrigin(si.entityX, si.entityY, si.relPos, si.zoom_factor);
    si.x = absPos[0];
    si.y = absPos[1];
}

function setHitPointsInfo(si, entity) {
    si.hitPoints =getNumericValueFromFloatStringMap(entity, "Hitpoints");
    si.maxHitPoints = getNumericValueFromFloatStringMap(entity, "Max Hp");
    if (si.hitPoints != undefined) {
        si.percentHPRemaining = si.hitPoints / si.maxHitPoints;
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
function getNumericValueFromFloatStringMap(entity, key){
  var map = entity.floatstringmetadataMap;
  var value = undefined;
  if (undefined != map) {
    valueString = map.get(key);
    value = (Number(valueString)).toFixed(2);
  }
  return value;
}

function getIsEnemy(entity){
  var map = entity.boolstringmetadataMap;
  if (undefined != map) {
    var isEnemy = map.get("Enemy?");
    if (isEnemy == "true") {
      return true;
    }
    return false;
  }
}

function getIsFriend(entity){
  var map = entity.boolstringmetadataMap;
  if (undefined != map) {
    var isFriend = map.get("Friend?");
    if (isFriend == "true") {
      return true;
    }
    return false;
  }
}

function getUnitType(entity){
  var map = entity.stringmetadataMap;
  var type = undefined;
  if (undefined != map) {
    type = map.get("Unit Type");
  }
  return type;
}

function createHPToolTip(shapeInfo) {
    var si = shapeInfo;
    var z_index = si.entityIndex + 2;
    if (undefined != si.percentHPRemaining) {
        var canvas_bounds = gameboard_canvas.getBoundingClientRect();
        var hpDiv = document.createElement("div");
        var setToShow = selectedToolTipIds[si.shapeId];
        if (setToShow == undefined || setToShow == "hide"){
          hpDiv.setAttribute("class","tooltip-invisible");
        }
        
        var id = "metadata_hp" + si.shapeId;
        hpDiv.setAttribute("id",id);
         // position it relative to where origin of bounding box of gameboard is
        var y = si.tooltipY + canvas_bounds.top;
        var x = si.tooltipX + canvas_bounds.left;
        var hpWidgetWidth = 20;
        var hpWidgetHeight = 3;
        hpDiv.setAttribute("class", "flex-row");
        hpDiv.setAttribute("style", 'background-color:black;zIndex:' + z_index + ';position:absolute;left:' + x + 'px;top:' + y + 'px;color:' + si.colorRGBA + ';height:' + hpWidgetHeight + 'px;width:' + hpWidgetWidth + 'px');
        $("#scaii-gameboard").append(hpDiv);
    
        var hpRemainingDivWidth = hpWidgetWidth * si.percentHPRemaining;
        var hpLostDivWidth = hpWidgetWidth - hpRemainingDivWidth;
    
        var remainingHpDiv = document.createElement("div");
        remainingHpDiv.setAttribute("style", 'background-color:white;height:' + hpWidgetHeight + 'px;width:' + hpRemainingDivWidth + 'px');
        hpDiv.append(remainingHpDiv);
    
        entityHPToolTipIds.push(id);
      }
}

function createAllDataToolTip(shapeInfo) {
    var si = shapeInfo;
    var z_index = si.entityIndex + 2000;
    var canvas_bounds = gameboard_canvas.getBoundingClientRect();
    var valuesDiv = document.createElement("div");
    var setToShow = hoveredAllDataToolTipIds[si.shapeId];
    if (setToShow == undefined || setToShow == "hide"){
      valuesDiv.setAttribute("class","tooltip-invisible");
    }
    var id = "metadata_all" + si.shapeId;
    hoveredAllDataToolTipIds[id] = "hide";
    valuesDiv.setAttribute("id",id);
     // position it relative to where origin of bounding box of gameboard is
    var y = si.y + canvas_bounds.top + 20;
    var x = si.y + canvas_bounds.left + -125;
    valuesDiv.setAttribute("style", 'padding:4px;background-color:black;zIndex:' + z_index + ';position:absolute;left:' + x + 'px;top:' + y + 'px;color:white;	display: flex;flex-direction: column;font-family:Arial');
    $("#scaii-gameboard").append(valuesDiv);
    entityAllDataToolTipIds.push(id);
  
    var hpLabel = document.createElement("div");
    var hitPoints = getNumericValueFromFloatStringMap(si.entity,"Hitpoints");
    hpLabel.innerHTML = 'HP   : ' + hitPoints;
    valuesDiv.append(hpLabel);
    
    var mhpLabel = document.createElement("div");
    var maxHitPoints = getNumericValueFromFloatStringMap(si.entity,"Max Hp");
    mhpLabel.innerHTML = 'Max HP: ' + maxHitPoints;
    valuesDiv.append(mhpLabel);
    
    var enemyLabel = document.createElement("div");
    var isEnemy = getIsEnemy(si.entity);
    enemyLabel.innerHTML = 'Enemy: ' + isEnemy;
    valuesDiv.append(enemyLabel);
  
    var friendLabel = document.createElement("div");
    var isFriend = getIsFriend(si.entity);
    friendLabel.innerHTML = 'Friend: ' + isFriend;
    valuesDiv.append(friendLabel);
    
    var unitTypeLabel = document.createElement("div");
    var type = getUnitType(si.entity);
    unitTypeLabel.innerHTML = 'Unit Type: ' + type;
    valuesDiv.append(unitTypeLabel);
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

function isBlueColor(color){
  var r = Number(color.getR());
  var g = Number(color.getG());
  var b = Number(color.getB());

   if (r == 0 && g == 0 && b == 255) {
     return true;
   }
   return false;
}

function loadShapeColorAsRGBAString(shape) {
  color = {};
  color['R'] = 200;
  color['G'] = 200;
  color['B'] = 200;
  color['A'] = 0.5;
  if (shape.hasColor()) {
    var color = shape.getColor();
    if (isBlueColor(color)){
      var betterColorThanBlue = 'rgba(255,181,0,1.0)';
      return betterColorThanBlue;
    }
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
          layoutEntityAtPosition(Number(i), ctx, x , y , entity, zoom_factor, xOffset, yOffset, shapePositionMap);
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








