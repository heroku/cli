package main

var commands = &Topic{
	Name:      "commands",
	ShortHelp: "list all commands",
	Commands:  []*Command{commandsRun},
}

var commandsRun = &Command{
	ShortHelp: "list all commands",
	Run: func(ctx *Context) {
		for _, command := range PluginCommands() {
			Printf("%s:%s\n", command.Topic, command.Name)
		}
	},
}
