var entityHPToolTipIds = [];
var selectedToolTipIds = {};
var entityAllDataToolTipIds = [];
var hoveredAllDataToolTipIds = {};


function createToolTips(shapeInfo) {
    createHPToolTip(shapeInfo);
    createAllDataToolTip(shapeInfo);
}

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
  

    unfoldMapIntoTooltip(si.entity.stringmetadataMap, valuesDiv, false);
    unfoldMapIntoTooltip(si.entity.boolstringmetadataMap, valuesDiv, false);
    unfoldMapIntoTooltip(si.entity.floatstringmetadataMap, valuesDiv, true);
    unfoldMapIntoTooltip(si.entity.intmetadataMap, valuesDiv, false);
    unfoldMapIntoTooltip(si.entity.boolmetadataMap, valuesDiv,false);
    unfoldMapIntoTooltip(si.entity.floatmetadataMap, valuesDiv, true);
    

    // var hpLabel = document.createElement("div");
    // var hitPoints = getNumericValueFromFloatStringMap(si.entity,"Hitpoints");
    // hpLabel.innerHTML = 'HP   : ' + hitPoints;
    // valuesDiv.append(hpLabel);
    
    // var mhpLabel = document.createElement("div");
    // var maxHitPoints = getNumericValueFromFloatStringMap(si.entity,"Max Hp");
    // mhpLabel.innerHTML = 'Max HP: ' + maxHitPoints;
    // valuesDiv.append(mhpLabel);
    
    // var enemyLabel = document.createElement("div");
    // var isEnemy = getIsEnemy(si.entity);
    // enemyLabel.innerHTML = 'Enemy: ' + isEnemy;
    // valuesDiv.append(enemyLabel);
  
    // var friendLabel = document.createElement("div");
    // var isFriend = getIsFriend(si.entity);
    // friendLabel.innerHTML = 'Friend: ' + isFriend;
    // valuesDiv.append(friendLabel);
    
    // var unitTypeLabel = document.createElement("div");
    // var type = getUnitType(si.entity);
    // unitTypeLabel.innerHTML = 'Unit Type: ' + type;
    // valuesDiv.append(unitTypeLabel);
}

function unfoldMapIntoTooltip(map, div, limitToTwoDecimals) {
    var entryList = map.getEntryList();
    for (var i in entryList ){
        var entry = entryList[i];
        var key = entry[0];
        var val = entry[1];
        var label = document.createElement("div");
        if (limitToTwoDecimals) {
            label.innerHTML = key + ':' + (Number(val)).toFixed(2);
        }
        else {
            label.innerHTML = key + ':' + val;
        }
        
        div.append(label);
    }
}