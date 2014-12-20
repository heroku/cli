package main

import (
	"errors"
	"strings"
)

var HelpErr = errors.New("help")

type Cli struct {
	Topics map[string]*Topic
}

func (cli *Cli) AddCommand(cmd *Command) {
	if cli.Topics[cmd.Topic] == nil {
		cli.Topics[cmd.Topic] = &Topic{Name: cmd.Topic}
		return
	}
	dest := cli.Topics[cmd.Topic]
	if dest.GetCommand(cmd.Name) == nil {
		dest.Commands = append(dest.Commands, cmd)
	}
}

func (cli *Cli) Parse(args []string) (ctx *Context, err error) {
	ctx = &Context{}
	if len(args) == 0 {
		return ctx, HelpErr
	}
	ctx.Topic, ctx.Command = cli.parseCmd(args[0])
	if ctx.Command == nil {
		return ctx, HelpErr
	}
	ctx.Args, ctx.App, err = parseArgs(ctx.Command, args[1:])
	return ctx, err
}

func (cli *Cli) parseCmd(cmd string) (topic *Topic, command *Command) {
	tc := strings.SplitN(cmd, ":", 2)
	topic = cli.Topics[tc[0]]
	if topic == nil {
		return nil, nil
	}
	if len(tc) == 2 {
		return topic, topic.GetCommand(tc[1])
	} else {
		return topic, topic.GetCommand("")
	}
}

func parseArgs(command *Command, args []string) (result map[string]string, appName string, err error) {
	result = map[string]string{}
	numArgs := 0
	parseFlags := true
	for i := 0; i < len(args); i++ {
		switch {
		case args[i] == "help" || args[i] == "--help" || args[i] == "-h":
			return nil, "", HelpErr
		case args[i] == "--":
			parseFlags = false
		case args[i] == "-a" || args[i] == "--app":
			i++
			if len(args) == i {
				return nil, "", errors.New("Must specify app name")
			}
			appName = args[i]
		case parseFlags && strings.HasPrefix(args[i], "-"):
			// TODO
		case numArgs == len(command.Args):
			return nil, "", errors.New("Unexpected argument: " + strings.Join(args[numArgs:], " "))
		default:
			result[command.Args[i].Name] = args[i]
			numArgs++
		}
	}
	for _, arg := range command.Args {
		if !arg.Optional && result[arg.Name] == "" {
			return nil, "", errors.New("Missing argument: " + strings.ToUpper(arg.Name))
		}
	}
	return result, appName, nil
}
