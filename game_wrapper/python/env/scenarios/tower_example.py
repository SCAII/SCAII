from scaii.env.sky_rts.env import SkyRtsEnv, MoveList


class TowerAction(MoveList):
    def __init__(self, discrete_actions=None, continuous_actions=None, env_actions=None):
        super().__init__(discrete_actions=discrete_actions,
                         continuous_actions=continuous_actions, env_actions=env_actions)

    def attack_quadrant(self, quadrant):
        if quadrant not in [1, 2, 3, 4]:
            raise InvalidActionError(quadrant)

        super().move_unit(
            self.state.id_list[0], "attack", self.state.id_list[quadrant])

    def actions(self):
        return [1, 2, 3, 4]

    def to_proto(self, packet, skip=True):
        super().to_proto(packet, skip, skip_lua=None)


class TowerExample(SkyRtsEnv):
    def __init__(self):
        super().__init__(action_type=TowerAction)

        super().load_scenario("tower_example")

    def new_action(self):
        act = super().new_action()
        act.state = self.state

        return act


class InvalidActionError(Exception):
    def __init__(self, action_taken):
        Exception.__init__(
            "Invalid action, must be in range 1-4 (inclusive). Got {}".format(action_taken))
