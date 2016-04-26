package main

import (
	"errors"
	"fmt"
	"os"
	"runtime"
	"strings"
)

// Version is the version of the v4 cli.
// This is set by a build flag in the `Rakefile`.
var Version = "dev"

// GitSHA is the git sha of the build
// This is set by a build flag in the `Rakefile`.
var GitSHA = ""

// Channel is the git branch the code was compiled on.
// This is set by a build flag in the `Rakefile` based on the git branch.
var Channel = "?"

// Topics are all the command topics
// This list is all the Go topics, the Node topics are filled in later
var Topics TopicSet

// Commands are all the commands
// This list is all the Go commands, the Node commands are filled in later
var Commands CommandSet

func main() {
	loadNewCLI()
	defer handlePanic()

	// handle sigint
	handleSignal(os.Interrupt, func() {
		if !swallowSigint {
			showCursor()
			os.Exit(1)
		}
	})

	runtime.GOMAXPROCS(1) // more procs causes runtime: failed to create new OS thread on Ubuntu
	ShowDebugInfo()

	if len(os.Args) < 2 {
		Help(os.Args)
	}

	switch os.Args[1] {
	case "update":
		Update(Channel, "block")
		Exit(0)
	case HELP, "--help":
		Help(os.Args)
	case "version", "--version", "-v":
		ShowVersion()
	}

	cmd := AllCommands().Find(os.Args[1])
	ctx, err := BuildContext(cmd, os.Args)

	switch {
	case err == errHelp:
		Help(os.Args)
	case err != nil:
		ExitIfError(err)
	default:
		cmd.Run(ctx)
	}
	Exit(0)
}

func handlePanic() {
	if rec := recover(); rec != nil {
		err, ok := rec.(error)
		if !ok {
			Inspect(err)
			err = errors.New(rec.(string))
		}
		ExitIfError(err)
	}
}

// ShowDebugInfo prints debugging information if HEROKU_DEBUG=1
func ShowDebugInfo() {
	if !isDebugging() {
		return
	}
	info := []string{version(), BinPath}
	if len(os.Args) > 1 {
		info = append(info, fmt.Sprintf("cmd: %s", os.Args[1]))
	}
	proxy := getProxy()
	if proxy != nil {
		info = append(info, fmt.Sprintf("proxy: %s", proxy))
	}
	Debugln(strings.Join(info, " "))
}
