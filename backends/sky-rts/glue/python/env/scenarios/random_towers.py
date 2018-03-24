from scaii.env.sky_rts.env import SkyRtsEnv, MoveList


class RandomTowerAction(MoveList):
    def __init__(self, discrete_actions=None, continuous_actions=None, env_actions=None, skip=True):
        super().__init__(discrete_actions=discrete_actions,
                         continuous_actions=continuous_actions, env_actions=env_actions)
        self.skip = skip

    def attack_tower(self, which):
        if which not in [1, 2]:
            raise InvalidActionError(which)

        self.move_list = []

        super().move_unit(
            self.state.id_list[0], "attack", self.state.id_list[which])

    def to_proto(self, packet):
        super().to_proto(packet, self.skip, skip_lua=None)


class RandomTowers(SkyRtsEnv):
    def __init__(self):
        super().__init__(action_type=RandomTowerAction)

        super().load_scenario("random_towers")

    def new_action(self):
        act = super().new_action()
        act.state = self.state

        return act

    def actions(self):
        return {
            'actions': {
                'left': 1,
                'right': 2,
            },
            'desc': "Use action.attack_tower(1-2) to select \
                which of the two towers to attack"
        }


class InvalidActionError(Exception):
    def __init__(self, action_taken):
        Exception.__init__(self,
                           "Invalid action, must be in range 1-2 (inclusive). Got {}".format(action_taken))
