

goog.require('proto.scaii.common.Action');
goog.require('proto.scaii.common.AgentCfg');
goog.require('proto.scaii.common.AgentEndpoint');
goog.require('proto.scaii.common.AgentSupported');
goog.require('proto.scaii.common.BackendCfg');
goog.require('proto.scaii.common.BackendEndpoint');
goog.require('proto.scaii.common.BackendInit');
goog.require('proto.scaii.common.BackendSupported');
goog.require('proto.scaii.common.BackendSupported.SerializationSupport');
goog.require('proto.scaii.common.Cfg');
goog.require('proto.scaii.common.Color');
goog.require('proto.scaii.common.CoreCfg');
goog.require('proto.scaii.common.CoreEndpoint');
goog.require('proto.scaii.common.Endpoint');
goog.require('proto.scaii.common.Entity');
goog.require('proto.scaii.common.Error');
goog.require('proto.scaii.common.InitAs');
goog.require('proto.scaii.common.ModuleCfg');
goog.require('proto.scaii.common.ModuleEndpoint');
goog.require('proto.scaii.common.ModuleInit');
goog.require('proto.scaii.common.ModuleSupported');
goog.require('proto.scaii.common.MultiMessage');
goog.require('proto.scaii.common.Other');
goog.require('proto.scaii.common.PluginType');
goog.require('proto.scaii.common.Pos');
goog.require('proto.scaii.common.Rect');
goog.require('proto.scaii.common.RustFFIConfig');
goog.require('proto.scaii.common.ScaiiPacket');
goog.require('proto.scaii.common.SerializationFormat');
goog.require('proto.scaii.common.SerializationRequest');
goog.require('proto.scaii.common.SerializationResponse');
goog.require('proto.scaii.common.Shape');
goog.require('proto.scaii.common.State');
goog.require('proto.scaii.common.SupportedBehavior');
goog.require('proto.scaii.common.Triangle');
goog.require('proto.scaii.common.Viz');
goog.require('proto.scaii.common.VizInit');




/**
* Copyright (c) 2017-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
var testingMode = false;
var sessionState = "pending";
// Create the canvas
var spacingFactor = 1;
var sizingFactor = 1;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 1400;
canvas.height = 1000;

document.body.appendChild(canvas);
var left_frame_width = 1000;
var cell_size = 50;
var rect_size = 50;
var unit_size = 32;
//var cell_colors = ['#404040', 'blue', 'black'];
var cell_colors = [];
var player_colors = ['blue', 'red', 'yellow']

var tick = 0;
var dealer;
var button_left = left_frame_width + 30;
var osu_button_left = left_frame_width + 30;

var masterEntities = {};

function logEntity(entity) {
  if (entity == undefined) {
    console.log('ENTITY undefined');
    return;
  }
  console.log('- - - - - - - - - - -');
  console.log('entity ' + entity.getId());
  console.log('- - - - - - - - - - -');
  var posString = getEntityPosString(entity);
  var deleteString = getEntityDeleteString(entity);
  console.log(posString + ' ; ' + deleteString);

  var shapes = entity.getShapesList();
  console.log('shape count ' + shapes.length);
  for (var i in shapes) {
    var shape = shapes[i];
    logShape(shape);
  }
}
function deleteShape(shapeList, shape) {
  var index = shapeList.indexOf(shape);
  if (index != -1) {
    shapeList.splice(index, 1);
  }
  else {
    console.log('ERROR - asked to delete shape that is not in master list!');
  }
}
function addShape(shapesList, shape) {
  masterShapes.push(updateShape);
}
function updateMasterPosition(masterPos, updatePos) {
  if (updatePos != undefined) {
    if (updatePos.hasX()) {
      masterPos.setX(updatePos.getX());
    }
    if (updatePos.hasY()) {
      masterPos.setY(updatePos.getY());
    }
  }
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
function updateMasterColor(masterShape, masterColor, updateColor) {
  if (updateColor == undefined) {
    return;
  }
  if (masterColor == undefined) {
    masterShape.setColor(updateColor);
    return;
  }
  if (updateColor.hasR()) {
    masterColor.setR(limitFilterColorValue(updateColor.getR()));
  }
  if (updateColor.hasG()) {
    masterColor.setG(limitFilterColorValue(updateColor.getG()));
  }
  if (updateColor.hasB()) {
    masterColor.setB(limitFilterColorValue(updateColor.getB()));
  }
  if (updateColor.hasA()) {
    masterColor.setA(limitFilterColorValue(updateColor.getA()));
  }
}
function updateMasterRect(masterShape, masterRect, updateRect) {
  if (updateRect == undefined) {
    return;
  }
  if (masterRect == undefined) {
    masterShape.setRect(updateRect);
    return;
  }
  if (updateRect.hasWidth()) {
    masterRect.setWidth(updateRect.getWidth());
  }
  console.log("CHECKING HEIGHT");
  if (updateRect.hasHeight()) {
    console.log('updating rect HEIGHT from ' + masterRect.getHeight() + ' to ' + updateRect.getHeight());
    masterRect.setHeight(updateRect.getHeight());
  }
}
function updateMasterTriangle(masterShape, masterTri, updateTri) {
  if (updateTri == undefined) {
    return;
  }
  if (masterTri == undefined) {
    masterShape.setTriangle(updateTri);
    return;
  }

  if (updateTri.hasBaseLen()) {
    masterTri.setBaseLen(updateTri.getBaseLen());
  }
}
function updateMasterShape(master, update) {
  var updatePos = update.getRelativePos();
  var masterPos = master.getRelativePos();
  updateMasterPosition(masterPos, updatePos);
  var updateColor = update.getColor();
  var masterColor = master.getColor();
  updateMasterColor(master, masterColor, updateColor);
  var updateRect = update.getRect();
  var masterRect = master.getRect();
  var updateTriangle = update.getTriangle();
  var masterTriangle = master.getTriangle();
  if (masterRect != undefined) {
    if (updateTriangle != undefined) {
      // the triangle is replacing the rectangle
      master.clearRect();
      master.setTriangle(updateTriangle)
    }
    else if (updateRect != undefined) {
      // we're updating the existing rectangle
      updateMasterRect(master, masterRect, updateRect);
    }
    else {
      // do nothing
    }

  }
  else if (masterTriangle != undefined) {
    if (updateRect != undefined) {
      //the rectangle is replacing the triangle
      master.clearTriangle();
      master.setRect(updateRect);
    }
    else if (updateTriangle != undefined) {
      // we're updating the triangle  
      updateMasterTriangle(master, masterTriangle, updateTriangle);
    }
    else {
      //do nothing
    }
  }
}
function getShapeWithMatchingId(shapesList, shapeId) {
  for (var i in shapesList) {
    var shape = shapesList[i];
    if (!shape.hasId()) {
      console.log('-----ERROR----- shape in master shapes list has no id');
    }
    else if (shape.getId() == shapeId) {
      return shape;
    }
  }
  return undefined;
}
function updateMasterEntity(master, update) {
  if (update.hasPos()) {
    var updatePos = update.getPos();
    if (master.hasPos()) {
      var masterPos = master.getPos();
      updateMasterPosition(masterPos, updatePos);
    }
    else {
      master.setPos(update.getPos());
    }
  }
  var masterShapes = master.getShapesList();
  var updateShapes = update.getShapesList();
  var newShapesToAdd = [];
  for (var i in updateShapes) {
    var updateShape = updateShapes[i];
    if (!updateShape.hasId()) {
      console.log('-------ERROR------ updateShape has no id');
      continue;
    }
    var updateShapeId = updateShape.getId();
    var masterShape = getShapeWithMatchingId(masterShapes, updateShapeId);
    if (masterShape == undefined) {
      addShape(masterShapes, updateShape);
    }
    else {
      if (updateShape.hasDelete() && updateShape.getDelete()) {
        console.log('DELETING shape ' + updateShapeId);
        deleteShape(masterShapes, masterShape);
      }
      else {
        updateMasterShape(masterShape, updateShape);
      }
    }
  }
}
function drawTriangle(x, y, baseLen, colorRGBA) {
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
  console.log('drawing triangle ' + xTip + ',' + yTip + ' ; ' + xBottomRight + ',' + yBottom + ' ; ' + xBottomLeft + ',' + yBottom);
  ctx.beginPath();
  ctx.moveTo(xTip, yTip);
  ctx.lineTo(xBottomRight, yBottom);
  ctx.lineTo(xBottomLeft, yBottom);
  ctx.closePath();

  // the outline
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#202020';
  ctx.stroke();

  // the fill color
  //ctx.fillStyle = "#FFCC00";
  ctx.fillStyle = colorRGBA;
  ctx.fill();
}
function drawRect(x, y, width, height, colorRGBA) {
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
  if (x2 > 200) {
    x2 = 200;
  }
  var y2 = y + (height / 2);
  if (y2 > 200) {
    y2 = 200;
  }

  console.log('drawing rect ' + x1 + ' ' + x2 + ' ' + y1 + ' ' + y2);
  ctx.beginPath();
  ctx.strokeStyle = colorRGBA;
  //ctx.rect(x1, y1, x2 - x1, y2 - y1);
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  // ctx.stroke();
  //ctx.closePath();
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
function layoutEntityAtPosition(x, y, entity) {
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
        drawRect(x, y, width, height, colorRGBA);
      }
      else if (shape.hasTriangle()) {
        var triangle = shape.getTriangle();
        var baseLen = 40;
        if (triangle.hasBaseLen()) {
          base_len = triangle.getBaseLen();
        }
        var colorRGBA = loadShapeColorAsRGBAString(shape);
        drawTriangle(x, y, baseLen, colorRGBA);
      }
    }
  }

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
      color['A'] = color.getA();
    }
  }
  var result = 'rgba(' + color['R'] + ',' + color['G'] + ',' + color['B'] + ',' + color['A'] + ')';
  return result;
}
function renderState(entities) {
  clearUI();
  for (var i in entities) {
    var entity = entities[i];
    if (entity != undefined) {
      if (entity.hasPos()) {
        var pos = entity.getPos();
        if (pos.hasX() && pos.hasY()) {
          var x = pos.getX();
          var y = pos.getY();
          layoutEntityAtPosition(x, y, entity);
        }
      }
    }


  }
}
function handleVizInit(vizInit) {
  clearUI();
  ctx.fillText("Received VizInit!", 10, 50);
  if (vizInit.hasTestMode()) {
    if (vizInit.getTestMode()) {
      testingMode = true;
    }
  }

  mm = buildEchoVizInitMultiMessage(vizInit);
  return mm;
}
function handleViz(vizData) {
  console.log('received Viz...');
  var entitiesList = vizData.getEntitiesList()
  console.log('entities count :' + entitiesList.length);
  for (var i in entitiesList) {
    var entity = entitiesList[i];

    if (entity.hasId()) {
      var idString = '' + entity.getId();
      if (idString == '8') {
        console.log('=========== UPDATING ENTITY ===================')
        logEntity(entity);
      }
      console.log('############## id string read as ' + idString + '###############');
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
      if (idString == '8') {
        console.log('=========== MASTER ENTITY AFTER UPDATE===================')
        logEntity(masterEntities[idString]);
      }

    }
    else {
      console.log('-----ERROR----- no entity ID on entity');
    }

  }
  renderState(masterEntities);

}
function buildEchoVizInitMultiMessage(vizInit) {
  var returnScaiiPacket = new proto.scaii.common.ScaiiPacket;
  returnScaiiPacket.setVizInit(vizInit);
  var mm = buildReturnMultiMessageFromScaiiPacket(returnScaiiPacket);
  return mm;
}
function buildMultiMessageWithUserCommand(userCommand) {
  var returnScaiiPacket = new proto.scaii.common.ScaiiPacket;
  returnScaiiPacket.setUserCommand(userCommand);
  var mm = buildReturnMultiMessageFromScaiiPacket(returnScaiiPacket);
  return mm;
}
function buildReturnMultiMessageFromState(entities) {
  var entityKeys = Object.keys(entities);
  var returnState = new proto.scaii.common.Viz;
  for (var i in entityKeys) {
    var entityId = entityKeys[i]
    var entity = entities[entityId];
    if (entityId == '8') {
      console.log('++++++++++++++ENTITY SEND ' + entityId + '++++++++++++++++');
      logEntity(entity);
    }

    returnState.addEntities(entity);
  }
  var returnScaiiPacket = new proto.scaii.common.ScaiiPacket;

  returnScaiiPacket.setViz(returnState);
  var mm = buildReturnMultiMessageFromScaiiPacket(returnScaiiPacket);
  return mm;
}
function buildReturnMultiMessageFromScaiiPacket(scPkt) {
  var moduleEndpoint = new proto.scaii.common.ModuleEndpoint;
  moduleEndpoint.setName("viz");
  var srcEndpoint = new proto.scaii.common.Endpoint;
  srcEndpoint.setModule(moduleEndpoint);

  var backendEndpoint = new proto.scaii.common.BackendEndpoint;
  var destEndpoint = new proto.scaii.common.Endpoint;
  destEndpoint.setBackend(backendEndpoint);

  scPkt.setSrc(srcEndpoint);
  scPkt.setDest(destEndpoint);

  var mm = new proto.scaii.common.MultiMessage;
  mm.addPackets(scPkt, 0);
  return mm;
}
function clearUI() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function tryConnect(dots, attemptCount) {
  clearUI();
  ctx.font = "40px Georgia";
  if (dots == '.') {
    dots = '..';
  }
  else if (dots == '..') {
    dots = '...';
  }
  else {
    dots = '.';
  }
  attemptCount = attemptCount + 1
  ctx.fillText("Connecting to SCAII - try " + attemptCount + dots, 10, 50);
  connect(dots, attemptCount);
}
var main = function () {
  tryConnect('.', 0);
}
var connect = function (dots, attemptCount) {
  dealer = new WebSocket('ws://localhost:6112');

  dealer.binaryType = 'arraybuffer';
  dealer.onopen = function (event) {
    console.log("WS Opened.");
  }

  dealer.onmessage = function (message) {
    sessionState = "inProgress";
    var s = message.data;
    var sPacket = proto.scaii.common.ScaiiPacket.deserializeBinary(s);
    if (sPacket.hasVizInit()) {
      var vizInit = sPacket.getVizInit();
      var mm = handleVizInit(vizInit);
      var returnMessage = mm.serializeBinary();
      dealer.send(returnMessage);
    }
    else if (sPacket.hasViz()) {
      var viz = sPacket.getViz();
      handleViz(viz);
      var mm;
      if (testingMode) {
        mm = buildReturnMultiMessageFromState(masterEntities);
      }
      else {
        var userCommand = new proto.scaii.common.UserCommand;
        userCommand.setUserCommandType(proto.scaii.common.UserCommandType.NONE);
        mm = buildMultiMessageWithUserCommand(userCommand);
      }
      var returnMessage = mm.serializeBinary();
      dealer.send(returnMessage);
    }
    else {
      console.log('unexpected message from system!');
    }

  };
  dealer.onclose = function (closeEvent) {
    console.log("closefired " + attemptCount);
    if (sessionState == "pending") {
      // the closed connection was likely due to failed connection. try reconnecting
      setTimeout(function () { tryConnect(dots, attemptCount); }, 1500);
    }
    //alert("Closed!");
  };

  dealer.onerror = function (err) {
    console.log("Error: " + err);
    //alert("Error: " + err);
  };
};

var then = Date.now();
main();