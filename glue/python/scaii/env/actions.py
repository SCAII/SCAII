"""
Functions and classes for manipulating and sending the actions of a SCAII environment.
"""


class Action():
    """
    An action to take in the environment. In some cases, it may be beneficial to use the
    extension action defined in your environment.
    """

    def __init__(self, discrete_actions=None, continuous_actions=None, env_actions=None):
        self.discrete_actions = discrete_actions
        self.continuous_actions = continuous_actions
        self.env_actions = env_actions

    def to_proto(self, packet):
        packet.src.agent.SetInParent()
        packet.dest.backend.SetInParent()

        if self.discrete_actions is not None:
            packet.action.discrete_actions[:] = self.discrete_actions

        if self.continuous_actions is not None:
            packet.action.continuous_actions[:] = self.continuous_actions

        if self.env_actions is not None:
            packet.action.alternate_actions = self.env_actions
