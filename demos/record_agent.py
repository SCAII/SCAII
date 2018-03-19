from scaii.env.sky_rts.env.scenarios.tower_example import TowerExample
import numpy as np

env = TowerExample()
print("Possible reward types:", env.reward_types())
print("Possible actions:", env.actions())
print("Action description", env.action_desc())

s = env.reset(record=True)

print("acting")
act = env.new_action()
act.attack_quadrant(2)

s = env.act(act)

if not s.is_terminal():
    raise Exception("Should not get in loop")

print("Reward is:", s.reward, "Terminal?:", s.is_terminal())
print("With types:", s.typed_reward)
