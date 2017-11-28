function drawRect(ctx, x, y, width, height, colorRGBA) {
  width = width * sizingFactor;
  height = height * sizingFactor;
  x = x * spacingFactor;
  y = y * spacingFactor;
  var x1 = x - (width / 2);
  if (x1 < 0) {
    x1 = 0;
  }
  var y1 = y - (height / 2);
  if (y1 < 0) {
    y1 = 0;
  }
  var x2 = x + (width / 2);
  var y2 = y + (height / 2);

  //console.log('drawing rect ' + x1 + ' ' + x2 + ' ' + y1 + ' ' + y2 + ';' + colorRGBA);
  ctx.beginPath();

  ctx.lineWidth = shape_outline_width;
  ctx.strokeStyle = shape_outline_color;
  if (use_shape_color_for_outline) {
    ctx.strokeStyle = colorRGBA;
  }
  ctx.strokeRect(x1, y1, width, height);
  ctx.fillStyle = colorRGBA;
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
}

function getAbsoluteOrigin(x, y, relPos) {
  var xDelta = 0;
  var yDelta = 0;
  if (relPos.hasX()) {
    xDelta = relPos.getX();
  }
  if (relPos.hasY()) {
    yDelta = relPos.getY();
  }
  var absX = x + xDelta;
  var absY = y + yDelta;
  if (absX < 0) {
    absX = 0;
  }
  if (absY < 0) {
    absY = 0;
  }
  return [absX, absY];
}

function drawTriangle(ctx, x, y, baseLen, colorRGBA) {
  baseLen = baseLen * sizingFactor;
  x = x * spacingFactor;
  y = y * spacingFactor;
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
}

function layoutEntityAtPosition(ctx, x, y, entity) {
  var shapesList = entity.getShapesList();
  for (var j in shapesList) {
    var shape = shapesList[j];
    if (shape.hasRelativePos()) {
      var relPos = shape.getRelativePos();
      var absPos = getAbsoluteOrigin(x, y, relPos);
      var absX = absPos[0];
      var absY = absPos[2];
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
        var colorRGBA = loadShapeColorAsRGBAString(shape);
        drawRect(ctx, x, y, width, height, colorRGBA);
      }
      else if (shape.hasTriangle()) {
        var triangle = shape.getTriangle();
        var baseLen = triangle.getBaseLen();

        var colorRGBA = loadShapeColorAsRGBAString(shape);
        drawTriangle(ctx, x, y, baseLen, colorRGBA);
      }
    }
  }
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

function renderState(ctx, entities) {
  clearGameBoard();
  for (var i in entities) {
    var entity = entities[i];
    if (entity != undefined) {
      if (entity.hasPos()) {
        var pos = entity.getPos();
        if (pos.hasX() && pos.hasY()) {
          var x = pos.getX();
          var y = pos.getY();
          layoutEntityAtPosition(ctx, x, y, entity);
        }
      }
    }
  }
}