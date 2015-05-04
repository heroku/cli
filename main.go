package main

import (
	"errors"
	"os"
	"runtime/debug"

	"github.com/stvp/rollbar"
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
		updateCmd,
		pluginsListCmd,
		pluginsInstallCmd,
		pluginsUninstallCmd,
	}
	rollbar.Platform = "client"
	rollbar.Token = "b40226d5e8a743cf963ca320f7be17bd"
	rollbar.Environment = Channel
}

func main() {
	defer handlePanic()
	if IsUpdateNeeded() {
		Update()
		reexecBin()
	}
	SetupNode()
	err := cli.Run(os.Args)
	if err == ErrHelp {
		// Command wasn't found so load the plugins and try again
		cli.LoadPlugins(GetPlugins())
		err = cli.Run(os.Args)
	}
	if err == ErrHelp {
		help()
	}
	if err != nil {
		Errln(err)
		os.Exit(2)
	}
}

func handlePanic() {
	if rec := recover(); rec != nil {
		err, ok := rec.(error)
		if !ok {
			err = errors.New(rec.(string))
		}
		Errln("ERROR:", err)
		if Channel == "?" {
			debug.PrintStack()
		} else {
			rollbar.Error(rollbar.ERR, err, rollbarFields()...)
			rollbar.Wait()
		}
		Exit(1)
	}
}

func rollbarFields() []*rollbar.Field {
	return []*rollbar.Field{
		{"Version", Version},
	}
}
