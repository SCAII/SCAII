"""
Extensions to the standard Environment for the
RTS
"""

from scaii.env import ScaiiEnv

from .action import MoveList
from .state import SkyState

# pylint: disable=locally-disabled, E1101


class SkyRtsEnv(ScaiiEnv):

    def __init__(self, mock_core=None, state_type=SkyState, action_type=MoveList):
        super().__init__(mock_core=mock_core, state_type=state_type, action_type=action_type)

        packet = self.next_msg.packets.add()
        packet.dest.core.SetInParent()
        packet.src.agent.SetInParent()
        packet.config.core_cfg.plugin_type.sky_rts.SetInParent()

        self.cfg_msg.CopyFrom(packet)
        self._send_recv_msg()

    def load_scenario(self, path):
        from ..protos.sky_rts_pb2 import Config
        from scaii.protos.scaii_pb2 import ScaiiPacket

        cfg = Config()
        cfg.scenario.path = path

        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.backend.SetInParent()

        packet.config.backend_cfg.cfg_msg = cfg.SerializeToString()
        packet.config.backend_cfg.is_replay_mode = False

        self.backend_cfg = ScaiiPacket()
        self.backend_cfg.CopyFrom(packet)
