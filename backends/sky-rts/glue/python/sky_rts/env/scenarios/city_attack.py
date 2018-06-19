from scaii.env.sky_rts.env import SkyRtsEnv, MoveList, SkyState


class CityAction(MoveList):
    def __init__(self, discrete_actions=None, continuous_actions=None, env_actions=None, skip=True):
        super().__init__(discrete_actions=discrete_actions,
                         continuous_actions=continuous_actions, env_actions=env_actions)
        self.skip = skip

    def attack_quadrant(self, quadrant):
        if quadrant not in [1, 2, 3, 4]:
            raise InvalidActionError(quadrant)

        self.move_list = []

        super().move_unit(
            self.state.id_list[0], "attack", self.state.id_list[quadrant])

    def to_proto(self, packet):
        super().to_proto(packet, self.skip, skip_lua=None)


class CityState(SkyState):
    def __init__(self, typed_reward=None, reward=None, terminal=False, state=None, env_state=None):
        import numpy as np

        super().__init__(typed_reward, reward, terminal, state, env_state)
        state = self.state
        self.state = np.empty(
            (state.shape[0], state.shape[1], 8), dtype=np.float)

        # Normalize HP
        self.state[:, :, 0] = state[:, :, 1] / 70.0
        self.hps = np.unique(state[:, :, 0])

        unit_ids = state[:, :, 2].astype(np.int)
        self.id_types = [1, 2, 3, 4, 5]

        self.state[:, :, 1:6] = np.equal.outer(unit_ids, [0, 1, 2, 3, 4, 5]).astype(np.float)[
            :, :, 1:]

        faction_ids = state[:, :, 3].astype(np.int)
        self.factions = [0, 1, 2]
        self.state[:, :, 6:] = np.equal.outer(
            faction_ids, [0, 1, 2]).astype(np.float)[:, :, 1:]


class CityAttack(SkyRtsEnv):
    def __init__(self, map_name="city_attack"):
        super().__init__(action_type=CityAction, state_type=CityState)

        super().load_scenario(map_name)

    def new_action(self):
        act = super().new_action()
        act.state = self.state

        return act

    def actions(self):
        # Originally was the following.
        # This is closer to how it's
        # represented in game, but the
        # new one is more intuitive
        #
        # 'Bottom Right (Q1)': 1,
        # 'Top Right (Q2)': 2,
        # 'Bottom Left (Q3)': 3,
        # 'Top left (Q4)': 4,
        return {
            'actions': {
                'Q1': 2,
                'Q2': 4,
                'Q3': 3,
                'Q4': 1,
            },
            'desc': "Use action.attack_quadrant(1-4) to select "
            "a quadrant to attack or defend"
        }


class InvalidActionError(Exception):
    def __init__(self, action_taken):
        Exception.__init__(self,
                           "Invalid action, must be in range 1-4 (inclusive). Got {}".format(action_taken))
