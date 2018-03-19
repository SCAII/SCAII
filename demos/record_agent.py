from scaii.env.sky_rts.env.scenarios.tower_example import TowerExample
from scaii.env.explanation import Explanation
import numpy as np

env = TowerExample()
print("Possible reward types:", env.reward_types())
print("Possible actions:", env.actions())
print("Action description", env.action_desc())

s = env.reset(record=True)

print("acting")
act = env.new_action()
act.attack_quadrant(2)

explanation = Explanation("Fake Random Saliency Info", (40,40))
layers = np.random.random((40,40,6))
layer_names = ["HP", "Type 1", "Type 2", "Type 3", "Friend", "Enemy"]

explanation.with_layers(layer_names, layers)
print(len(explanation._proto.layers))

s = env.act(act, explanation=explanation)

if not s.is_terminal():
    raise Exception("Should not get in loop")

print("Reward is:", s.reward, "Terminal?:", s.is_terminal())
print("With types:", s.typed_reward)
