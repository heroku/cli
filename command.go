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
	Topic            string             `json:"topic"`
	Command          string             `json:"command,omitempty"`
	Plugin           string             `json:"plugin"`
	Usage            string             `json:"usage"`
	Description      string             `json:"description"`
	Default          bool               `json:"default"`
	Help             string             `json:"help"`
	FullHelp         string             `json:"fullHelp"`
	Hidden           bool               `json:"hidden"`
	NeedsApp         bool               `json:"needsApp"`
	WantsApp         bool               `json:"wantsApp"`
	NeedsOrg         bool               `json:"needsOrg"`
	WantsOrg         bool               `json:"wantsOrg"`
	NeedsAuth        bool               `json:"needsAuth"`
	VariableArgs     bool               `json:"variableArgs"`
	DisableAnalytics bool               `json:"disableAnalytics"`
	Args             []Arg              `json:"args"`
	Flags            []Flag             `json:"flags"`
	Run              func(ctx *Context) `json:"-"`
}

func (c *Command) String() string {
	if c.Command == "" {
		return c.Topic
	}
	return c.Topic + ":" + c.Command
}

func commandUsage(c *Command) string {
	if c.Usage != "" {
		return c.Usage
	}
	return c.String() + argsString(c.Args)
}

func (c *Command) buildFlagHelp() string {
	flags := c.Flags
	if c.NeedsApp || c.WantsApp {
		flags = append(flags, *appFlag, *remoteFlag)
	}
	if c.NeedsOrg || c.WantsOrg {
		flags = append(flags, *orgFlag)
	}
	lines := make([]string, 0, len(flags))
	for _, flag := range flags {
		if flag.Hidden {
			continue
		}
		if flag.Description == "" {
			lines = append(lines, flag.String())
		} else {
			lines = append(lines, fmt.Sprintf("%-20s # %s", flag.String(), flag.Description))
		}
	}
	return strings.Join(lines, "\n")
}

func (c *Command) buildFullHelp() string {
	sections := make([]string, 0, 3)
	if c.Description != "" {
		sections = append(sections, c.Description)
	}
	flagHelp := c.buildFlagHelp()
	if flagHelp != "" {
		sections = append(sections, flagHelp)
	}
	if c.Help != "" {
		sections = append(sections, c.Help)
	}
	return strings.TrimSuffix(strings.Join(sections, "\n\n"), "\n")
}

func (c *Command) unexpectedFlagErr(flag string) {
	flagHelp := c.buildFlagHelp()
	cmd := "heroku " + c.String()
	if flagHelp == "" {
		ExitWithMessage(
			`Error: Unexpected flag %s
Usage: %s
This command does not take any flags.

See more information with %s`,
			red(flag),
			cyan("heroku "+commandUsage(c)),
			cyan(cmd+" --help"),
		)
	}
	ExitWithMessage(
		`Error: Unexpected flag %s
Usage: %s

This flag is invalid for this command. Here are the accepted flags:
%s

See more information with %s`,
		red(flag),
		cyan("heroku "+commandUsage(c)),
		flagHelp,
		cyan(cmd+" --help"),
	)
}

func (c *Command) appNeededErr() {
	ExitWithMessage(
		`Error: No app specified
Usage: %s
We don't know which app to run this on.
Run this command from inside an app folder or specify which app to use with %s

https://devcenter.heroku.com/articles/using-the-cli#app-commands`,
		cyan("heroku "+commandUsage(c)+" --app APP"),
		cyan("--app APP"),
	)
}

func (c *Command) unexpectedArgumentsErr(args []string) {
	cmd := "heroku " + c.String()
	ExitWithMessage(
		`Error: Unexpected %s %s
Usage: %s
You gave this command too many arguments. Try the command again without these extra arguments.

See more information with %s`,
		plural("argument", len(args)),
		red(strings.Join(args, " ")),
		cyan("heroku "+commandUsage(c)),
		cyan(cmd+" --help"),
	)
}

// CommandSet is a slice of Command structs with some helper methods.
type CommandSet []*Command

// ByTopicAndCommand returns a command that matches the passed topic and command.
func (commands CommandSet) ByTopicAndCommand(topic, command string) *Command {
	for _, c := range commands {
		if c.Topic == topic {
			if c.Command == command || c.Default && command == "" {
				return c
			}
		}
	}
	return nil
}

func (commands CommandSet) loadUsages() {
	for _, c := range commands {
		c.Usage = commandUsage(c)
	}
}

func (commands CommandSet) loadFullHelp() {
	for _, c := range commands {
		if c.FullHelp == "" {
			c.FullHelp = c.buildFullHelp()
		}
	}
}

func (commands CommandSet) Len() int {
	return len(commands)
}

func (commands CommandSet) Less(i, j int) bool {
	return commands[i].Command < commands[j].Command
}

func (commands CommandSet) Swap(i, j int) {
	commands[i], commands[j] = commands[j], commands[i]
}

// Arg defines an argument for a command.
// These will be parsed in Go and passed to the Run method in the Context struct.
type Arg struct {
	Name     string `json:"name"`
	Optional bool   `json:"optional"`
	Hidden   bool   `json:"hidden"`
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
		if arg.Hidden {
			continue
		}
		if arg.Optional {
			buffer.WriteString(" [" + strings.ToUpper(arg.Name) + "]")
		} else {
			buffer.WriteString(" " + strings.ToUpper(arg.Name))
		}
	}
	return buffer.String()
}

var commandsTopic = &Topic{
	Name:        "commands",
	Description: "list all commands",
	Hidden:      true,
}

var commandsListCmd = &Command{
	Topic:            "commands",
	Description:      "list all commands",
	Flags:            []Flag{{Name: "json"}},
	DisableAnalytics: true,
	Run: func(ctx *Context) {
		SetupBuiltinPlugins()
		cli.LoadPlugins(GetPlugins())
		if ctx.Flags["json"] == true {
			cli.Commands.loadUsages()
			cli.Commands.loadFullHelp()
			doc := map[string]interface{}{"topics": cli.Topics, "commands": cli.Commands}
			s, _ := json.Marshal(doc)
			Println(string(s))
			return
		}
		for _, command := range cli.Commands {
			if command.Hidden {
				continue
			}
			if command.Command == "" {
				Printf("%s\n", command.Topic)
			} else {
				Printf("%s:%s\n", command.Topic, command.Command)
			}
		}
	},
}
