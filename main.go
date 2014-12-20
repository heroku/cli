package main

import (
	"os"
	"runtime/debug"
)

var Version string = "dev"
var Channel string = "?"

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
