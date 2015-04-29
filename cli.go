package main

import (
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/bgentry/go-netrc/netrc"
)

// ErrHelp means the user didn't type a valid command and we need to display help.
var ErrHelp = errors.New("help")

// ErrAppNeeded means the command needs an app context and one was not found.
var ErrAppNeeded = errors.New(" !    No app specified.\n !    Run this command from an app folder or specify which app to use with --app APP")

// Cli handles parsing and dispatching of commands
type Cli struct {
	Topics   TopicSet
	Commands CommandSet
}

// Run parses command line arguments and runs the associated command or help.
// Also does lookups for app name and/or auth token if the command needs it.
func (cli *Cli) Run(args []string) (err error) {
	ctx := &Context{}
	if len(args) < 2 {
		return ErrHelp
	}
	ctx.Topic, ctx.Command = cli.ParseCmd(args[1])
	if ctx.Command == nil {
		return ErrHelp
	}
	if ctx.Command.VariableArgs {
		ctx.Args, ctx.Flags, ctx.App, err = parseVarArgs(ctx.Command, args[2:])
	} else {
		ctx.Args, ctx.Flags, ctx.App, err = parseArgs(ctx.Command, args[2:])
	}
	if err != nil {
		return err
	}
	if ctx.Command.NeedsApp {
		if ctx.App == "" {
			ctx.App = app()
		}
		if app := os.Getenv("HEROKU_APP"); app != "" {
			ctx.App = app
		}
		if ctx.App == "" {
			return ErrAppNeeded
		}
	}
	if ctx.Command.NeedsAuth {
		ctx.Auth.Username, ctx.Auth.Password = auth()
	}
	ctx.Cwd, _ = os.Getwd()
	ctx.HerokuDir = AppDir
	ctx.Debug = debugging
	ctx.Command.Run(ctx)
	return nil
}

// ParseCmd parses the command argument into a topic and command
func (cli *Cli) ParseCmd(cmd string) (topic *Topic, command *Command) {
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

func parseVarArgs(command *Command, args []string) (result []string, flags map[string]interface{}, appName string, err error) {
	result = make([]string, 0, len(args))
	flags = map[string]interface{}{}
	parseFlags := true
	for i := 0; i < len(args); i++ {
		switch {
		case parseFlags && (args[i] == "--"):
			parseFlags = false
		case parseFlags && (args[i] == "help" || args[i] == "--help" || args[i] == "-h"):
			return nil, nil, "", ErrHelp
		case parseFlags && (args[i] == "-a" || args[i] == "--app"):
			i++
			if len(args) == i {
				return nil, nil, "", errors.New("Must specify app name")
			}
			appName = args[i]
		case parseFlags && (args[i] == "-r" || args[i] == "--remote"):
			i++
			if len(args) == i {
				return nil, nil, "", errors.New("Must specify remote name")
			}
			appName, err = appFromGitRemote(args[i])
			if err != nil {
				panic(err)
			}
		case parseFlags && strings.HasPrefix(args[i], "-"):
			for _, flag := range command.Flags {
				if args[i] == "-"+string(flag.Char) || args[i] == "--"+flag.Name {
					if flag.HasValue {
						i++
						if len(args) < i || strings.HasPrefix(args[i], "-") {
							return nil, nil, "", errors.New("--" + flag.Name + " requires a value")
						}
						flags[flag.Name] = args[i]
					} else {
						flags[flag.Name] = true
					}
				}
			}
		default:
			result = append(result, args[i])
		}
	}
	return result, flags, appName, nil
}

func parseArgs(command *Command, args []string) (result map[string]string, flags map[string]interface{}, appName string, err error) {
	result = map[string]string{}
	args, flags, appName, err = parseVarArgs(command, args)
	if len(args) > len(command.Args) {
		return nil, nil, "", errors.New("Unexpected argument: " + strings.Join(args[len(command.Args):], " "))
	}
	for i, arg := range args {
		result[command.Args[i].Name] = arg
	}
	for _, arg := range command.Args {
		if !arg.Optional && result[arg.Name] == "" {
			return nil, nil, "", errors.New("Missing argument: " + strings.ToUpper(arg.Name))
		}
	}
	return result, flags, appName, nil
}

func app() string {
	app, err := appFromGitRemote(remoteFromGitConfig())
	if err != nil {
		panic(err)
	}
	return app
}

func getNetrc() *netrc.Netrc {
	n, err := netrc.ParseFile(netrcPath())
	if err != nil {
		if _, ok := err.(*os.PathError); ok {
			// File not found
			return &netrc.Netrc{}
		}
		Errln("Error parsing netrc at " + netrcPath())
		Errln(err.Error())
		os.Exit(1)
	}
	return n
}

func auth() (user, password string) {
	netrc := getNetrc()
	machine := netrc.FindMachine("api.heroku.com")
	if machine == nil {
		login()
		return auth()
	}
	return machine.Login, machine.Password
}

func netrcPath() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(HomeDir, "_netrc")
	}
	return filepath.Join(HomeDir, ".netrc")
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
