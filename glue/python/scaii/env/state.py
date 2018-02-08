"""
Functions and classes for manipulating and reading the state of a SCAII environment.
"""


class State():
    """
    The current state of the environment. This can be used directly, but it is likely
    much easier to use the State wrapper provided by your environment, which extends
    this class.
    """

    def __init__(self, typed_reward=None, reward=None, terminal=False, state=None, env_state=None):
        self.typed_reward = typed_reward
        self.reward = reward
        self.terminal = terminal
        self.state = state

    def is_terminal(self):
        return self.terminal
