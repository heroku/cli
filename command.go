package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"sort"
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

// Find finds a command and topic matching the cmd string
func (commands CommandSet) Find(cmd string) *Command {
	if strings.ToLower(cmd) == "--version" || strings.ToLower(cmd) == "-v" {
		return versionCmd
	}
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
	if commands[i].Topic == commands[j].Topic {
		return commands[i].Command < commands[j].Command
	}
	return commands[i].Topic < commands[j].Topic
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
		commands := AllCommands()
		sort.Sort(commands)
		if ctx.Flags["json"] == true {
			commands.loadUsages()
			commands.loadFullHelp()
			doc := map[string]interface{}{"topics": Topics, "commands": commands}
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
}

// AllCommands gets all go/core/user commands
func AllCommands() CommandSet {
	commands := Commands
	commands = append(commands, corePlugins.Commands()...)
	commands = append(commands, userPlugins.Commands()...)
	return commands
}

// Run parses command line arguments and runs the associated command or help.
// Also does lookups for app name and/or auth token if the command needs it.
func (commands CommandSet) Run(args []string) {
	ctx := &Context{}
	ctx.Command = commands.Find(args[1])
	if ctx.Command == nil {
		return
	}
	if ctx.Command.VariableArgs {
		ctx.Args, ctx.Flags, ctx.App = parseVarArgs(ctx.Command, args[2:])
	} else {
		ctx.Args, ctx.Flags, ctx.App = parseArgs(ctx.Command, args[2:])
	}
	if ctx.Command.NeedsApp || ctx.Command.WantsApp {
		if ctx.App == "" {
			var err error
			ctx.App, err = app()
			if err != nil && ctx.Command.NeedsApp {
				ExitWithMessage(err.Error())
			}
		}
		if ctx.App == "" && ctx.Command.NeedsApp {
			ctx.Command.appNeededErr()
		}
	}
	if ctx.Command.NeedsOrg || ctx.Command.WantsOrg {
		if org, ok := ctx.Flags["org"].(string); ok {
			ctx.Org = org
		} else {
			ctx.Org = os.Getenv("HEROKU_ORGANIZATION")
		}
		if ctx.Org == "" && ctx.Command.NeedsOrg {
			ExitWithMessage("No org specified.\nRun this command with --org or by setting HEROKU_ORGANIZATION")
		}
	}
	if ctx.Command.NeedsAuth {
		ctx.APIToken = auth()
		ctx.Auth.Password = ctx.APIToken
	}
	ctx.Cwd, _ = os.Getwd()
	ctx.HerokuDir = CacheHome
	ctx.Debug = debugging
	ctx.DebugHeaders = debuggingHeaders
	ctx.Version = version()
	ctx.SupportsColor = supportsColor()
	ctx.APIHost = apiHost()
	ctx.APIURL = apiURL()
	ctx.GitHost = gitHost()
	ctx.HTTPGitHost = httpGitHost()
	currentAnalyticsCommand.RecordStart()
	if ctx.Command.DisableAnalytics {
		currentAnalyticsCommand = nil
	}
	ctx.Command.Run(ctx)
	Exit(0)
}

func parseVarArgs(command *Command, args []string) (result []string, flags map[string]interface{}, appName string) {
	result = make([]string, 0, len(args))
	flags = map[string]interface{}{}
	parseFlags := true
	possibleFlags := []*Flag{}
	populateFlagsFromEnvVars(command.Flags, flags)
	for _, flag := range command.Flags {
		f := flag
		possibleFlags = append(possibleFlags, &f)
	}
	if command.NeedsApp || command.WantsApp {
		possibleFlags = append(possibleFlags, appFlag, remoteFlag)
	}
	if command.NeedsOrg || command.WantsOrg {
		possibleFlags = append(possibleFlags, orgFlag)
	}
	warnAboutDuplicateFlags(possibleFlags)
	for i := 0; i < len(args); i++ {
		switch {
		case parseFlags && (args[i] == "--"):
			parseFlags = false
		case parseFlags && (args[i] == "--help" || args[i] == "-h"):
			help()
		case parseFlags && (args[i] == "--no-color"):
			continue
		case parseFlags && strings.HasPrefix(args[i], "-"):
			flag, val, err := parseFlag(args[i], possibleFlags)
			if err != nil && strings.HasSuffix(err.Error(), "needs a value") {
				i++
				if len(args) == i {
					ExitWithMessage(err.Error())
				}
				flag, val, err = parseFlag(args[i-1]+"="+args[i], possibleFlags)
			}
			switch {
			case err != nil:
				ExitWithMessage(err.Error())
			case flag == nil && command.VariableArgs:
				result = append(result, args[i])
			case flag == nil:
				command.unexpectedFlagErr(args[i])
			case flag == appFlag:
				appName = val
			case flag == remoteFlag:
				appName, err = appFromGitRemote(val)
				if err != nil {
					ExitWithMessage(err.Error())
				}
			case flag.HasValue:
				flags[flag.Name] = val
			default:
				flags[flag.Name] = true
			}
		default:
			result = append(result, args[i])
		}
	}
	for _, flag := range command.Flags {
		if flag.Required && flags[flag.Name] == nil {
			ExitWithMessage("Required flag: %s", flag.String())
		}
	}
	return result, flags, appName
}

func parseArgs(command *Command, args []string) (result map[string]string, flags map[string]interface{}, appName string) {
	result = map[string]string{}
	args, flags, appName = parseVarArgs(command, args)
	if len(args) > len(command.Args) {
		command.unexpectedArgumentsErr(args[len(command.Args):])
	}
	for i, arg := range args {
		result[command.Args[i].Name] = arg
	}
	for _, arg := range command.Args {
		if !arg.Optional && result[arg.Name] == "" {
			ExitWithMessage("Missing argument: %s", strings.ToUpper(arg.Name))
		}
	}
	return result, flags, appName
}

func app() (string, error) {
	app := os.Getenv("HEROKU_APP")
	if app != "" {
		return app, nil
	}
	return appFromGitRemote(remoteFromGitConfig())
}

func populateFlagsFromEnvVars(flagDefinitons []Flag, flags map[string]interface{}) {
	for _, flag := range flagDefinitons {
		if strings.ToLower(flag.Name) == "user" && os.Getenv("HEROKU_USER") != "" {
			flags[flag.Name] = os.Getenv("HEROKU_USER")
		}
		if strings.ToLower(flag.Name) == "force" && os.Getenv("HEROKU_FORCE") == "1" {
			flags[flag.Name] = true
		}
	}
}

func warnAboutDuplicateFlags(flags []*Flag) {
	for _, a := range flags {
		for _, b := range flags {
			if a == b {
				continue
			}
			if (a.Char != "" && a.Char == b.Char) ||
				(a.Name != "" && a.Name == b.Name) {
				Errf("Flag conflict: %s conflicts with %s\n", a, b)
			}
		}
	}
}
