package main

import (
	"errors"
	"os"
	"runtime"
	"runtime/debug"

	"github.com/stvp/rollbar"
)

// Version is the version of the v4 cli.
// This is set by a build flag in the `Rakefile`.
// If it is set to `dev` it will not autoupdate.
var Version = "dev"

// Channel is the git branch the code was compiled on.
// This is set by a build flag in the `Rakefile` based on the git branch.
var Channel = "?"

var cli = &Cli{}

// BuiltinPlugins are the core plugins that will be autoinstalled
var BuiltinPlugins = []string{
	"heroku-cli-addons",
	"heroku-apps",
	"heroku-fork",
	"heroku-git",
	"heroku-local",
	"heroku-run",
	"heroku-status",
}

func init() {
	cli.Topics = TopicSet{
		authTopic,
		commandsTopic,
		debugTopic,
		loginTopic,
		pluginsTopic,
		twoFactorTopic,
		twoFactorTopicAlias,
		updateTopic,
		versionTopic,
		whichTopic,
	}
	cli.Commands = CommandSet{
		authLoginCmd,
		commandsListCmd,
		debugErrlogCmd,
		loginCmd,
		pluginsInstallCmd,
		pluginsLinkCmd,
		pluginsListCmd,
		pluginsUninstallCmd,
		twoFactorCmd,
		twoFactorCmdAlias,
		twoFactorDisableCmd,
		twoFactorDisableCmdAlias,
		twoFactorGenerateCmd,
		twoFactorGenerateCmdAlias,
		updateCmd,
		versionCmd,
		whichCmd,
		whoamiCmd,
	}
	rollbar.Platform = "client"
	rollbar.Token = "b40226d5e8a743cf963ca320f7be17bd"
	rollbar.Environment = Channel
	rollbar.ErrorWriter = nil
}

func main() {
	defer handlePanic()
	runtime.GOMAXPROCS(1) // more procs causes runtime: failed to create new OS thread on Ubuntu
	Update(Channel, "block")
	SetupNode()
	SetupBuiltinPlugins()
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
