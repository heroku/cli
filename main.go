package main

import (
	"os"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"time"

	"github.com/bgentry/go-netrc/netrc"
)

var Version string = "dev"
var Channel string = "?"

var cli = &Cli{}

func init() {
	cli.Topics = map[string]*Topic{
		"commands": commands,
		"version":  version,
		"plugins":  plugins,
	}
}

func main() {
	defer handlePanic()
	updateIfNeeded()
	node.Registry = "http://54.173.158.18"
	if !node.IsSetup() {
		Err("setting up plugins... ")
		must(node.Setup())
		Errln("done")
	}
	for _, command := range PluginCommands() {
		cli.AddCommand(command)
	}
	ctx, err := cli.Parse(os.Args[1:])
	if err != nil {
		if err == HelpErr {
			help()
		}
		Errln(err)
		Errf("USAGE: %s %s\n", os.Args[0], commandSignature(ctx.Topic, ctx.Command))
		os.Exit(2)
	}
	if ctx.Command.NeedsApp {
		if ctx.App == "" {
			ctx.App = app()
		}
		if app := os.Getenv("HEROKU_APP"); app != "" {
			ctx.App = app
		}
		if ctx.App == "" {
			AppNeededWarning()
		}
	}
	if ctx.Command.NeedsAuth {
		ctx.Auth.Username, ctx.Auth.Password = auth()
	}
	Logf("Running %s\n", ctx)
	before := time.Now()
	ctx.Command.Run(ctx)
	Logf("Finished in %s\n", (time.Since(before)))
}

func handlePanic() {
	if e := recover(); e != nil {
		Errln("ERROR:", e)
		Logln(string(debug.Stack()))
		Exit(1)
	}
}

func app() string {
	app, err := appFromGitRemote(remoteFromGitConfig())
	if err != nil {
		panic(err)
	}
	return app
}

func auth() (user, password string) {
	netrc, err := netrc.ParseFile(netrcPath())
	if err != nil {
		panic(err)
	}
	auth := netrc.FindMachine("api.heroku.com")
	return auth.Login, auth.Password
}

func netrcPath() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(HomeDir, "_netrc")
	}
	return filepath.Join(HomeDir, ".netrc")
}
