class ScaiiError(Exception):
    """
    An exception raised from receiving a Scaii Error packet.

    It contains the packet itself so you may reraise with a more specific
    error message in a wrapper that extends ``ScaiiEnv``.
    """

    def __init__(self, message, packet):
        self.message = message
        self.packet = packet

        Exception.__init__(self, self.message)


class MultipleStatesError(ScaiiError):
    def __init__(self, packet):
        ScaiiError.__init__(self, "Multiple states in one response", packet)


class MultipleSerRespError(ScaiiError):
    def __init__(self, packet):
        ScaiiError.__init__(
            self, "Multiple serialization responses in one response", packet)


class UnrecognizedPacketError(ScaiiError):
    def __init__(self, packet):
        ScaiiError.__init__(
            self, "Unrecognized response from core: {}".format(packet), packet)


class NoStateError(Exception):
    def __init__(self):
        Exception.__init__(self, "No state in response when state is required")


class NoKeyframeError(Exception):
    def __init__(self):
        Exception.__init__(self, "We need a keyframe but did not receive one")


class TooManyMessagesError(Exception):
    def __init__(self, expected, got, packets):
        self.expected = expected
        self.got = got
        self.packets = packets
        Exception.__init__(
            self, "Too many messages, excepted {} got {}\n\t\
            (messages received: {})".format(expected, got, packets))


class UninitializedEnvError(Exception):
    def __init__(self):
        Exception.__init__(
            self, "Environment either has not been initialized \
            or refused to return a description of itself.\n\n\t\
            Please make sure you're configuring your environment \
            or, if you're a developer, verify your environment or wrapper \
            is properly initializing")


class UnsupportedBehaviorError(Exception):
    def __init__(self, op, reason):
        Exception.__init__(
            self, "The operation {} can not be performed because the \
            specified backend does not support it.\n\nReason:\n\t".format(op, reason))
