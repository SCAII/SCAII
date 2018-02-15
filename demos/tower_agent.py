from scaii.env.sky_rts.env.scenarios.tower_example import TowerExample
import numpy as np

env = TowerExample()

for i in range(0, 2):
    print("episode", i)

    s = env.reset()

    print("acting")
    act = env.new_action()
    act.attack_quadrant(2)

    s = env.act(act)

    while not s.is_terminal():
        raise Exception("Should not get in loop")
        noop = env.new_action()
        s = env.act(noop)

    print("Reward is:", s.reward, "Terminal?:", s.is_terminal())
