package main

import "strings"

type Command struct {
	Topic     string
	Command   string
	ShortHelp string
	Help      string
	Hidden    bool
	NeedsApp  bool
	NeedsAuth bool
	Args      []Arg
	Flags     []Flag
	Run       func(ctx *Context) `json:"-"`
}

func (c *Command) String() string {
	return c.Topic + ":" + c.Command
}

type Arg struct {
	Name     string
	Optional bool
}

func (a *Arg) String() string {
	if a.Optional {
		return "[" + strings.ToUpper(a.Name) + "]"
	}
	return strings.ToUpper(a.Name)
}

type Flag struct {
	Name    string
	Char    rune
	Default string
}

var commandsTopic = &Topic{
	Name:      "commands",
	ShortHelp: "list all commands",
}

var commandsListCmd = &Command{
	Topic:     "commands",
	ShortHelp: "list all commands",
	Run: func(ctx *Context) {
		for _, command := range PluginCommands() {
			Printf("%s:%s\n", command.Topic, command.Command)
		}
	},
}
