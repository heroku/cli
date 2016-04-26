package main

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/texttheater/golang-levenshtein/levenshtein"
)

// Help shows the help
func Help(args []string) {
	var cmd string
	if len(args) > 1 {
		cmd = args[1]
		if len(args) > 2 && cmd == "help" {
			cmd = args[2]
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
	case cmd == "":
		Printf("Usage: heroku COMMAND [--app APP] [command-specific-options]\n\n")
		Printf("Help topics, type \"heroku help TOPIC\" for more details:\n\n")
		for _, topic := range nonHiddenTopics(topics) {
			Printf("  heroku %-30s# %s\n", topic.Name, topic.Description)
		}
		Exit(0)
	case topic == nil:
		helpInvalidCommand(cmd, commands)
	case command == nil:
		Printf("Usage: heroku %s:COMMAND [--app APP] [command-specific-options]\n\n", topic.Name)
		printTopicCommandsHelp(topic, topicCommands)
		Exit(0)
	case command.Command == "":
		printCommandHelp(command)
		// This is a root command so show the other commands in the topic
		// if there are any
		if len(topicCommands) > 1 {
			printTopicCommandsHelp(topic, topicCommands)
		}
		Exit(0)
	default:
		printCommandHelp(command)
		Exit(0)
	}
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

func helpInvalidCommand(cmd string, commands CommandSet) {
	var closest string
	if len(cmd) > 2 {
		closest = fmt.Sprintf("Perhaps you meant %s.\n", yellow(findClosestCommand(commands, cmd).String()))
	}
	ExitWithMessage(`%s is not a heroku command.
%sRun %s help for a list of available commands.
`, yellow(cmd), closest, cyan("heroku"))
}

func findClosestCommand(from CommandSet, a string) *Command {
	var top *Command
	var val int
	for _, b := range from {
		if cur := stringDistance(a, b.String()); cur < val || top == nil {
			top = b
			val = cur
		}
	}
	return top
}

func stringDistance(a, b string) int {
	return levenshtein.DistanceForStrings([]rune(a), []rune(b), levenshtein.DefaultOptions)
}

var helpTopic = &Topic{
	Name:   "help",
	Hidden: true,
}

var helpCmd = &Command{
	Topic:  "help",
	Hidden: true,
	Run: func(ctx *Context) {
		Help(os.Args)
	},
}
