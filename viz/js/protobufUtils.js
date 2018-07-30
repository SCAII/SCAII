
function createMultiMessageFromPacket(scPkt){
  var scPkts = [];
  scPkts.push(scPkt);
  return createMultiMessageFromPackets(scPkts);
}

function createMultiMessageFromPackets(scPkts){
  var mm = new proto.scaii.common.MultiMessage;
  if (scPkts.length > 0){
	var nextPkt = scPkts.shift();
    while (nextPkt != undefined){
      mm.addPackets(nextPkt);
	  nextPkt = scPkts.shift();
	}
  }
  return mm;
}

function setSourceEndpoint(pkt){
  var moduleEndpoint = new proto.scaii.common.ModuleEndpoint;
  moduleEndpoint.setName("viz");
  var srcEndpoint = new proto.scaii.common.Endpoint;
  srcEndpoint.setModule(moduleEndpoint);
  pkt.setSrc(srcEndpoint);
}	

function setDestinationEndpointToReplay(pkt){
  var replayEndpoint = new proto.scaii.common.ReplayEndpoint;
  var destEndpoint = new proto.scaii.common.Endpoint;
  destEndpoint.setReplay(replayEndpoint);
  pkt.setDest(destEndpoint);
}

function setDestinationEndpointToBackend(pkt){
  var backendEndpoint = new proto.scaii.common.BackendEndpoint;
  var destEndpoint = new proto.scaii.common.Endpoint;
  destEndpoint.setBackend(backendEndpoint);
  pkt.setDest(destEndpoint);
}

function buildResponseToReplay(scPkts){
  for (var i = 0; i < scPkts.length; i++) {
	var pkt = scPkts[i];
    setSourceEndpoint(pkt)
    setDestinationEndpointToReplay(pkt);
  }
  var mm = createMultiMessageFromPackets(scPkts);
  return mm;
}

function buildReturnMultiMessageFromState(entities) {
  var entityKeys = Object.keys(entities);
  var returnState = new proto.scaii.common.Viz;
  for (var i in entityKeys) {
    var entityId = entityKeys[i]
    var entity = entities[entityId];
    if (entityId == '8') {
      //console.log('++++++++++++++ENTITY SEND ' + entityId + '++++++++++++++++');
      logEntity(entity);
    }
    returnState.addEntities(entity);
  }
  var pkt = new proto.scaii.common.ScaiiPacket;
  pkt.setViz(returnState);
  // these returned state packets only are sent from a test app that does not
  // use the router, so Endpoints don't really matter, but we'll set them to 
  // make sure the pkt is fully constructed
  setDestinationEndpointToBackend(pkt); 
  setSourceEndpoint(pkt);
  var mm = createMultiMessageFromPacket(pkt);
  return mm;
}


function convertProtobufChartToJSChart(pbch){
    var chart = {};
    chart.title = pbch.getTitle();
    chart.v_title = pbch.getVTitle();
    chart.h_title = pbch.getHTitle();
    var groupsList = pbch.getGroupsList();
    chart.actions = [];
    for (var i in groupsList){
        var groupMessage  = groupsList[i];
        var action = {};
        action.value = groupMessage.getValue();
        action.bars = [];
        action.saliencyId = groupMessage.getSaliencyId();
        action.name = groupMessage.getName();
        chart.actions.push(action);
        var barsList = groupMessage.getBarsList();
        for (var j in barsList){
            var barMessage = barsList[j];
            var bar = {};
            bar.value = barMessage.getValue();
            bar.saliencyId = barMessage.getSaliencyId();
            bar.name = barMessage.getName();
            action.bars.push(bar);
        }
    }
    return chart;
}

  