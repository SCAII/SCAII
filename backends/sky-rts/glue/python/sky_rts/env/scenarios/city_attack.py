from scaii.env.sky_rts.env import SkyRtsEnv, MoveList, SkyState
from enum import IntEnum

HP_NORM = 150.0

class CityAction(MoveList):
    def __init__(self, discrete_actions=None, continuous_actions=None, env_actions=None, skip=True):
        super().__init__(discrete_actions=discrete_actions,
                         continuous_actions=continuous_actions, env_actions=env_actions)
        self.skip = skip
        self.quadrant = None

    def attack_quadrant(self, quadrant):
        self.quadrant = quadrant
        if quadrant not in [1, 2, 3, 4]:
            raise InvalidActionError(quadrant)

        self.move_list = []

        super().move_unit(
            self.state.id_list[0], "attack", self.state.id_list[quadrant])

    def as_enum(self):
        if self.quadrant == None:
            return None

        for action in Actions:
            if action == self.quadrant:
                return action

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
        self.raw_hp = state[:, :, 1].copy()

        self.state[:, :, 0] = state[:, :, 1] / HP_NORM

        unit_ids = state[:, :, 2].astype(np.int)
        self.id_types = [1, 2, 3, 4, 5]

        self.state[:, :, 1:6] = np.equal.outer(unit_ids, [0, 1, 2, 3, 4, 5]).astype(np.float)[
            :, :, 1:]

        faction_ids = state[:, :, 3].astype(np.int)
        self.factions = [0, 1, 2]
        self.state[:, :, 6:] = np.equal.outer(
            faction_ids, [0, 1, 2]).astype(np.float)[:, :, 1:]
        
        self.__objectify(self.id_map, self.raw_hp, self.state)
    
    def __objectify(self, id_map, raw_hp, state):
        self.objects = {}
        for r in range(id_map.shape[0]):
            for c in range(id_map.shape[1]):
                u_id = id_map[r,c]
                if u_id == 0:
                    continue

                if u_id in self.objects:
                    self.objects[u_id]._update_bounding_box(r,c)
                    continue
                
                hp = raw_hp[r,c]
                unit_type = None
                if state[r,c,1] == 1:
                    unit_type = UnitType.TANK
                elif state[r,c,2] == 1:
                    unit_type = UnitType.BIG_FORT
                elif state[r,c,3] == 1:
                    unit_type = UnitType.SMALL_FORT
                elif state[r,c,4] == 1:
                    unit_type = UnitType.BIG_CITY
                elif state[r,c,5] == 1:
                    unit_type = UnitType.SMALL_CITY

                assert(unit_type is not None)
                assert(unit_type in UnitType)

                friendly = state[r,c,6] == 1
                
                obj = CityObject(unit_type, friendly, hp)
                obj._update_bounding_box(r,c)
                self.objects[u_id] = obj

class UnitType(IntEnum):
    TANK=1,
    BIG_FORT=2,
    SMALL_FORT=3,
    BIG_CITY=4,
    SMALL_CITY=5,

    def __str__(self):
        if self == UnitType.TANK:
            return "Tank"
        elif self == UnitType.BIG_FORT:
            return "Big Fort"
        elif self == UnitType.SMALL_FORT:
            return "Small Fort"
        elif self == UnitType.BIG_CITY:
            return "Big City"
        elif self == UnitType.SMALL_CITY:
            return "Small City" 

    def __repr__(self):
        return str(self)

class Actions(IntEnum):
    Q1 = 2,
    Q2 = 4,
    Q3 = 3,
    Q4 = 1,

    def __str__(self):
        if self == Actions.Q1:
            return "Q1"
        elif self == Actions.Q2:
            return "Q2"
        elif self == Actions.Q3:
            return "Q3"
        elif self == Actions.Q4:
            return "Q4"
    
    def __repr__(self):
        return str(self)

class CityObject():
    def __init__(self, unit_type, is_friendly, hp):
        self.hp = hp
        self.unit_type = unit_type
        self.is_friendly = is_friendly

    def _update_bounding_box(self, x, y):
        if not hasattr(self, 'min_x'):
            self.min_x = x
            self.max_x = x
            self.min_y = y
            self.max_y = y
            return
        
        self.min_x = min(self.min_x, x)
        self.max_x = max(self.max_x, x)
        self.min_y = min(self.min_y, y)
        self.max_y = max(self.max_y, y)
    
    def get_bounding_box(self):
        return ((self.min_x, self.min_y), (self.max_x, self.max_y))
    
    def change_hp(self, state, new_hp, norm=HP_NORM):
        self.hp = new_hp
        for r in range(self.min_x, self.max_x+1):
            for c in range(self.min_y, self.max_y+1):
                if state[r,c,0] == 0:
                    continue
                
                state[r,c,0] = new_hp / HP_NORM
        
    def change_unit_type(self, state, new_type):
        for r in range(self.min_x, self.max_x+1):
            for c in range(self.min_y, self.max_y+1):
                if state[r,c,self.unit_type] == 0:
                    continue
                
                state[r,c,self.unit_type] = 0
                state[r,c,new_type] = 1
        
        self.unit_type = new_type
    
    def change_faction(self, state, is_friendly):
        if self.is_friendly == is_friendly:
            return
        
        for r in range(self.min_x, self.max_x+1):
            for c in range(self.min_y, self.max_y+1):
                if self.is_friendly and state[r,c,6] == 1:
                    state[r,c,6] = 0
                    state[r,c,7] = 1
                elif not self.is_friendly and state[r,c,7] == 1:
                    state[r,c,6] = 1
                    state[r,c,7] = 0
        
        self.is_friendly = is_friendly
    
    def __str__(self):
        return "CityObject: [ HP = {}, Unit Type = {}, Friendly? = {}, Bounds = {} ]".format(self.hp, str(self.unit_type), self.is_friendly, str(self.get_bounding_box()))
    
    def __repr__(self):
        return str(self)

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
