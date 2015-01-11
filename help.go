package main

import (
	"os"
	"strings"
)

func help() {
	var cmd string
	if len(os.Args) > 0 {
		cmd = os.Args[1]
		if len(os.Args) > 2 && cmd == "help" {
			cmd = os.Args[2]
		}
	}
	topic, command := cli.ParseCmd(cmd)
	switch {
	case topic == nil:
		Errf("USAGE: heroku COMMAND [--app APP] [command-specific-options]\n\n")
		Errf("Help topics, type \"heroku help TOPIC\" for more details:\n\n")
		for _, topic := range nonHiddenTopics(cli.Topics) {
			Errf("  heroku %-30s# %s\n", topic.Name, topic.ShortHelp)
		}
	case command == nil:
		Errf("USAGE: heroku %s:COMMAND [--app APP] [command-specific-options]\n\n", topic.Name)
		Errln(topic.Help)
		printTopicCommandsHelp(topic)
	case command.Command == "":
		Errf("USAGE: heroku %s\n\n", commandSignature(topic, command))
		Errln(command.Help)
		// This is a root command so show the other commands in the topic
		printTopicCommandsHelp(topic)
	default:
		Errf("USAGE: heroku %s\n\n", commandSignature(topic, command))
		Errln(command.Help)
	}
	os.Exit(2)
}

func printTopicCommandsHelp(topic *Topic) {
	commands := topic.Commands()
	if len(commands) > 0 {
		Errf("\nCommands for %s, type \"heroku help %s:COMMAND\" for more details:\n\n", topic.Name, topic.Name)
		for _, command := range nonHiddenCommands(commands) {
			Errf(" heroku %-30s # %s\n", commandSignature(topic, command), command.ShortHelp)
		}
	}
}

func commandSignature(topic *Topic, command *Command) string {
	cmd := topic.Name
	if command.Command != "" {
		cmd = cmd + ":" + command.Command
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
func nonHiddenTopics(from []*Topic) []*Topic {
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
