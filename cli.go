package main

import (
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/dickeyxxx/netrc"
)

// ErrOrgNeeded means the command needs an org context and one was not found.
var ErrOrgNeeded = errors.New("No org specified.\nRun this command with --org or by setting HEROKU_ORGANIZATION")

// Cli handles parsing and dispatching of commands
type Cli struct {
	Topics   TopicSet
	Commands CommandSet
}

// Run parses command line arguments and runs the associated command or help.
// Also does lookups for app name and/or auth token if the command needs it.
func (cli *Cli) Run(args []string, showHelp bool) (err error) {
	ctx := &Context{}
	if len(args) < 2 {
		if showHelp {
			help()
		} else {
			return
		}
	}
	ctx.Topic, ctx.Command = cli.ParseCmd(args[1])
	if ctx.Command == nil {
		currentAnalyticsCommand.Valid = false
		if showHelp {
			help()
		} else {
			return
		}
	}
	if ctx.Command.VariableArgs {
		ctx.Args, ctx.Flags, ctx.App = parseVarArgs(ctx.Command, args[2:])
	} else {
		ctx.Args, ctx.Flags, ctx.App = parseArgs(ctx.Command, args[2:])
	}
	if ctx.Command.NeedsApp || ctx.Command.WantsApp {
		if ctx.App == "" {
			ctx.App, err = app()
			if err != nil && ctx.Command.NeedsApp {
				ExitWithMessage(err.Error())
			}
		}
		if ctx.App == "" && ctx.Command.NeedsApp {
			return ctx.Command.appNeededErr()
		}
	}
	if ctx.Command.NeedsOrg || ctx.Command.WantsOrg {
		if org, ok := ctx.Flags["org"].(string); ok {
			ctx.Org = org
		} else {
			ctx.Org = os.Getenv("HEROKU_ORGANIZATION")
		}
		if ctx.Org == "" && ctx.Command.NeedsOrg {
			return ErrOrgNeeded
		}
	}
	if ctx.Command.NeedsAuth {
		ctx.APIToken = auth()
		ctx.Auth.Password = ctx.APIToken
	}
	ctx.Cwd, _ = os.Getwd()
	ctx.HerokuDir = AppDir()
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
	return nil
}

// ParseCmd parses the command argument into a topic and command
func (cli *Cli) ParseCmd(cmd string) (topic *Topic, command *Command) {
	if strings.ToLower(cmd) == "--version" || strings.ToLower(cmd) == "-v" {
		return versionTopic, versionCmd
	}
	tc := strings.SplitN(cmd, ":", 2)
	topic = cli.Topics.ByName(tc[0])
	if topic == nil {
		return nil, nil
	}
	if len(tc) == 2 {
		return topic, cli.Commands.ByTopicAndCommand(tc[0], tc[1])
	}
	return topic, cli.Commands.ByTopicAndCommand(tc[0], "")
}

func parseVarArgs(command *Command, args []string) (result []string, flags map[string]interface{}, appName string) {
	result = make([]string, 0, len(args))
	flags = map[string]interface{}{}
	parseFlags := true
	possibleFlags := []*Flag{debuggerFlag}
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

func getNetrc() *netrc.Netrc {
	n, err := netrc.Parse(netrcPath())
	if err != nil {
		if _, ok := err.(*os.PathError); ok {
			// File not found
			return &netrc.Netrc{Path: netrcPath()}
		}
		Errln("Error parsing netrc at " + netrcPath())
		Errln(err.Error())
		Exit(1)
	}
	return n
}

func auth() (password string) {
	token := apiToken()
	if token == "" {
		interactiveLogin()
		return auth()
	}
	return token
}

func apiToken() string {
	key := os.Getenv("HEROKU_API_KEY")
	if key != "" {
		return key
	}
	netrc := getNetrc()
	machine := netrc.Machine(apiHost())
	if machine != nil {
		return machine.Get("password")
	}
	return ""
}

func netrcPath() string {
	base := filepath.Join(HomeDir, ".netrc")
	if runtime.GOOS == "windows" {
		base = filepath.Join(HomeDir, "_netrc")
	}
	if exists, _ := fileExists(base + ".gpg"); exists {
		base = base + ".gpg"
	}
	return base
}

func netrcLogin() string {
	key := os.Getenv("HEROKU_API_KEY")
	if key != "" {
		return ""
	}
	netrc := getNetrc()
	machine := netrc.Machine(apiHost())
	if machine != nil {
		return machine.Get("login")
	}
	return ""
}

// AddTopic adds a Topic to the set of topics.
// It will return false if a topic exists with the same name.
func (cli *Cli) AddTopic(topic *Topic) {
	existing := cli.Topics.ByName(topic.Name)
	if existing != nil {
		existing.Merge(topic)
	} else {
		cli.Topics = append(cli.Topics, topic)
	}
}

// AddCommand adds a Command to the set of commands.
// It will return false if a command exists with the same topic and command name.
// It will also add an empty topic if there is not one already.
func (cli *Cli) AddCommand(command *Command) bool {
	if cli.Topics.ByName(command.Topic) == nil {
		cli.Topics = append(cli.Topics, &Topic{Name: command.Topic})
	}
	if cli.Commands.ByTopicAndCommand(command.Topic, command.Command) != nil {
		return false
	}
	cli.Commands = append(cli.Commands, command)
	return true
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

func processTitle(ctx *Context) string {
	return "heroku " + strings.Join(os.Args[1:], " ")
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
