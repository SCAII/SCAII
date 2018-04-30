from scaii.env.sky_rts.env import SkyRtsEnv, MoveList


class TowerAction(MoveList):
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


class TowerExample(SkyRtsEnv):
    def __init__(self, map_name="tower_example"):
        super().__init__(action_type=TowerAction)

        super().load_scenario(map_name)

    def new_action(self):
        act = super().new_action()
        act.state = self.state

        return act

    def actions(self):
        return {
            'actions': {
                'bottom_right': 1,
                'top_right': 2,
                'bottom_left': 3,
                'top_left': 4,
            },
            'desc': "Use action.attack_quadrant(1-4) to select "
            "a quadrant to attack"
        }


class InvalidActionError(Exception):
    def __init__(self, action_taken):
        Exception.__init__(self,
                           "Invalid action, must be in range 1-4 (inclusive). Got {}".format(action_taken))
