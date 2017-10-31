
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
