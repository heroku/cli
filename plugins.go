package main

import (
	"github.com/dickeyxxx/gode"
)

var node = gode.NewClient(AppDir)

func setupNode() {
	node.Registry = "http://54.173.158.18"
	if !node.IsSetup() {
		Err("setting up plugins... ")
		must(node.Setup())
		Errln("done")
	}
}

func (cli *Cli) loadPluginCommands() {
	cli.Commands = append(cli.Commands, PluginCommands()...)
}

var pluginsTopic = &Topic{
	Name:      "plugins",
	ShortHelp: "manage plugins",
	Help: `Manage the Heroku CLI Plugins

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-check`,
}

var pluginsInstallCmd = &Command{
	Topic:     "plugins",
	Command:   "install",
	Args:      []Arg{{Name: "name"}},
	ShortHelp: "Installs a plugin into the CLI",
	Help: `Install a Heroku plugin

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-status`,

	Run: func(ctx *Context) {
		name := ctx.Args["name"]
		Errf("Installing plugin %s... ", name)
		must(node.InstallPackage(name))
		Errln("done")
	},
}

var pluginsListCmd = &Command{
	Topic:     "plugins",
	ShortHelp: "Lists the installed plugins",
	Help: `Lists installed plugins

  Example:
  $ heroku plugins`,

	Run: func(ctx *Context) {
		packages, err := node.Packages()
		must(err)
		for _, pkg := range packages {
			Println(pkg.Name, pkg.Version)
		}
	},
}
