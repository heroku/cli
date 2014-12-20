package main

import (
	"github.com/dickeyxxx/gode"
)

var node = gode.NewClient(AppDir)

var plugins = &Topic{
	Name:      "plugins",
	ShortHelp: "manage plugins",
	Help: `Manage the Heroku CLI Plugins

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-check`,

	Commands: []*Command{
		cmdList,
		cmdInstall,
	},
}
