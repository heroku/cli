package main

import (
	"os"
	"os/exec"
	"runtime"
	"syscall"
)

// Version is the current version
var Version = "dev"

// Channel is the current channel
var Channel = "beta"

// GitSHA is the current git sha
var GitSHA = ""

func main() {
	defer handlePanic()
	runtime.GOMAXPROCS(1) // more procs causes runtime: failed to create new OS thread on Ubuntu

	if Channel == "dev" || Channel == "" {
		Channel = "beta"
	}

	Install(Channel)

	// handle sigint
	handleSignal(os.Interrupt, func() {})

	cmd := exec.Command(binPath(), os.Args[1:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	os.Exit(getExitCode(err))
}

func getExitCode(err error) int {
	switch e := err.(type) {
	case nil:
		return 0
	case *exec.ExitError:
		status, ok := e.Sys().(syscall.WaitStatus)
		if !ok {
			must(err)
		}
		return status.ExitStatus()
	}
	must(err)
	return -1
}
