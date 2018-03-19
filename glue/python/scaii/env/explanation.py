from scaii.protos.viz_pb2 import Layer, ExplanationPoint


class Explanation():
    def __init__(self, title, layer_shape, description=None):
        self._proto = ExplanationPoint()
        self._proto.title = title
        if description is not None:
            self._proto.description = description

        self.layer_shape = layer_shape

    def with_layers(self, names, layers):
        import numpy as np
        assert(len(names) == layers.shape[-1])

        for (name, idx) in zip(names, range(layers.shape[-1])):
            self.with_layer(name, layers[..., idx])

    def with_layer(self, name, layer):
        if layer.shape != self.layer_shape:
            raise ShapeMismatchError(self.layer_shape, layer.shape)

        layer_proto = self._proto.layers.add()
        layer_proto.cells.extend(layer.reshape(-1))
        layer_proto.width = self.layer_shape[0]
        layer_proto.height = self.layer_shape[1]
        layer_proto.name = name

        return self

    def to_proto(self, packet):
        packet.recorder_step.action.explanation.CopyFrom(self._proto)


class ShapeMismatchError(Exception):
    def __init__(self, expected, got):
        super().__init__("Expected layer with shape {} got {}".format(expected, got))
