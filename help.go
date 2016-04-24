package main

import (
	"os"
	"sort"
	"strings"
)

// show the help
func help() {
	var cmd string
	if len(os.Args) > 1 {
		cmd = os.Args[1]
		if len(os.Args) > 2 && cmd == "help" {
			cmd = os.Args[2]
		} else {
			currentAnalyticsCommand.Valid = false
		}
	}
	commands := AllCommands()
	commands.loadUsages()
	command := commands.Find(cmd)
	topics := AllTopics()
	topic := topics.ByName(strings.SplitN(cmd, ":", 2)[0])
	topicCommands := CommandSet{}
	for _, cur := range commands {
		if topic != nil && cur.Topic == topic.Name {
			topicCommands = append(topicCommands, cur)
		}
	}
	sort.Sort(topics)
	sort.Sort(commands)
	switch {
	case topic == nil:
		//Print("heroku is the CLI for managing apps hosted on heroku.com\n\n")
		Printf("Usage: heroku COMMAND [--app APP] [command-specific-options]\n\n")
		Printf("Help topics, type \"heroku help TOPIC\" for more details:\n\n")
		for _, topic := range nonHiddenTopics(topics) {
			Printf("  heroku %-30s# %s\n", topic.Name, topic.Description)
		}
	case command == nil:
		Printf("Usage: heroku %s:COMMAND [--app APP] [command-specific-options]\n\n", topic.Name)
		printTopicCommandsHelp(topic, topicCommands)
	case command.Command == "":
		printCommandHelp(command)
		// This is a root command so show the other commands in the topic
		// if there are any
		if len(topicCommands) > 1 {
			printTopicCommandsHelp(topic, topicCommands)
		}
	default:
		printCommandHelp(command)
	}
	Exit(0)
}

func printTopicCommandsHelp(topic *Topic, commands CommandSet) {
	if len(commands) > 0 {
		Printf("\nCommands for %s, type \"heroku help %s:COMMAND\" for more details:\n\n", topic.Name, topic.Name)
		for _, command := range nonHiddenCommands(commands) {
			Printf(" heroku %-30s # %s\n", command.Usage, command.Description)
		}
	}
}

func printCommandHelp(command *Command) {
	Printf("Usage: heroku %s\n\n", command.Usage)
	Println(command.buildFullHelp())
}

func nonHiddenTopics(from TopicSet) TopicSet {
	to := make(TopicSet, 0, len(from))
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
