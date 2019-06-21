"""
This is a simple DLL and C func loader that communicates
with the SCAII core at a very low level.
"""
import platform
from ctypes import c_void_p, c_size_t, c_ubyte, POINTER

import numpy as np
from pathlib import Path

__all__ = ["ScaiiCore"]


class UnsupportedPlatformError(Exception):
    """SCAII only supports Windows, Darwin, and Linux.
    This exception is raised when another platform is
    loaded"""
    pass


class CoreMissing(Exception):
    """Make sure the SCAII core DLL is in your
    $PATH. It expects a canonical name for the system.

    scaii_core.dll for Windows
    scaii_core.dylib for OS X
    libscaii_core.so for Linux
    """

    def __init__(self):
        if platform.system().lower() == 'windows':
            self.message = "Can't find scaii_core.dll in your $PATH."
        elif platform.system().lower() == 'darwin':
            self.message = "Can't find scaii_core.dylib in your $LD_LIBRARY_PATH."
        elif platform.system().lower() == 'linux':
            self.message = "Can't find libscaii_core.so in your $LD_LIBRARY_PATH."

        Exception.__init__(self, self.message)


SCAII_CORE = None

try:
    path = Path.home() / ".scaii" / "bin"
    if platform.system().lower() == 'windows':
        from ctypes import windll
        SCAII_CORE = windll.LoadLibrary(path / 'scaii_core')
    elif platform.system().lower() == 'darwin':
        from ctypes import cdll
        SCAII_CORE = cdll.LoadLibrary(path / 'scaii_core.dylib')
    elif platform.system().lower() == 'linux':
        from ctypes import cdll
        SCAII_CORE = cdll.LoadLibrary(path / 'libscaii_core.so')
    else:
        raise UnsupportedPlatformError(
            'We only support Linux, OS X (Darwin), and MSVC Windows\n'
            + '\tIf you think your platform will work, please file an issue '
            + 'on github.com/SCAII/SCAII\n'
            + '\tYou may be able to alter `glue.py` to recognize your platform.')
except OSError as oserr:
    pass # Fallback to PATH

try:
    if platform.system().lower() == 'windows':
        from ctypes import windll
        SCAII_CORE = windll.LoadLibrary('scaii_core')
    elif platform.system().lower() == 'darwin':
        from ctypes import cdll
        SCAII_CORE = cdll.LoadLibrary('scaii_core.dylib')
    elif platform.system().lower() == 'linux':
        from ctypes import cdll
        SCAII_CORE = cdll.LoadLibrary('libscaii_core.so')
    else:
        raise UnsupportedPlatformError(
            'We only support Linux, OS X (Darwin), and MSVC Windows\n'
            + '\tIf you think your platform will work, please file an issue '
            + 'on github.com/SCAII/SCAII\n'
            + '\tYou may be able to alter `glue.py` to recognize your platform.')
except OSError as oserr:
    raise CoreMissing() from oserr


# fn new_environment() -> *mut CContext
SCAII_CORE.new_environment.argtypes = None
SCAII_CORE.new_environment.restype = c_void_p

# fn destroy_environment(*mut CContext)
SCAII_CORE.destroy_environment.argtypes = [c_void_p]
SCAII_CORE.destroy_environment.restypes = None

# fn next_msg_size(*mut CContext) -> libc::c_size_t
SCAII_CORE.next_msg_size.argtypes = [c_void_p]
SCAII_CORE.next_msg_size.restype = c_size_t

# fn next_msg(*mut CContext, buf: *mut libc::c_uchar, buf_len: libc::c_size_t)
SCAII_CORE.next_msg.argtypes = [c_void_p, POINTER(c_ubyte), c_size_t]
SCAII_CORE.next_msg.restype = None

# fn route_msg(*mut CContext, msg_buf: *mut libc::c_uchar, msg_len: libc::c_size_t) -> libc::csize_t
SCAII_CORE.route_msg.argtypes = [c_void_p, POINTER(c_ubyte), c_size_t]
SCAII_CORE.next_msg.restype = c_size_t


class ScaiiCore:
    """
    A class to make loading and destroying
    SCAII simpler
    """

    def __init__(self):
        self.core = SCAII_CORE.new_environment()

    def __enter__(self):
        return ScaiiCore()

    def __exit__(self, _type, _value, _traceback):
        self.destroy()

    def destroy(self):
        """
        Destroys this instance. Unless using ``ScaiiCore`` with ``with``,
        this should always be called to ensure resources are released.
        """
        if self.core != None:
            SCAII_CORE.destroy_environment(self.core)
            self.core = None

    def next_msg(self, buf=None):
        """
        Returns the next message in core. This is an alias
        for calling ``next_msg_size`` followed by ``next_msg``.

        If `buf` is passed in, this will reallocate or resize buf
        as necessary to fill it, otherwise it will allocate
        a new buffer.

        Regardless, the buffer is returned.

        See the ``scaii-core`` documentation for more info.
        """
        from numpy import ctypeslib

        assert self.core != None

        size = SCAII_CORE.next_msg_size(self.core)
        if buf is None:
            buf = np.empty(size, dtype=c_ubyte)
        else:
            buf.resize(size)

        SCAII_CORE.next_msg(self.core, ctypeslib.as_ctypes(buf[:]), size)

        return buf

    def route_msg(self, msg_as_bytes):
        """
        Routes a pre-encoded ``MultiMessage`` through the SCAII core.
        This should generally be immediately followed by a call to ``next_msg``.

        See the ``scaii-core`` documentation for more info.
        """
        from ctypes import cast
        assert self.core != None

        size = len(msg_as_bytes)
        SCAII_CORE.route_msg(self.core, cast(
            msg_as_bytes, POINTER(c_ubyte)), c_size_t(size))
