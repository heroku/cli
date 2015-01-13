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
	Usage       string             `json:"usage"`
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

func commandUsage(c *Command) string {
	text := c.String() + argsString(c.Args) + flagsString(c.Flags)
	if c.NeedsApp {
		text = text + " --app APP"
	}
	return text
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

func (commands CommandSet) loadUsages() {
	for _, c := range commands {
		if c.Usage == "" {
			c.Usage = commandUsage(c)
		}
	}
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
		if ctx.Args["json"] != "True" {
			// TODO: remove this and make json default
			for _, command := range cli.Commands {
				if command.Command == "" {
					Printf("%s\n", command.Topic)
				} else {
					Printf("%s:%s\n", command.Topic, command.Command)
				}
			}
			return
		}
		cli.LoadPlugins(GetPlugins())
		cli.Commands.loadUsages()
		doc := map[string]interface{}{"topics": cli.Topics, "commands": cli.Commands}
		s, _ := json.Marshal(doc)
		Println(string(s))
	},
}
