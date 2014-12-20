package main

import (
	"os"
	"runtime/debug"
)

// The built version.
// This is set by a build flag in the `Rakefile`.
// If it is set to `dev` it will not autoupdate.
var Version = "dev"

// The channel the CLI was built on.
// This is set by a build flag in the `Rakefile` based on the git branch.
var Channel = "?"

var cli = &Cli{}

func init() {
	cli.Topics = []*Topic{
		commandsTopic,
		versionTopic,
		pluginsTopic,
		updateTopic,
	}
	cli.Commands = []*Command{
		commandsListCmd,
		versionCmd,
		pluginsListCmd,
		pluginsInstallCmd,
	}
}

func main() {
	defer handlePanic()
	updateIfNeeded()
	setupNode()
	cli.loadPluginCommands()
	cli.Run(os.Args)
}

func handlePanic() {
	if e := recover(); e != nil {
		Errln("ERROR:", e)
		Logln(string(debug.Stack()))
		Exit(1)
	}
}
