"""
SCAII is a language-agnostic learning environment including a
basic plugin engine, visualization, and explanation tools.

These modules provide high-level Python interfaces over the SCAII protobuf
protocol and libraries to create an easy-to-use class-based game environments.

If an environment is available, it is possible to use just the core `env` module,
but it is recommended to install specific game wrapper as they provide
higher level interfaces to the environments.

The only hard dependencies are `protobuf` and `numpy`.

To use this library, simply put it in your ``$PYTHONPATH``, as well as putting
``libscaii_core.so``, `scaii_core.dylib``, or ``scaii_core.dll`` (in Linux, OS X, and
Windows, respectively) somewhere in your ``$PATH`` or ``$LD_LIBRARY_PATH`` as appropriate.
"""

__version__ = "0.1.0"