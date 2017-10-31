
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
