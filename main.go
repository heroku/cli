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

func init() {
	Topics = TopicSet{
		authTopic,
		buildTopic,
		commandsTopic,
		debugTopic,
		helpTopic,
		loginTopic,
		logoutTopic,
		pluginsTopic,
		twoFactorTopic,
		twoFactorTopicAlias,
		updateTopic,
		versionTopic,
		whichTopic,
		whoamiTopic,
	}

	Commands = CommandSet{
		authLoginCmd,
		authLogoutCmd,
		authTokenCmd,
		buildManifestCmd,
		buildPluginsCmd,
		commandsListCmd,
		debugErrlogCmd,
		helpCmd,
		loginCmd,
		logoutCmd,
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
		whoamiAuthCmd,
		whoamiCmd,
	}
}

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

	if os.Args[1] == "update" {
		// skip blocking update if the command is to update
		// otherwise it will update twice
		Update(Channel, "block")
	}

	// try running as a core command
	Commands.Run(os.Args)

	// command wasn't found so try running it as a plugin
	userPlugins.Commands().Run(os.Args)
	corePlugins.Commands().Run(os.Args)

	// no command found
	Help(os.Args)
}

func handlePanic() {
	if rec := recover(); rec != nil {
		err, ok := rec.(error)
		if !ok {
			inspect(err)
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
