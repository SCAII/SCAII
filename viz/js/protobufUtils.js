
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

function buildReturnMultiMessageFromScaiiPacket(scPkt) {
  var scPkts = [];
  scPkts.push(scPkt);
  buildReturnMultiMessageFromScaiiPackets(scPkts);
}
	
function buildReturnMultiMessageFromScaiiPackets(scPkts) {
  var moduleEndpoint = new proto.scaii.common.ModuleEndpoint;
  moduleEndpoint.setName("viz");
  var srcEndpoint = new proto.scaii.common.Endpoint;
  srcEndpoint.setModule(moduleEndpoint);

  var backendEndpoint = new proto.scaii.common.BackendEndpoint;
  var destEndpoint = new proto.scaii.common.Endpoint;
  destEndpoint.setBackend(backendEndpoint);
  var mm = new proto.scaii.common.MultiMessage;
  var nextPkt = scPkts.shift();
  while (nextPkt != undefined){
	  nextPkt.setSrc(srcEndpoint);
      nextPkt.setDest(destEndpoint);
      //mm.addPackets(nextPkt, 0);
      mm.addPackets(nextPkt);
	  nextPkt = scPkts.shift();
  }
//  for (var scPkt in scPkts){
//	scPkt.setSrc(srcEndpoint);
 //   scPkt.setDest(destEndpoint);
//	//mm.addPackets(scPkt, 0);
//	mm.addPackets(scPkt);
//  }
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
