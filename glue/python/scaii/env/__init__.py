"""
Environments and environment-specific wrappers for SCAII.

This module contains basic environment wrappers that may be
used with any backend loaded via SCAII Core, while any installed
submodules include environment-specific wrappers that provide a nicer,
higher-level interface to the environment in question.
"""

from .state import State
from .actions import Action

import scaii.protos.scaii_pb2 as scaii_protos

# pylint can't tell the metaclass programming the probuf compiler
# uses generates certain members, so we need to disable it.

# pylint: disable=locally-disabled, E1101


class ScaiiEnv():
    """
    The most bare bones SCAII environment.

    This allows you to access the default configuration and state/action
    description of a given environment, but it is recommended to use
    a provided wrapper instead to perform more advanced tasks.
    """

    def __init__(self, mock_core=None, state_type=State, action_type=Action):
        if mock_core is None:
            from scaii._internal_.glue import ScaiiCore as _ScaiiCore
            self.core = _ScaiiCore()
        else:
            self.core = mock_core
        self._msg_buf = None
        self.next_msg = scaii_protos.MultiMessage()
        self.state_type = state_type
        self.action_type = action_type

    def __enter__(self):
        return ScaiiEnv()

    def __exit__(self, typ, value, traceback):
        self.core.destroy()

    def __del__(self):
        self.core.destroy()

    def end(self):
        """
        Ends this session, releasing all resources and destroying
        the underlying environment. This may be important if using
        the recorder in order to ensure the replay file is flushed
        to disk.

        It is recommended to use a ScaiiEnv (or its superclasses)
        with ``with`` instead, so you can't forget to release the
        resources.
        """
        self.core.destroy()

    def _send_recv_msg(self):
        self.core.route_msg(self.next_msg.SerializeToString())
        self.next_msg.Clear()

        self._msg_buf = self.core.next_msg()

    def _reset_packet(self):
        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.backend.SetInParent()
        packet.reset_env = True

    def reset(self):
        """
        Resets the backend to a new environment, returning the initial (state,terminal) tuple.

        You may assume the reward is 0.0
        """
        self._reset_packet()
        self._send_recv_msg()
        self.state = _decode_handle_msg(self._msg_buf, self.state_type)
        return self.state

    def reset_viz(self):
        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.module.name = 'viz'
        packet.viz_init.SetInParent()

    def act(self, action):
        """
        Send an action to the underlying environment and returns
        the next state as a (reward,typed_reward,terminal,state) tuple.
        """
        action.to_proto(self.next_msg.packets.add())

        self._send_recv_msg()
        self.state = _decode_handle_msg(
            self._msg_buf, self.state_type)
        return self.state

    def new_action(self):
        return self.action_type()

    def load_backend(self, plugin_path):
        """
        Loads the given backend as a plugin, this will throw an exception if there
        is an error loading it.
        """
        packet = self.next_msg.packets.add()

        packet.src.agent.SetInParent()
        packet.dest.core.SetInParent()
        packet.config.core_cfg.plugin_type.rust_plugin.plugin_path = plugin_path
        packet.config.core_cfg.plugin_type.rust_plugin.init_as.backend.SetInParent()

        self._send_recv_msg()

    def load_rpc_module(self, name):
        """
        Bootstraps an RPC module in Core with the given name.
        """
        packet = self.next_msg.packets.add()

        packet.src.agent.SetInParent()
        packet.dest.core.SetInParent()
        packet.config.core_cfg.plugin_type.rpc.init_as.module.name = name
        packet.config.core_cfg.plugin_type.rpc.port = 6112
        packet.config.core_cfg.plugin_type.rpc.ip = "127.0.0.1"

    def handle_messages(self):
        return _decode_handle_msg(self._msg_buf, self.state_type)


class ScaiiError(Exception):
    """
    An exception raised from receiving a Scaii Error packet.

    It contains the packet itself so you may reraise with a more specific
    error message in a wrapper that extends ``ScaiiEnv``.
    """

    def __init__(self, message, packet):
        self.message = message
        self.packet = packet

        Exception.__init__(self, self.message)


def _decode_handle_msg(buf, state_type):
    import numpy as np
    msg = scaii_protos.MultiMessage().FromString(bytes(buf))

    reward = None
    typed_reward = None
    state = None
    secret_state = None
    terminal = None

    for msg in msg.packets:
        if msg.WhichOneof('specific_msg') == 'err':
            raise ScaiiError(msg.err.description, msg)
        elif msg.WhichOneof('specific_msg') == 'state':
            reward = msg.state.reward
            state = np.array(msg.state.features)
            # truthy
            if msg.state.feature_array_dims:
                state = state.reshape(np.array(msg.state.feature_array_dims))

            secret_state = bytes(msg.state.expanded_state)

            typed_reward = msg.state.typed_reward
            terminal = msg.state.terminal
        elif msg.WhichOneof('specific_msg') == 'ack':
            pass
            # print("received")
        else:
            pass
            # print(msg)
            # raise "The Python glue only handles state and error messages"

    return state_type(reward=reward, typed_reward=typed_reward, terminal=terminal, state=state, env_state=secret_state)
