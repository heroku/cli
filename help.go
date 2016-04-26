package main

import (
	"fmt"
	"strings"

	"github.com/texttheater/golang-levenshtein/levenshtein"
)

func init() {
	Topics = append(Topics, &Topic{
		Name:   "help",
		Hidden: true,
		Commands: CommandSet{
			&Command{
				Hidden: true,
				Run: func(ctx *Context) {
					help([]string{"heroku", "help"})
				},
			},
		},
	})
}

// HELP is "help"
const HELP = "help"

func help(args []string) {
	var cmd string
	switch {
	case len(args) <= 1:
		cmd = HELP
	case len(args) > 2 && (args[1] == HELP || args[1] == "--help"):
		cmd = args[2]
	default:
		cmd = args[1]
	}
	topic := AllTopics().ByName(strings.SplitN(cmd, ":", 2)[0])
	command := AllCommands().Find(cmd)
	switch {
	case cmd == HELP || cmd == "--help":
		helpShowTopics()
	case topic == nil:
		helpInvalidCommand(cmd)
	case command == nil && strings.Index(cmd, ":") != -1:
		helpInvalidCommand(cmd)
	case command == nil:
		helpShowTopic(topic)
	default:
		helpShowCommand(topic, command)
	}
}

func helpShowTopics() {
	Printf("Usage: heroku COMMAND [--app APP] [command-specific-options]\n\n")
	Printf("Help topics, type \"heroku help TOPIC\" for more details:\n\n")
	for _, topic := range AllTopics().NonHidden().Sort() {
		Printf("  heroku %-30s# %s\n", topic.Name, topic.Description)
	}
	Println()
	Exit(0)
}

func helpShowTopic(topic *Topic) {
	Printf("Usage: heroku %s:COMMAND [--app APP] [command-specific-options]\n\n", topic.Name)
	printTopicCommandsHelp(topic)
	Println()
	Exit(0)
}

func helpShowCommand(topic *Topic, command *Command) {
	Printf("Usage: heroku %s\n\n", commandUsage(command))
	Println(command.buildFullHelp())
	if command.Command == "" {
		printTopicCommandsHelp(topic)
	}
	Println()
	Exit(0)
}

func printTopicCommandsHelp(topic *Topic) {
	topicCommands := CommandSet{}
	for _, cur := range AllCommands().NonHidden() {
		if topic != nil && cur.Topic == topic.Name {
			topicCommands = append(topicCommands, cur)
		}
	}
	topicCommands.loadUsages()
	if len(topicCommands) > 0 {
		Printf("\nCommands for %s, type \"heroku help %s:COMMAND\" for more details:\n\n", topic.Name, topic.Name)
		for _, command := range topicCommands.Sort() {
			Printf(" heroku %-30s # %s\n", command.Usage, command.Description)
		}
	}
}

func helpInvalidCommand(cmd string) {
	var closest string
	currentAnalyticsCommand.Valid = false
	if len(cmd) > 2 {
		closest = fmt.Sprintf("Perhaps you meant %s.\n", yellow(findClosestCommand(AllCommands(), cmd).String()))
	}
	ExitWithMessage(`%s is not a heroku command.
%sRun %s for a list of available commands.
`, yellow(cmd), closest, cyan("heroku help"))
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
