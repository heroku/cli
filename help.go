package main

import (
	"bytes"
	"fmt"
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
	cmd = cmd + argsString(command.Args) + flagsString(command.Flags)
	if command.NeedsApp {
		cmd = cmd + " --app APP"
	}
	return cmd
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
