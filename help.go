package main

import (
	"os"
	"strings"
)

func help() {
	args := os.Args[1:]
	if len(args) > 0 && args[0] == "help" {
		args = args[1:]
	}
	ctx, _ := cli.Parse(args)
	switch {
	case ctx.Topic == nil:
		Errf("USAGE: heroku COMMAND [--app APP] [command-specific-options]\n\n")
		Errf("Help topics, type \"heroku help TOPIC\" for more details:\n\n")
		for _, topic := range nonHiddenTopics(cli.Topics) {
			Errf("  heroku %-30s# %s\n", topic.Name, topic.ShortHelp)
		}
	case ctx.Command == nil:
		Errf("USAGE: heroku %s:COMMAND [--app APP] [command-specific-options]\n\n", ctx.Topic.Name)
		Errln(ctx.Topic.Help)
		printTopicCommandsHelp(ctx.Topic)
	case ctx.Command.Name == "":
		Errf("USAGE: heroku %s\n\n", commandSignature(ctx.Topic, ctx.Command))
		Errln(ctx.Command.Help)
		// This is a root command so show the other commands in the topic
		printTopicCommandsHelp(ctx.Topic)
	default:
		Errf("USAGE: heroku %s\n\n", commandSignature(ctx.Topic, ctx.Command))
		Errln(ctx.Command.Help)
	}
	os.Exit(2)
}

func printTopicCommandsHelp(topic *Topic) {
	if len(topic.Commands) > 0 {
		Errf("\nCommands for %s, type \"heroku help %s:COMMAND\" for more details:\n\n", topic.Name, topic.Name)
		for _, command := range nonHiddenCommands(topic.Commands) {
			Errf(" heroku %-30s # %s\n", commandSignature(topic, command), command.ShortHelp)
		}
	}
}

func commandSignature(topic *Topic, command *Command) string {
	cmd := topic.Name
	if command.Name != "" {
		cmd = cmd + ":" + command.Name
	}
	cmd = cmd + commandArgs(command)
	if command.NeedsApp {
		cmd = cmd + " --app APP"
	}
	return cmd
}

func commandArgs(command *Command) string {
	args := ""
	for _, arg := range command.Args {
		if arg.Optional {
			args = args + " [" + strings.ToUpper(arg.Name) + "]"
		} else {
			args = args + " " + strings.ToUpper(arg.Name)
		}
	}
	return args
}
func nonHiddenTopics(from map[string]*Topic) []*Topic {
	to := make([]*Topic, 0, len(from))
	for _, topic := range from {
		if !topic.Hidden {
			to = append(to, topic)
		}
	}
	return to
}

func nonHiddenCommands(from []*Command) []*Command {
	to := make([]*Command, 0, len(from))
	for _, command := range from {
		if !command.Hidden {
			to = append(to, command)
		}
	}
	return to
}

func AppNeededWarning() {
	Errln(" !    No app specified.")
	Errln(" !    Run this command from an app folder or specify which app to use with --app APP.")
	os.Exit(3)
}
