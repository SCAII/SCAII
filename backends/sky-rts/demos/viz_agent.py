from scaii.env.sky_rts.env.scenarios.tower_example import TowerExample
import numpy as np

env = TowerExample()
print("Possible reward types:", env.reward_types())
print("Possible actions:", env.actions())
print("Action description", env.action_desc())

for i in range(0, 2):
    print("episode", i)

    s = env.reset(visualize=True)

    print("acting")
    act = env.new_action()
    act.attack_quadrant(2)
    act.skip = False

    s = env.act(act)

    while not s.is_terminal():
        noop = env.new_action()
        noop.skip = False
        s = env.act(noop)

    print("Reward is:", s.reward, "Terminal?:", s.is_terminal())
    print("With types:", s.typed_reward)
