package main

import (
	"fmt"
	"strings"
)

// Version is the version of the cli.
// This is set by a build flag in the `Rakefile`.
var Version = "dev"

// GitSHA is the git sha of the build
// This is set by a build flag in the `Rakefile`.
var GitSHA = ""

// Channel is the git branch the code was compiled on.
// This is set by a build flag in the `Rakefile` based on the git branch.
var Channel = "?"

// CLITopics are all the command topics
// This list is all the Go topics, the Node topics are filled in later
var CLITopics Topics

// Args is os.Args
var Args []string

// Start the CLI
func Start(args ...string) {
	Args = args
	loadNewCLI()

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
	case "help", "--help", "-h":
		help()
		return
	case "version", "--version", "-v":
		ShowVersion()
		return
	}

	for _, arg := range Args {
		if arg == "--help" || arg == "-h" {
			help()
			return
		}
	}

	cmd := AllCommands().Find(Args[1])
	if cmd == nil {
		helpInvalidCommand()
		return
	}
	if !cmd.DisableAnalytics {
		currentAnalyticsCommand.RecordStart()
	}
	ctx, err := BuildContext(cmd, Args)
	must(err)
	cmd.Run(ctx)
}

var crashing = false

// ShowDebugInfo prints debugging information if HEROKU_DEBUG=1
func ShowDebugInfo() {
	info := []string{version(), BinPath}
	if len(Args) > 1 {
		info = append(info, fmt.Sprintf("cmd: %s", Args[1]))
	}
	Debugln(strings.Join(info, " "))
}
