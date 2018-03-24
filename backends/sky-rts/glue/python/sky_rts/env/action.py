from scaii.env.actions import Action


# pylint: disable=locally-disabled, E1101

class MoveList(Action):
    def __init__(self, discrete_actions=None, continuous_actions=None, env_actions=None):
        super().__init__(discrete_actions=discrete_actions,
                         continuous_actions=continuous_actions, env_actions=env_actions)
        self.move_list = list([])

    def move_unit(self, unit_id, action, target):
        self.move_list.append((unit_id, action, target))

    def to_proto(self, packet, skip=False, skip_lua=None):
        from ..protos.sky_rts_pb2 import ActionList

        actions = ActionList()

        actions.skip = skip
        if not skip_lua is None:
            actions.skip_lua = skip_lua

        for move in self.move_list:
            action = actions.actions.add()
            action.unit_id = move[0] - 1

            if move[1] == "move":
                action.move_to.pos = move[2]
            elif move[1] == "attack":
                action.attack_unit.target_id = move[2] - 1
            else:
                raise "Unknown action {}".format(move[1])

        self.env_actions = actions.SerializeToString()
        super().to_proto(packet)
