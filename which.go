package main

import "os"

var whichTopic = &Topic{
	Name:   "which",
	Hidden: true,
}

var whichCmd = &Command{
	Topic:  "which",
	Hidden: true,
	Args:   []Arg{{Name: "command"}},
	Run: func(ctx *Context) {
		cli.LoadPlugins(GetPlugins())
		command := ctx.Args.(map[string]string)["command"]
		_, cmd := cli.ParseCmd(command)
		if cmd == nil {
			Println("No command found. Could be a ruby command. https://github.com/heroku/heroku")
			os.Exit(1)
		}
		if cmd.Plugin == "" {
			Println("Command in v4 core. https://github.com/heroku/heroku-cli")
		} else {
			Println("Command in npm package: " + cmd.Plugin + ". https://www.npmjs.com/package/" + cmd.Plugin)
		}
	},
}
