from scaii.protos.viz_pb2 import Saliency, ExplanationPoint


class Bar():
    def __init__(self, bar_name, value, saliency_key=None):
        from scaii.protos.viz_pb2 import Bar as BarProto
        self._proto = BarProto()
        self._proto.name = bar_name
        self._proto.value = value
        if saliency_key is not None:
            self._proto.saliency_id = saliency_key

    def set_value(self, value):
        self._proto.value = value

    def set_name(self, name):
        self._proto.name = name

    def set_saliency(self, saliency_key):
        self._proto.saliency_id = saliency_key

    def saliency_id(self):
        return self._proto.saliency_id

    def to_proto(self):
        return self._proto


class BarGroup():
    def __init__(self, group_name, value=None, bars=[], saliency_key=None):
        from scaii.protos.viz_pb2 import BarGroup as BGProto

        self._proto = BGProto()
        self.add_bars(bars)
        self._proto.name = group_name
        if saliency_key is not None:
            self._proto.saliency_id = saliency_key
        if value is not None:
            self._proto.value = value

    def add_bar(self, bar):
        self._proto.bars.add().CopyFrom(bar.to_proto())

    def add_bars(self, bars):
        for bar in bars:
            self.add_bar(bar)

    def set_value(self, value):
        self._proto.value = value

    def saliency_id(self):
        return self._proto.saliency_id

    def to_proto(self):
        return self._proto


class BarChart():
    def __init__(self, title, v_axis_title, h_axis_title, bar_groups=[]):
        from scaii.protos.viz_pb2 import BarChart as BCProto

        self._proto = BCProto()
        self._proto.title = title
        self._proto.v_title = v_axis_title
        self._proto.h_title = h_axis_title

        self.add_bar_groups(bar_groups)

    def add_bar_group(self, bar_group):
        self._proto.groups.add().CopyFrom(bar_group.to_proto())

    def add_bar_groups(self, bar_groups):
        for bg in bar_groups:
            self.add_bar_group(bg)

    def to_proto(self):
        return self._proto


class Explanation():
    def __init__(self, title, layer_shape=None, chart_name=None, description=None):
        self._proto = ExplanationPoint()
        self._proto.title = title
        if description is not None:
            self._proto.description = description

        self.layer_shape = layer_shape

    def add_layers(self, names, layers, key=""):
        assert(len(names) == layers.shape[-1])

        for (name, idx) in zip(names, range(layers.shape[-1])):
            self.add_layer(name, layers[..., idx], key=key)

    def add_layer(self, name, layer, key=""):
        if layer.shape != self.layer_shape:
            raise ShapeMismatchError(self.layer_shape, layer.shape)

        layer_proto = self._proto.saliency.saliency_map[key].layers.add()
        layer_proto.cells.extend(layer.reshape(-1))
        layer_proto.width = self.layer_shape[0]
        layer_proto.height = self.layer_shape[1]
        layer_proto.name = name

        return self

    def with_bar_chart(self, chart):
        self._proto.bar_chart.CopyFrom(chart.to_proto())

    def to_proto(self, packet, verify=True):
        if verify:
            self.verify()

        packet.recorder_step.action.explanation.CopyFrom(self._proto)

    def verify(self):
        if not self._proto.bar_chart:
            if len(self._proto.saliency.saliency_map) > 1:
                raise TooManySaliencyError(
                    len(self._proto.saliency.saliency_map))
            return

        referenced = dict([])
        for key in self._proto.saliency.saliency_map:
            referenced[key] = []

        for bg in self._proto.bar_chart.groups:
            if bg.saliency_id:
                if bg.saliency_id in referenced:
                    referenced[bg.saliency_id].append(
                        "Bar Group: {}".format(bg.name))
                else:
                    raise NoSuchSaliencyError(
                        bg.saliency_id, bg.name, "Bar Group")
            for bar in bg.bars:
                if bar.saliency_id:
                    if bar.saliency_id in referenced:
                        referenced[bar.saliency_id].append(
                            "Bar {} in BarGroup {}".format(bar.name, bg.name))
                    else:
                        raise NoSuchSaliencyError(
                            bar.saliency_id, bar.name, "Bar in BarGroup {}".format(bg.name))

        failed = False
        for _, references in referenced.items():
            if len(references) != 1:
                failed = True
                break

        if failed:
            raise MalformedExplanationError(referenced)


class ShapeMismatchError(Exception):
    def __init__(self, expected, got):
        super().__init__("Expected layer with shape {} got {}".format(expected, got))


class NoSuchSaliencyError(Exception):
    def __init__(self, id, name, descriptor):
        super().__init__(
            "Saliency by name {} referenced by {} {} does not exist", id, descriptor, name)


class MalformedExplanationError(Exception):
    def __init__(self, map):
        super().__init__(
            "All passed saliency maps must be referenced by exactly one Bar or BarGroup\n"
            "Note: the following map shows a list of references to each saliency set: {}".format(
                map)
        )


class TooManySaliencyError(Exception):
    def __init__(self, number):
        super().__init__(
            "Too many saliency groups exist, only one may exist if there is no bar chart. Got {}".format(
                number)
        )
