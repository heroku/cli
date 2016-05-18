package main

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/texttheater/golang-levenshtein/levenshtein"
)

func init() {
	topics = append(topics, &Topic{
		Name:   "help",
		Hidden: true,
		Commands: Commands{
			&Command{
				Hidden: true,
				Run: func(ctx *Context) {
					Args = []string{"heroku", "help"}
					help()
				},
			},
		},
	})
}

// HELP is "help"
const HELP = "help"

func help() {
	cmd := Args[1]
	switch Args[1] {
	case "help", "--help", "-h":
		if len(Args) >= 3 {
			cmd = Args[2]
		} else {
			cmd = ""
		}
	}
	topic := AllTopics().ByName(strings.SplitN(cmd, ":", 2)[0])
	command := AllCommands().Find(cmd)
	switch {
	case topic == nil:
		helpShowTopics()
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
	Printf("Usage: heroku %s\n\n", CommandUsage(command))
	Println(command.buildFullHelp())
	if command.Command == "" {
		printTopicCommandsHelp(topic)
	}
	Println()
	Exit(0)
}

func printTopicCommandsHelp(topic *Topic) {
	topicCommands := Commands{}
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

func helpInvalidCommand() {
	var closest string
	currentAnalyticsCommand.Valid = false
	guess, distance := findClosestCommand(AllCommands(), Args[1])
	if len(Args[1]) > 2 || distance < 2 {
		newcmd := strings.TrimSpace(fmt.Sprintf("heroku %s %s", guess, strings.Join(Args[2:], " ")))
		WarnIfError(saveJSON(&Guess{guess.String(), Args[2:]}, guessPath()))
		closest = fmt.Sprintf("Perhaps you meant %s?\nRun %s to run %s.\n", yellow(guess.String()), cyan("heroku _"), cyan(newcmd))
	}
	ExitWithMessage(`%s is not a heroku command.
%sRun %s for a list of available commands.
`, yellow(Args[1]), closest, cyan("heroku help"))
}

func findClosestCommand(from Commands, a string) (*Command, int) {
	var top *Command
	var val int
	for _, b := range from {
		if cur := stringDistance(a, b.String()); cur < val || top == nil {
			top = b
			val = cur
		}
	}
	return top, val
}

func stringDistance(a, b string) int {
	return levenshtein.DistanceForStrings([]rune(a), []rune(b), levenshtein.DefaultOptions)
}

// Guess is used with `heroku _`
type Guess struct {
	Guess string   `json:"guess"`
	Args  []string `json:"args"`
}

func guessPath() string {
	return filepath.Join(CacheHome, "guess.json")
}

func loadLastCommandGuess() (guess *Guess) {
	err := readJSON(&guess, guessPath())
	LogIfError(err)
	return guess
}
