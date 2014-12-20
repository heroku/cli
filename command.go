package main

import "strings"

// Command represents a CLI command.
// For example, in the command `heroku apps:create` the command would be `create`.
// They must have a Topic name that links to a real topic's name.
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

// Arg defines an argument for a command.
// These will be parsed in Go and passed to the Run method in the Context struct.
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

// Flag defines a flag for a command.
// These will be parsed in Go and passed to the Run method in the Context struct.
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
		for _, plugin := range GetPlugins() {
			for _, command := range plugin.Commands {
				Printf("%s:%s\n", command.Topic, command.Command)
			}
		}
	},
}

// CommandSet is a slice of Command structs with some helper methods.
type CommandSet []*Command

func (commands CommandSet) ByTopicAndCommand(topic, command string) *Command {
	for _, c := range commands {
		if c.Topic == topic && c.Command == command {
			return c
		}
	}
	return nil
}
