include!(concat!(env!("OUT_DIR"), "/scaii.common.rs"));

/// Merges a bunch of `MultiMessage`s into a new one.
///
/// The result will preserve the order of the input multimessages.
///
/// If `msgs` is empty, `None` is returned. If it's of length 1,
/// that `MultiMessage` will be returned without modification.
pub fn merge_multi_messages(mut msgs: Vec<MultiMessage>) -> Option<MultiMessage> {
    if msgs.len() == 0 {
        return None;
    } else if msgs.len() == 1 {
        return msgs.pop();
    }

    // Scope so split_first_mut borrow ends
    {
        let (first, tail) = msgs.split_first_mut().unwrap();

        for msg in tail {
            for packet in msg.packets.drain(..) {
                first.packets.push(packet);
            }
        }
    }

    Some(msgs.swap_remove(0))
}
