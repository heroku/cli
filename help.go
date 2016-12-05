package main

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/texttheater/golang-levenshtein/levenshtein"
)


// HELP is "help"
const HELP = "help"

func init() {
    Printf("Init help\n")
	CLITopics = append(CLITopics, &Topic{
		Name:   HELP,
		Hidden: true,
		Commands: Commands{
			&Command{
				Hidden: true,
				Run: func(ctx *Context) {
					Args = []string{BASE_CMD_NAME, HELP}
					help()
				},
			},
		},
	})
}

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
	Printf("Usage: %s COMMAND [--app APP] [command-specific-options]\n\n", BASE_CMD_NAME)
	Printf("Help topics, type \"%s help TOPIC\" for more details:\n\n", BASE_CMD_NAME)
	topics := AllTopics().NonHidden().Sort()

	longestTopic := 0
	for _, topic := range topics {
        Printf("%s\n", topic);
		if len(topic.Name) > longestTopic {
			longestTopic = len(topic.Name)
		}
	}
	for _, topic := range topics {
		Printf("  %s %-"+strconv.Itoa(longestTopic+1)+"s# %s\n", BASE_CMD_NAME, topic.Name, topic.Description)
	}
	Println()
	Exit(0)
}

func helpShowTopic(topic *Topic) {
	Printf("Usage: %s %s:COMMAND [--app APP] [command-specific-options]\n\n", BASE_CMD_NAME, topic.Name)
	printTopicCommandsHelp(topic)
	Println()
	Exit(0)
}

func helpShowCommand(topic *Topic, command *Command) {
	Printf("Usage: %s %s\n\n", BASE_CMD_NAME, CommandUsage(command))
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
		Printf("\nCommands for %s, type \"%s help %s:COMMAND\" for more details:\n\n", topic.Name, BASE_CMD_NAME, topic.Name)
		for _, command := range topicCommands.Sort() {
			Printf(" %s %-30s # %s\n", BASE_CMD_NAME, command.Usage, command.Description)
		}
	}
}

func helpInvalidCommand() {
	checkIfKnownTopic(Args[1])
	var closest string
	currentAnalyticsCommand.Valid = false
	guess, distance := findClosestCommand(AllCommands(), Args[1])
	if len(Args[1]) > 2 || distance < 2 {
		newcmd := strings.TrimSpace(fmt.Sprintf("%s %s %s", BASE_CMD_NAME, guess, strings.Join(Args[2:], " ")))
		WarnIfError(saveJSON(&Guess{guess.String(), Args[2:]}, guessPath()))
		closest = fmt.Sprintf("Perhaps you meant %s?\nRun %s to run %s.\n", yellow(guess.String()), cyan(BASE_CMD_NAME+" _"), cyan(newcmd))
	}
	ExitWithMessage(`%s is not a %s command.
%sRun %s for a list of available commands.
`, yellow(Args[1]), BASE_CMD_NAME, closest, cyan(BASE_CMD_NAME+" help"))
}

func checkIfKnownTopic(cmd string) {
	knownTopics := map[string]string{
		"redis": "heroku-redis",
		"kafka": "heroku-kafka",
	}
	topic := strings.Split(cmd, ":")[0]
	plugin := knownTopics[topic]
	if plugin != "" {
		ExitWithMessage("Use %s commands by installing the %s plugin.\n%s", topic, yellow(plugin), cyan(BASE_CMD_NAME+" plugins:install "+plugin))
	}
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

// Guess is used with `BASE_CMD_NAME _`
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
