"""
Environments and environment-specific wrappers for SCAII.

This module contains basic environment wrappers that may be
used with any backend loaded via SCAII Core, while any installed
submodules include environment-specific wrappers that provide a nicer,
higher-level interface to the environment in question.
"""

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

    def __init__(self, mock_core=None):
        if mock_core is None:
            from scaii._internal_.glue import ScaiiCore as _ScaiiCore
            self.core = _ScaiiCore()
        else:
            self.core = mock_core
        self._msg_buf = None
        self.next_msg = scaii_protos.MultiMessage()

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
        return self.start()

    def act(self, actions=None, continuous_actions=None):
        """
        Send an action to the underlying environment and returns
        the next state as a (reward,typed_reward,terminal,state) tuple.
        """
        if actions is None and continuous_actions is None:
            raise "Must have defined at least one action"

        packet = self.next_msg.add()
        packet.src.agent.SetInParent()
        packet.dest.backend.SetInParent()

        if actions is not None:
            packet.action.discrete_actions[:] = actions

        if continuous_actions is not None:
            packet.actions.continuous_actions[:] = actions

        self._send_recv_msg()
        reward, typed_reward, terminal, state, _ = _decode_handle_msg(
            self._msg_buf)

        return reward, typed_reward, terminal, state

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

        self._decode_handle_msg(self.next_msg.SerializeToString())


class ScaiiError(Exception):
    """
    An exception raised from receiving a Scaii Error packet.

    It contains the packet itself so you may reraise with a more specific
    error message in a wrapper that extends ``ScaiiEnv``.
    """

    def __init__(self, message, packet):
        self.message = message
        self.packet = packet

        Exception.__init__(self)


def _decode_handle_msg(buf):
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
                state.reshape(np.array(msg.state.feature_array_dims))
            secret_state = bytes(msg.state.expanded_state)

            typed_reward = msg.state.typed_reward
            terminal = msg.state.terminal
        else:
            raise "The Python glue only handles state and error messages"

    return reward, typed_reward, terminal, state, secret_state
