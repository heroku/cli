package golock

import (
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"syscall"
	"time"
)

// ErrTimeout means there was a timeout waiting
// for the lockfile to be available
var ErrTimeout = errors.New("Timed out")

// ErrBusy means a different process has locked the file
// not used for LockWithTimeout
var ErrBusy = errors.New("Locked by other process")

// ErrReadingLockfile means it could not read the pid out of
// an existing lockfile
var ErrReadingLockfile = errors.New("Error reading lockfile")

// ErrNotOwner means there was an attempt to unlock a lockfile
// that was not owned by the current process
var ErrNotOwner = errors.New("Process does not own lockfile")

// Lock will attempt to grab a lock file at path
// it will wait until it becomes available
func Lock(path string) error {
	pid := os.Getpid()
	for {
		err := tryLock(path, pid)
		switch err {
		case ErrBusy:
			time.Sleep(10 * time.Millisecond)
			continue
		default:
			return err
		}
	}
}

// Unlock will release the lock on a file
func Unlock(path string) error {
	return os.Remove(path)
}

// IsLocked returns true if the lock file is currently
// locked by an active process
func IsLocked(path string) (bool, error) {
	pid, err := readLockfile(path)
	if err != nil {
		return false, err
	}
	if pid != 0 {
		return isPidActive(pid), nil
	}
	return false, nil
}

func tryLock(path string, mypid int) error {
	locked, err := IsLocked(path)
	if err != nil {
		return err
	}
	if locked {
		return ErrBusy
	}
	err = writeLockfile(path, mypid)
	if err != nil {
		return err
	}
	return nil
}

func readLockfile(path string) (pid int, err error) {
	d, err := ioutil.ReadFile(path)
	if os.IsNotExist(err) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	if _, err := fmt.Sscanln(string(d), &pid); err != nil {
		return 0, ErrReadingLockfile
	}
	return pid, nil
}

func writeLockfile(path string, pid int) error {
	os.MkdirAll(filepath.Dir(path), 0755)
	data := []byte(strconv.Itoa(pid))
	return ioutil.WriteFile(path, data, 0666)
}

func isPidActive(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	if runtime.GOOS != "windows" {
		return process.Signal(syscall.Signal(0)) == nil
	}

	processState, err := process.Wait()
	if err != nil {
		return false
	}
	if processState.Exited() {
		return false
	}

	return true
}
