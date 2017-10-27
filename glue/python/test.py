import os

os.environ["RUST_BACKTRACE"] = "1"

from scaii.env._env import ScaiiEnv

env = ScaiiEnv()
env.load_backend("../../../sky-rts/backend/target/debug/backend.dll")
env.start()

from scaii.protos.scaii_pb2 import MultiMessage

print(MultiMessage.FromString(bytes(env._msg_buf)))

env.core.destroy()

env.next_msg = MultiMessage()
packet = env.next_msg.packets.add()
packet.dest.backend.SetInParent()
packet.src.agent.SetInParent()

env.start()

print(MultiMessage.FromString(bytes(env._msg_buf)))
