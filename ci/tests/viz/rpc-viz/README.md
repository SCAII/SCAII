# Visualization Test Suite
=======================

This test suite can be executed with `cargo run`.

## Torture test process
--------------------

This program opens a websocket server on a given port and IP (see [Configuration](#Configuration)).

> Note: below when a "message" is referred to, it means the specific message type the `ScaiiPacket` **resolves to**, not the message itself. This test engine follows the general SCAII core protocol of sending `ScaiiPacket`s to the visualization module and receiving `MultiMessage`s. In the case of this test program, it enforces that only one message is received (that is, the `packets` fields of the sent `MultiMessage` should be exactly of length 1).

After receiving a client connection, the server will send a single `VizInit` message from the SCAII Protobuf definitions. This should **not** yield a response from the Viz server.

After this, the test suite will send a random number (between 10 and 20) of `Viz` messages, the first of which can be assumed to be a "keyframe" (that is, no necessary fields are unset). 

After each packet, the visualization server should apply its updates and send a `Viz` packet in response. This `Viz` packet should be encapsulate the entire rendering state (that is, it should be a "keyframe" based on your internal state). This will be checked against the internal state and if it does not match (within floating point tolerance), the connection will be closed and the test suite will exit in failure.

> Note: since this is meant to test compatibility with the `core` module, it will **not** ignore the `src` and `dest` fields of a `ScaiiPacket`. Make sure you properly set the `dest` field to a "Backend" endpoint, and the `src` field to a "Module" with the name "viz".

In general, non-compliance with the protocols set out (malformed or incorrect messages, desynced data, etc) will yield a termination (panic) of the test suite and a closure of the websocket with a suitable error message.

Passing all random updates successfully will close the socket with a successful code and return from the test suite normally.

## Why the responses?

A normal visualization program would not respond with the entire internal rendering state each time, but this is the best way to make sure the visualization server is doing what it's supposed to do.

In the future, a configuration option may be added to turn the response monitoring off, but for now it's useful in making sure the visualization suite is acting properly.

## Configuration
-------------

This program takes an optional configuration .toml file. Missing fields are allowed and result in the default configuration being loaded.

The path to the .toml file should be the first argument to the program. If no path is provided, the default configuration will be used.

The following is the default configuration (except for the [rand] section, which is, naturally, random by default):


    # The ip address to connect to, supports both Ipv6 and Ipv4
    ip="127.0.0.1"

    # The port the websocket is connected through
    port=6221

    # May optionally specify a random seed in terms of 4
    # 32 bit integers. The default configuration is a random
    # seed based on the system clock
    #
    # This seed is printed out at the beginning of each run,
    # so you may copy that and put it here
    # to reproduce an earlier run verbatim.
    [rand]
    seed = [1,2,3,4]

