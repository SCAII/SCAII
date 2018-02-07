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
        import os
        import platform

        super().__init__(mock_core=mock_core, state_type=state_type, action_type=action_type)

        if platform.system().lower() == 'windows':
            super().load_backend(
                os.environ['HOME'] + "/.scaii/backends/bin/sky-rts.dll")
        elif platform.system().lower() == 'darwin':
            super().load_backend(
                os.environ['HOME'] + "/.scaii/backends/bin/sky-rts.dylib")
        elif platform.system().lower() == 'linux':
            super().load_backend(
                os.environ['HOME'] + "/.scaii/backends/bin/libsky-rts.so")

    def load_scenario(self, path):
        from ..protos.sky_rts_pb2 import Config

        cfg = Config()
        cfg.scenario.path = path

        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.backend.SetInParent()

        packet.config.backend_cfg.is_replay_mode = False
        packet.config.backend_cfg.cfg_msg = cfg.SerializeToString()
