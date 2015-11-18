// based on https://code.google.com/p/gopass
// Author: johnsiilver@gmail.com (John Doak)
//
// Original code is based on code by RogerV in the golang-nuts thread:
// https://groups.google.com/group/golang-nuts/browse_thread/thread/40cc41e9d9fc9247

// +build darwin freebsd linux netbsd openbsd

package speakeasy

import (
	"fmt"
	"os"
	"os/signal"
	"os/exec"
	"strings"
	"syscall"
)

var (
	sttyArgvEOff = []string{"stty", "-echo"}
	sttyArgvEOn  = []string{"stty", "echo"}
	ws           syscall.WaitStatus
)

func getSttyArg0() (string, error) {
	sttyArg0, err := exec.LookPath("stty")
	if err != nil {
		return "", fmt.Errorf("failed finding stty executable for password entry:\n\t%s", err)
	}
	return sttyArg0, nil
}

// getPassword gets input hidden from the terminal from a user. This is
// accomplished by turning off terminal echo, reading input from the user and
// finally turning on terminal echo.
func getPassword() (password string, err error) {
	sig := make(chan os.Signal, 10)

	// File descriptors for stdin, stdout, and stderr.
	fd := []uintptr{os.Stdin.Fd(), os.Stdout.Fd(), os.Stderr.Fd()}

	// Setup notifications of termination signals to channel sig, create a process to
	// watch for these signals so we can turn back on echo if need be.
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGKILL, syscall.SIGQUIT,
		syscall.SIGTERM)
	go func() {
		<-sig
		echoOn(fd)
		os.Exit(-1)
	}()

	// Turn off the terminal echo.
	pid, err := echoOff(fd)
	if err != nil {
		return "", err
	}

	// Turn on the terminal echo and stop listening for signals.
	defer echoOn(fd)
	defer signal.Stop(sig)

	syscall.Wait4(pid, &ws, 0, nil)

	line, err := readline()
	if err == nil {
		password = strings.TrimSpace(line)
	} else {
		err = fmt.Errorf("failed during password entry: %s", err)
	}

	return password, err
}

// echoOff turns off the terminal echo.
func echoOff(fd []uintptr) (int, error) {
	sttyArg0, sttyErr := getSttyArg0()
	if sttyErr != nil {
		return 0, sttyErr
	}

	pid, err := syscall.ForkExec(sttyArg0, sttyArgvEOff, &syscall.ProcAttr{Dir: "", Files: fd})
	if err != nil {
		return 0, fmt.Errorf("failed turning off console echo for password entry:\n\t%s", err)
	}
	return pid, nil
}

// echoOn turns back on the terminal echo.
func echoOn(fd []uintptr) {
	sttyArg0, sttyErr := getSttyArg0()
	if sttyErr != nil {
		return;
	}

	// Turn on the terminal echo.
	pid, e := syscall.ForkExec(sttyArg0, sttyArgvEOn, &syscall.ProcAttr{Dir: "", Files: fd})
	if e == nil {
		syscall.Wait4(pid, &ws, 0, nil)
	}
}
