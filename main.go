package main

import (
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

// Args is os.Args
var Args = os.Args

func main() {
	Start(os.Args...)
	Exit(0)
}

// Start the CLI
func Start() {
	loadNewCLI()
	if os.Getenv("TESTING") != ONE {
		defer handlePanic()
	}

	// handle sigint
	handleSignal(os.Interrupt, func() {
		if !swallowSigint {
			showCursor()
			os.Exit(1)
		}
	})

	runtime.GOMAXPROCS(1) // more procs causes runtime: failed to create new OS thread on Ubuntu
	ShowDebugInfo()

	if len(Args) <= 1 {
		// show dashboard if no args passed
		Args = append(Args, "dashboard")
	}

	switch Args[1] {
	case "_":
		guess := loadLastCommandGuess()
		if guess != nil {
			Args = append([]string{Args[0], guess.Guess}, guess.Args...)
		}
	case "help", "--help":
		help(Args)
		return
	case "version", "--version", "-v":
		ShowVersion()
		return
	}

	cmd := AllCommands().Find(Args[1])
	if cmd != nil && cmd.DisableAnalytics {
		currentAnalyticsCommand = nil
	} else {
		currentAnalyticsCommand.RecordStart()
	}
	ctx, err := BuildContext(cmd, Args)
	if err == errHelp {
		help(Args)
		return
	}
	must(err)
	cmd.Run(ctx)
	Exit(0)
}

var crashing = false

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
