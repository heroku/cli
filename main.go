package main

import (
	"errors"
	"os"
	"runtime"
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
		authTopic,
		twoFactorTopic,
		twoFactorTopicAlias,
		//loginTopic,
	}
	cli.Commands = []*Command{
		commandsListCmd,
		versionCmd,
		updateCmd,
		pluginsListCmd,
		pluginsLinkCmd,
		pluginsInstallCmd,
		pluginsUninstallCmd,
		whoamiCmd,
		//loginCmd,
		authLoginCmd,
		twoFactorCmd,
		twoFactorCmdAlias,
		twoFactorDisableCmd,
		twoFactorDisableCmdAlias,
		twoFactorGenerateCmd,
		twoFactorGenerateCmdAlias,
	}
	rollbar.Platform = "client"
	rollbar.Token = "b40226d5e8a743cf963ca320f7be17bd"
	rollbar.Environment = Channel
	rollbar.ErrorWriter = nil
}

func main() {
	defer handlePanic()
	Update(Channel, "block")
	SetupNode()
	err := cli.Run(os.Args)
	TriggerBackgroundUpdate()
	if err == ErrHelp {
		// Command wasn't found so load the plugins and try again
		cli.LoadPlugins(GetPlugins())
		err = cli.Run(os.Args)
	}
	if err == ErrHelp {
		help()
	}
	if err != nil {
		PrintError(err)
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
	var cmd string
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}
	return []*rollbar.Field{
		{"Version", Version},
		{"GOOS", runtime.GOOS},
		{"GOARCH", runtime.GOARCH},
		{"command", cmd},
	}
}
