class ReplayFixHelper():
    
    def __init__(self, state_type):
        import websocket
        import ssl

        self._state_type = state_type
        self._websocket = websocket.WebSocket(sslopt={"cert_reqs": ssl.CERT_NONE})
        self._websocket.connect("ws://localhost:6112")

    
    def next(self):
        import scaii.protos.scaii_pb2 as scaii_protos
        import numpy as np
        from scaii.protos.scaii_pb2 import ScaiiPacket
        
        msg = self._websocket.recv()
        msg = ScaiiPacket.FromString(msg)

        if msg.WhichOneof('specific_msg') != 'state':
            raise Expection("Expected a state")
        
        reward = msg.state.reward
        state = np.array(msg.state.features)
        # truthy
        if msg.state.feature_array_dims:
            state = state.reshape(
                np.array(msg.state.feature_array_dims))

        secret_state = bytes(msg.state.expanded_state)

        typed_reward = msg.state.typed_reward
        terminal = msg.state.terminal\

        return self._state_type(reward=reward,
                        typed_reward=typed_reward,
                        terminal=terminal,
                        state=state,
                        env_state=secret_state
                        )

    def revise_action(self, action, explanation):
        import scaii.protos.scaii_pb2 as scaii_protos
        from scaii.protos.scaii_pb2 import ScaiiPacket

        
        action_packet = ScaiiPacket()
        action.to_proto(action_packet)
        explanation.to_proto(action_packet, is_recorder=False)
        action_packet.src.agent.SetInParent()
        action_packet.dest.backend.SetInParent()

        self._websocket.send_binary(bytes(action_packet.SerializeToString()))

