"""
Environments and environment-specific wrappers for SCAII.

This module contains basic environment wrappers that may be
used with any backend loaded via SCAII Core, while any installed
submodules include environment-specific wrappers that provide a nicer,
higher-level interface to the environment in question.
"""

from scaii.env.state import State
from scaii.env.actions import Action

import scaii.protos.scaii_pb2 as scaii_protos

from scaii.env.error import *

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

        from scaii.protos.scaii_pb2 import ScaiiPacket

        self._msg_buf = None
        self.next_msg = scaii_protos.MultiMessage()
        self.state_type = state_type
        self.action_type = action_type
        self.viz_initialized = False
        self.recording = False
        self.cfg_msg = ScaiiPacket()
        self.backend_cfg = None
        self.frames_since_keyframe = 0
        self.keyframe_interval = None

        self.initialized = False
        self._reward_types = None
        self._actions = None
        self._action_desc = "No description"
        self._can_record = False

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

    def _check_init(self):
        if not self.initialized:
            self._send_recv_msg()
            assert(len(self._decode_handle_msg()) == 0)
            if not self.initialized:
                raise UninitializedEnvError()

    def actions(self):
        """
        Returns a map of action name (string)->action number (int)
        for this environment's discrete actions (if any).

        Throws an exception if the environment isn't initialized.

        May be overridden by extenders definine their own action
        set.
        """
        self._check_init()

        return self._actions

    def action_desc(self):
        """
        Returns a short description about how to use
        an environment's action space
        """
        self._check_init()

        return self._action_desc

    def reward_types(self):
        """
        Yields a `set` of the possible reward types
        """
        self._check_init()

        return self._reward_types

    def can_record(self):
        """
        Determines if the loaded backend can record games
        """
        self._check_init()

        return self._can_record

    def reset(self, visualize=False, record=False, keyframe_interval=5, overwrite_replay=False,
              replay_file_path=None):
        """
        Resets the backend to a new episode, returning your environment's
        initial state object.

        Parameters:
        ===========
        visualize: bool
            Sets whether or not to set the backend to emit visualization packets
            to a registered viz module, also initialized the viz module for you
            if it isn't already. [default: False]

        record: bool
            Whether to record the current game and place it in a replay file.
            [default: False]

        keyframe_interval: int
            How frequently the backend should serialize its entire state for
            the replay.

            Set to 1 if you want every frame to be a keyframe. 

            Ignored if `record` is `False`. [default: 5]

        overwrite_replay: bool
            Whether to overwrite replay files in the given location. If `False`,
            the recorder will automatically "one-up" the file name (i.e. foo.replay,
            foo.replay_1, foo.replay_2). 

            If `True`, this will silently overwrite the file instead of one-upping.

            Ignored if `record` is `False`. [default: False]

        replay_file_path: string
            Sets the path to put replay files in. This may be an absolute path, or relative
            to the execution directory (i.e. "./results/file.replay"). Make sure to set
            the path to the desired replay file name, not a directory. If no path is given,
            this defaults to `$HOME/.scaii/replays/replay.scr`.

            Ignored if `record` is `False`. [default: None]
        """
        self._check_init()

        # pylint: disable=locally-disabled, E1601
        if visualize and not self.viz_initialized:
            print("Initializing the visualization module, please press \
            \"connect\" on the SCAII visualization (viz) page now")
            self.load_rpc_module("viz")
            self.viz_initialized = True
            

        self.frames_since_keyframe = 0

        # need the reset packet first because backends probably want to clear things like
        # viz flags on reset
        self._reset_packet()

        if visualize:
            self._visualize_episode()

        if record:
            self._record_episode(keyframe_interval=keyframe_interval,
                                 overwrite=overwrite_replay,
                                 file_path=replay_file_path
                                 )
        else:
            self.recording = False

        self._send_recv_msg()
        

        self.state = self._decode_handle_msg()["state"]
        if visualize:
            self.set_replay_config(100000)
            self._send_recv_msg()

        if record:
            self._game_complete(self.state.terminal)

        return self.state

    def _game_complete(self, terminal):
        if not terminal:
            return

        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.recorder.SetInParent()
        packet.game_complete.SetInParent()

        self._send_recv_msg()
        resp = self._decode_handle_msg()
        if len(resp) > 0:
            raise TooManyMessagesError(0, len(resp), resp)

    def _record_episode(self, keyframe_interval=5, overwrite=False, file_path=None):
        """
        Records the current episode.
        """
        if not self.can_record():
            raise UnsupportedBehaviorError("record",
                                           "Backend does not support nondiverging serialization")

        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.recorder.SetInParent()

        packet.recorder_config.pkts.add().CopyFrom(self.cfg_msg)
        if self.backend_cfg is not None:
            packet.recorder_config.pkts.add().CopyFrom(self.backend_cfg)

        packet.recorder_config.overwrite = overwrite
        if file_path is not None:
            packet.recorder_config.file_path = file_path

        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.backend.SetInParent()

        packet.record.keyframe_interval = keyframe_interval

        self.recording = True
        self.keyframe_interval = keyframe_interval

    def _visualize_episode(self):
        packet = self.next_msg.packets.add()
        packet.src.agent.SetInParent()
        packet.dest.backend.SetInParent()
        packet.emit_viz = True

        return packet

    def act(self, action, explanation=None):
        """
        Send an action to the underlying environment and returns
        your environment's resulting state object.

        Also will record actions if the environment is set to
        do so.

        Parameters:
        ===========
        actions: Action
            The action to take, as returned by env.new_action().
        """
        from scaii.protos.scaii_pb2 import ScaiiPacket

        action_packet = ScaiiPacket()
        action.to_proto(action_packet)
        # Need to record before sending to backend
        # due to skipping
        if self.recording:
            is_keyframe = self._check_keyframe()
            self._send_recv_msg()
            resp = self._decode_handle_msg()
            # dict.get will return None if the key is not
            # available
            self._record_step(action_packet, resp.get(
                "ser_resp"), is_keyframe, explanation=explanation)

        self.next_msg.packets.add().CopyFrom(action_packet)

        self._send_recv_msg()
        resp = self._decode_handle_msg()

        if "state" not in resp:
            raise NoStateError()
        self.state = resp["state"]
        if self.recording:
            self._game_complete(self.state.terminal)

        return self.state

    def _record_step(self, action_packet, ser_resp, is_keyframe, explanation=None):
        """
        One step of the recording, automatically handles keyframes
        """
        if ser_resp is None and is_keyframe:
            raise NoKeyframeError()
        elif ser_resp is not None:
            key_packet = self.next_msg.packets.add()
            key_packet.CopyFrom(ser_resp)
            key_packet.dest.recorder.SetInParent()

        recorder_action = self.next_msg.packets.add()
        recorder_action.recorder_step.action.CopyFrom(action_packet.action)
        recorder_action.recorder_step.is_decision_point = True
        if explanation is not None:
            explanation.to_proto(recorder_action)
        recorder_action.src.agent.SetInParent()
        recorder_action.dest.recorder.SetInParent()

        self._send_recv_msg()
        resp = self._decode_handle_msg()
        if len(resp) > 0:
            raise TooManyMessagesError(0, len(resp), resp)

    def _check_keyframe(self):
        """
        Determines if the current action step should be a keyframe.
        """
        from scaii.protos.scaii_pb2 import SerializationFormat

        is_keyframe = False

        if self.frames_since_keyframe == 0:
            ser_req = self.next_msg.packets.add()
            ser_req.src.agent.SetInParent()
            ser_req.dest.backend.SetInParent()

            ser_req.ser_req.format = SerializationFormat.Value("NONDIVERGING")
            is_keyframe = True

        self.frames_since_keyframe = (
            self.frames_since_keyframe + 1) % self.keyframe_interval

        return is_keyframe

    def new_action(self):
        """
        Returns a new instance of your environment's Action.
        """
        return self.action_type()

    def load_rpc_module(self, name):
        """
        Bootstraps an RPC module in Core with the given name.

        Paramters:
        ==========
        name: string
            The name that will be given to this module internally
        """
        packet = self.next_msg.packets.add()

        packet.src.agent.SetInParent()
        packet.dest.core.SetInParent()
        packet.config.core_cfg.plugin_type.rpc.init_as.module.name = name
        packet.config.core_cfg.plugin_type.rpc.port = 6112
        packet.config.core_cfg.plugin_type.rpc.ip = "127.0.0.1"

    def set_replay_config(self, step_count):
        """
        Tells viz to turn off interactivity and sets step count high as we don't know how many steps will be in game.

        Paramters:
        ==========
        name: step_count
            High enough number to keep the default step-forward logic from tripping up
        """
        packet = self.next_msg.packets.add()

        packet.src.agent.SetInParent()
        packet.dest.module.name = "viz"
        packet.replay_session_config.step_count = step_count
        packet.replay_session_config.suppress_interactivity = True

    def handle_messages(self):
        """
        Checks the environment for waiting messages and processes this,
        this should almost never be called except for debugging purposes.
        """
        return self._decode_handle_msg()

    def _decode_handle_msg(self):
        """
        Decodes incoming messages and parses them into a usable format.

        Throws an exception if the messages are ill-formatted or unexpected.
        """
        import numpy as np
        msg = scaii_protos.MultiMessage().FromString(bytes(self._msg_buf))

        out = dict([])

        for msg in msg.packets:
            if msg.WhichOneof('specific_msg') == 'err':
                raise ScaiiError(msg.err.description, msg)
            elif msg.WhichOneof('specific_msg') == 'state':
                if "state" in out:
                    raise MultipleStatesError(msg)
                reward = msg.state.reward
                state = np.array(msg.state.features)
                # truthy
                if msg.state.feature_array_dims:
                    state = state.reshape(
                        np.array(msg.state.feature_array_dims))

                secret_state = bytes(msg.state.expanded_state)

                typed_reward = msg.state.typed_reward
                terminal = msg.state.terminal

                out["state"] = self.state_type(reward=reward,
                                               typed_reward=typed_reward,
                                               terminal=terminal,
                                               state=state,
                                               env_state=secret_state
                                               )
            elif msg.WhichOneof('specific_msg') == 'ack':
                pass
            elif msg.WhichOneof('specific_msg') == 'ser_resp':
                if "ser_resp" in out:
                    raise MultipleSerRespError(msg)
                out["ser_resp"] = msg
            elif msg.WhichOneof('specific_msg') == 'env_desc':
                from scaii.protos.cfg_pb2 import BackendSupported
                self.initialized = True
                self._reward_types = set(msg.env_desc.reward_types.keys())
                self._actions = msg.env_desc.possible_discrete_actions

                if msg.env_desc.action_desc:
                    self._action_desc = msg.env_desc.action_desc
                else:
                    self._action_desc = "No description"

                support = msg.env_desc.supported.serialization_support
                full_ser = BackendSupported.SerializationSupport.Value('FULL')
                nondiv_ser = BackendSupported.SerializationSupport.Value(
                    'NONDIVERGING_ONLY')
                self._can_record = (
                    support == full_ser or support == nondiv_ser)
            else:
                raise UnrecognizedPacketError(msg)

        return out
