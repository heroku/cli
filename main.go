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
	}
	rollbar.Platform = "client"
	rollbar.Token = "b40226d5e8a743cf963ca320f7be17bd"
	rollbar.Environment = Channel
}

func main() {
	defer handlePanic()
	UpdateIfNeeded()
	SetupNode()
	cli.LoadPlugins(GetPlugins())
	cli.Run(os.Args)
}

func handlePanic() {
	if rec := recover(); rec != nil {
		err, ok := rec.(error)
		if !ok {
			err = errors.New(rec.(string))
		}
		debug.PrintStack()
		Errln("ERROR:", err)
		if Channel != "?" {
			rollbar.Error(rollbar.ERR, err, &rollbar.Field{"version", Version})
			rollbar.Wait()
		}
		Exit(1)
	}
}
