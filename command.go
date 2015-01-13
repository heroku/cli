package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
)

// Command represents a CLI command.
// For example, in the command `heroku apps:create` the command would be `create`.
// They must have a Topic name that links to a real topic's name.
type Command struct {
	Topic       string             `json:"topic"`
	Command     string             `json:"command"`
	Plugin      string             `json:"plugin"`
	Description string             `json:"description"`
	Help        string             `json:"help"`
	Hidden      bool               `json:"hidden"`
	NeedsApp    bool               `json:"needsApp"`
	NeedsAuth   bool               `json:"needsAuth"`
	Args        []Arg              `json:"args"`
	Flags       []Flag             `json:"flags"`
	Run         func(ctx *Context) `json:"-"`
}

func (c *Command) String() string {
	if c.Command == "" {
		return c.Topic
	}
	return c.Topic + ":" + c.Command
}

// Usage prints out the example help text for the command
func (c *Command) Usage() string {
	text := c.String() + argsString(c.Args) + flagsString(c.Flags)
	if c.NeedsApp {
		text = text + " --app APP"
	}
	return text
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

func argsString(args []Arg) string {
	var buffer bytes.Buffer
	for _, arg := range args {
		if arg.Optional {
			buffer.WriteString(" [" + strings.ToUpper(arg.Name) + "]")
		} else {
			buffer.WriteString(" " + strings.ToUpper(arg.Name))
		}
	}
	return buffer.String()
}

// Flag defines a flag for a command.
// These will be parsed in Go and passed to the Run method in the Context struct.
type Flag struct {
	Name     string `json:"name"`
	Char     rune   `json:"char"`
	HasValue bool   `json:"hasValue"`
}

func flagsString(flags []Flag) string {
	var buffer bytes.Buffer
	for _, flag := range flags {
		var s string
		if flag.Char != 0 {
			s = fmt.Sprintf(" [-%s (--%s)]", string(flag.Char), flag.Name)
		} else {
			s = fmt.Sprintf(" [--%s]", flag.Name)
		}
		buffer.WriteString(s)
	}
	return buffer.String()
}

var commandsTopic = &Topic{
	Name:        "commands",
	Description: "list all commands",
	Hidden:      true,
}

var commandsListCmd = &Command{
	Topic:       "commands",
	Description: "list all commands",
	Flags:       []Flag{{Name: "json"}},
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
