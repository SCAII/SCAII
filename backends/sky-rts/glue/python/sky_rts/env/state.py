from scaii.env.state import State

# pylint: disable=locally-disabled, E1101


class SkyState(State):
    def __init__(self, typed_reward=None, reward=None, terminal=False, state=None, env_state=None):
        import numpy as np

        super().__init__(typed_reward, reward, terminal, state, env_state)

        id_map = state[:, :, 0].astype(np.int)
        id_list = np.unique(id_map).astype(np.int)[1:]

        self.id_list = id_list

        self.id_map = id_map

        self.state = state

        self.old_state = state
