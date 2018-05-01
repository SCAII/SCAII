extern crate bincode;
extern crate prost;
extern crate scaii_core;
extern crate scaii_defs;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate url;

use protos::{MultiMessage, ScaiiPacket};
use scaii_core::{Environment, ReplayAction};
use scaii_defs::protos;
use scaii_defs::{Agent, Module, Replay};
use std::error::Error;
use std::rc::Rc;
use std::cell::RefCell;
use std::fmt;
use std::sync::{Arc, Mutex};
use std::env;
use std::collections::BTreeMap;

mod test_util;
use test_util::*;
mod webserver;
use webserver::launch_webserver;
mod replay_util;
mod replay_manager;
mod pkt_util;
mod replay_sequencer;
use replay_sequencer::ReplaySequencer;
mod explanations;
use explanations::Explanations;

#[cfg(test)]
mod test;

const USAGE: &'static str = "
replay.

Usage:
  replay webserver
  replay file
  replay test [--data-hardcoded | --data-from-recorded-file]
  replay (-h | --help)

Options:
  --filename=<path-to-replay-file>  path to the replay file to run.
  --data_hardcoded              data generated within local replay tester code.
  --data_from_recorded_file     data generated by recorder test output file.
  -h --help                     Show this screen.
";

#[derive(Debug)]
struct ReplayError {
    details: String,
}

impl ReplayError {
    fn new(msg: &str) -> ReplayError {
        ReplayError {
            details: msg.to_string(),
        }
    }
}

impl fmt::Display for ReplayError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.details)
    }
}

impl Error for ReplayError {
    fn description(&self) -> &str {
        &self.details
    }
}

// need to register dummy agent to keep RTS happy during replay
struct DummyAgentMessageQueue {
    incoming_messages: Vec<protos::ScaiiPacket>,
}

impl Module for DummyAgentMessageQueue {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.incoming_messages.push(msg.clone());
        Ok(())
    }

    /// return empty messages
    fn get_messages(&mut self) -> MultiMessage {
        let pkts: Vec<ScaiiPacket> = Vec::new();
        MultiMessage { packets: pkts }
    }
}

impl Agent for DummyAgentMessageQueue {}

/// Replay owns the environment, but we need this
/// inside the environment (router) to collect messages
pub struct ReplayMessageQueue {
    incoming_messages: Vec<protos::ScaiiPacket>,
}

impl Module for ReplayMessageQueue {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.incoming_messages.push(msg.clone());
        Ok(())
    }

    /// return empty messages
    fn get_messages(&mut self) -> MultiMessage {
        let pkts: Vec<ScaiiPacket> = Vec::new();
        MultiMessage { packets: pkts }
    }
}

impl Replay for ReplayMessageQueue {}


#[allow(dead_code)]
enum RunMode {
    Live,
    Test,
}

fn main() {
    let result = try_main();
    match result {
        Ok(_) => {}
        Err(err) => {
            println!("ERROR: {:?}", err);
        }
    }
}
fn try_main() -> Result<(), Box<Error>> {
    let arguments: Vec<String> = env::args().collect();
    let args: replay_util::Args = replay_util::parse_args(arguments);
    // let args: Args = Docopt::new(USAGE)
    //     .and_then(|d| d.deserialize())
    //     .unwrap_or_else(|e| e.exit());
    if args.cmd_webserver {
        launch_webserver();
        return Ok(());
    } else if args.cmd_test {
        println!("Running Replay in test mode...");
        println!("...loading hardcoded replay data...");
        run_replay(RunMode::Test)?;
        return Ok(());
    } else if args.cmd_file {
        println!("Running Replay in live mode...");
        run_replay(RunMode::Live,)?;
        return Ok(());
    } else {
        panic!("Unrecognized command mode for replay: {:?}", args);
    }
}

#[allow(unused_assignments)]
fn run_replay(run_mode: RunMode)  -> Result<(), Box<Error>>{
    let mut mode_is_test = true;
    let mut environment: Environment = Environment::new();

    match run_mode {
        RunMode::Test => {
            configure_and_register_mock_rts(&mut environment);
        }
        RunMode::Live => {
            mode_is_test = false;
        }
    }
    let dummy_agent = DummyAgentMessageQueue {
        incoming_messages: Vec::new(),
    };
    let rc_dummy_agent = Rc::new(RefCell::new(dummy_agent));

    let replay_message_queue = ReplayMessageQueue {
        incoming_messages: Vec::new(),
    };
    let rc_replay_message_queue = Rc::new(RefCell::new(replay_message_queue));
    {
        environment
            .router_mut()
            .register_agent(Box::new(Rc::clone(&rc_dummy_agent)));
        debug_assert!(environment.router().agent().is_some());
    }
    {
        environment
            .router_mut()
            .register_replay(Box::new(Rc::clone(&rc_replay_message_queue)));
        debug_assert!(environment.router().replay().is_some());
    }
    let dummy_replay_actions : Vec<ReplayAction> = Vec::new();
    let dummy_replay_sequencer = ReplaySequencer::new(&dummy_replay_actions, true)?;
    let mut replay_manager = replay_manager::ReplayManager {
        incoming_message_queue: rc_replay_message_queue,
        step_delay: Arc::new(Mutex::new(201)),
        poll_delay: Arc::new(Mutex::new(50)),
        shutdown_received: false,
        env: environment,
        // pass in dummy rather than have option to simplify downstream code
        replay_sequencer: dummy_replay_sequencer,
        explanations_option: None,
        test_mode: mode_is_test,
        poll_timer_count: 5,
        //step_timer_count: 25,
        step_timer_count: 10,
    };
    let result = replay_manager.start();
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
    
}

fn configure_and_register_mock_rts(env: &mut Environment) {
    let rts = MockRts {
        viz_sequence: Vec::new(),
        outbound_messages: Vec::new(),
        step_position: 0,
        step_count: 0,
        sent_viz_init: false,
    };

    {
        env.router_mut().register_backend(Box::new(rts));
    }
}
