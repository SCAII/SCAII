
function createMultiMessageFromPacket(scPkt){
  var scPkts = [];
  scPkts.push(scPkt);
  return createMultiMessageFromPackets(scPkts);
}

function createMultiMessageFromPackets(scPkts){
  var mm = new proto.scaii.common.MultiMessage;
  var nextPkt = scPkts.shift();
  while (nextPkt != undefined){
      mm.addPackets(nextPkt);
	  nextPkt = scPkts.shift();
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
  destEndpoint.setBackend(replayEndpoint);
  pkt.setDest(destEndpoint);
}

function setDestinationEndpointToBackend(pkt){
  var backendEndpoint = new proto.scaii.common.BackendEndpoint;
  var destEndpoint = new proto.scaii.common.Endpoint;
  destEndpoint.setBackend(backendEndpoint);
  pkt.setDest(destEndpoint);
}

function buildResponseToBackend(scPkts){
	for (var pkt in scPkts){
		setSourceEndpoint(pkt)
		setDestinationEndpointToBackend(pkt);
	}
	var mm = createMultiMessageFromPackets(scPkts);
	return mm;
}

function buildResponseToReplay(scPkts){
	for (var pkt in scPkts){
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
      console.log('++++++++++++++ENTITY SEND ' + entityId + '++++++++++++++++');
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
