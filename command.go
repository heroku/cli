package main

import (
	"encoding/json"
	"strings"
)

// Command represents a CLI command.
// For example, in the command `heroku apps:create` the command would be `create`.
// They must have a Topic name that links to a real topic's name.
type Command struct {
	Topic     string             `json:"topic"`
	Command   string             `json:"command"`
	Plugin    string             `json:"plugin"`
	ShortHelp string             `json:"shortHelp"`
	Help      string             `json:"help"`
	Hidden    bool               `json:"hidden"`
	NeedsApp  bool               `json:"needsApp"`
	NeedsAuth bool               `json:"needsAuth"`
	Args      []Arg              `json:"args"`
	Flags     []Flag             `json:"flags"`
	Run       func(ctx *Context) `json:"-"`
}

func (c *Command) String() string {
	return c.Topic + ":" + c.Command
}

// Arg defines an argument for a command.
// These will be parsed in Go and passed to the Run method in the Context struct.
type Arg struct {
	Name     string `json:"name"`
	Optional bool   `json:"optional"`
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
	Name     string `json:"name"`
	Char     rune   `json:"char"`
	HasValue bool   `json:"hasValue"`
}

var commandsTopic = &Topic{
	Name:      "commands",
	ShortHelp: "list all commands",
}

var commandsListCmd = &Command{
	Topic:     "commands",
	ShortHelp: "list all commands",
	Flags:     []Flag{{Name: "json"}},
	Run: func(ctx *Context) {
		cli.LoadPlugins(GetPlugins())
		if ctx.Args["json"] == "True" {
			printCommandJSON(cli.Topics, cli.Commands)
		} else {
			printCommands(cli.Commands)
		}
	},
}

func printCommandJSON(topics TopicSet, commands CommandSet) {
	doc := map[string]interface{}{"topics": topics, "commands": commands}
	s, _ := json.Marshal(doc)
	Println(string(s))
}

func printCommands(commands CommandSet) {
	for _, command := range cli.Commands {
		if command.Command == "" {
			Printf("%s\n", command.Topic)
		} else {
			Printf("%s:%s\n", command.Topic, command.Command)
		}
	}
}

// CommandSet is a slice of Command structs with some helper methods.
type CommandSet []*Command

// ByTopicAndCommand returns a command that matches the passed topic and command.
func (commands CommandSet) ByTopicAndCommand(topic, command string) *Command {
	for _, c := range commands {
		if c.Topic == topic && c.Command == command {
			return c
		}
	}
	return nil
}
