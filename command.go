package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

func init() {
	CLITopics = append(CLITopics, Topics{
		{
			Name:        "commands",
			Description: "list all commands",
			Hidden:      true,
			Commands: Commands{
				{
					Topic:            "commands",
					Description:      "list all commands",
					Flags:            []Flag{{Name: "json"}},
					DisableAnalytics: true,
					Run: func(ctx *Context) {
						commands := AllCommands().Sort()
						if ctx.Flags["json"] == true {
							commands.loadUsages()
							commands.loadFullHelp()
							doc := map[string]interface{}{"topics": CLITopics, "commands": commands}
							s, _ := json.Marshal(doc)
							Println(string(s))
							return
						}
						for _, command := range commands {
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
				},
			},
		},
	}...)
}

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
	Flags            Flags              `json:"flags"`
	Run              func(ctx *Context) `json:"-"`
}

func (c Command) String() string {
	if c.Command == "" {
		return c.Topic
	}
	return c.Topic + ":" + c.Command
}

// CommandUsage generates the usage for a command
func CommandUsage(c *Command) string {
	if c.Usage != "" {
		return c.Usage
	}
	return c.String() + argsString(c.Args)
}

func (c *Command) buildFlagHelp() string {
	flags := c.Flags
	if c.NeedsApp || c.WantsApp {
		flags = append(flags, *AppFlag, *RemoteFlag)
	}
	if c.NeedsOrg || c.WantsOrg {
		flags = append(flags, *OrgFlag)
	}
	flags.Sort()
	lines := make([]string, 0, len(flags))
	longestFlag := 20
	for _, flag := range flags {
		if l := len(flag.String()); l > longestFlag {
			longestFlag = l
		}
	}
	for _, flag := range flags {
		if flag.Hidden {
			continue
		}
		if flag.Description == "" {
			lines = append(lines, flag.String())
		} else {
			lines = append(lines, fmt.Sprintf("%-"+strconv.Itoa(longestFlag)+"s # %s", flag.String(), flag.Description))
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
			cyan("heroku "+CommandUsage(c)),
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
		cyan("heroku "+CommandUsage(c)),
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
		cyan("heroku "+CommandUsage(c)+" --app APP"),
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
		cyan("heroku "+CommandUsage(c)),
		cyan(cmd+" --help"),
	)
}

// Commands is a slice of Command structs with some helper methods.
type Commands []*Command

// Find finds a command and topic matching the cmd string
func (commands Commands) Find(cmd string) *Command {
	var topic, command string
	tc := strings.SplitN(cmd, ":", 2)
	topic = tc[0]
	if len(tc) > 1 {
		command = tc[1]
	}
	for _, c := range commands {
		if c.Topic == topic && (c.Command == command || c.Default && command == "") {
			return c
		}
	}
	return nil
}

func (commands Commands) loadUsages() {
	for _, c := range commands {
		c.Usage = CommandUsage(c)
	}
}

func (commands Commands) loadFullHelp() {
	for _, c := range commands {
		if c.FullHelp == "" {
			c.FullHelp = c.buildFullHelp()
		}
	}
}

func (commands Commands) Len() int {
	return len(commands)
}

func (commands Commands) Less(i, j int) bool {
	if commands[i].Topic == commands[j].Topic {
		return commands[i].Command < commands[j].Command
	}
	return commands[i].Topic < commands[j].Topic
}

func (commands Commands) Swap(i, j int) {
	commands[i], commands[j] = commands[j], commands[i]
}

// NonHidden returns the commands that are not hidden
func (commands Commands) NonHidden() []*Command {
	to := make([]*Command, 0, len(commands))
	for _, command := range commands {
		if !command.Hidden {
			to = append(to, command)
		}
	}
	return to
}

// Sort sorts
func (commands Commands) Sort() Commands {
	sort.Sort(commands)
	return commands
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

// AllCommands gets all go/core/user commands
func AllCommands() Commands {
	commands := CLITopics.Commands()
	commands = append(commands, UserPlugins.Commands()...)
	commands = append(commands, CorePlugins.Commands()...)
	return commands
}
