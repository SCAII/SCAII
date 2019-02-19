from scaii.env.sky_rts.env.scenarios.tower_example import TowerExample
from scaii.env.explanation import Explanation, BarChart, BarGroup, Bar
import numpy as np
import matplotlib.pyplot as plt

labels = ["Health", "Agent Location",
          "Small Towers", "Big Towers", "Friend", "Enemy"]


def invert_actions(env):
    out = dict([])
    for k, v in env.actions()['actions'].items():
        out[v] = k

    return out


env = TowerExample(map_name="multi_step")
print("Possible reward types:", env.reward_types())
print("Possible actions:", env.actions())
print("Action description", env.action_desc())
actions = invert_actions(env)

s = env.reset(record=True)

reward = 0
typed_reward = dict([])
num_steps = 0
while not s.is_terminal():

    side = 3
    f = plt.figure(figsize=[6 * side, side])
    for i in range(6):
        plt.subplot(1, 6, 1 + i)
        plt.title(labels[i])
        plt.imshow(s.state[..., i], cmap='gray')
    plt.show()

    print(num_steps)
    print(reward)
    num_steps += 1

    print("acting")
    act = env.new_action()

    explanation = Explanation(
        "Fake Random Saliency Info", layer_shape=(40, 40))
    chart = BarChart("Move Explanation", "Actions", "QVal By Reward Type")
    layer_names = ["HP", "Type 1", "Type 2", "Type 3", "Friend", "Enemy"]

    max_quad = 0
    max_value = -np.inf
    for quad in range(1, 5):
        layers = np.random.random((40, 40, 6))
        key = "BarGroup{}".format(quad)
        group = BarGroup("Attack {}".format(quad), saliency_key=key)
        explanation.add_layers(layer_names, layers, key=key)

        value = 0.0
        for r_type in env.reward_types():
            b_layers = np.random.random((40, 40, 6))
            key = "BarGroup{}Bar{}".format(quad, r_type)

            bar_val = np.random.rand()
            value += bar_val
            bar = Bar(r_type, bar_val, saliency_key=key)

            group.add_bar(bar)
            explanation.add_layers(layer_names, b_layers, key=key)

        chart.add_bar_group(group)

        if value > max_value:
            max_quad = quad
            max_value = value

    explanation.with_bar_chart(chart)

    act.attack_quadrant(max_quad)
    s = env.act(act, explanation=explanation)

    for k, v in s.typed_reward.items():
        if k not in typed_reward:
            typed_reward[k] = v
        else:
            typed_reward[k] += v

    reward += s.reward

print("Survived {} steps".format(num_steps))
print("Reward is:", reward, "Terminal?:", s.is_terminal())
print("With types:", typed_reward)
