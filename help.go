package main

import (
	"fmt"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/texttheater/golang-levenshtein/levenshtein"
)

// HELP is "help"
const HELP = "help"

func init() {
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

func parseCmdString(cmd string) (*Namespace, *Topic, string) {
	if cmd == "" {
		return nil, nil, ""
	}

	var namespace *Namespace
	var topic *Topic
	var command string = ""
	var parts []string

	if AllNamespaces().Has(cmd) {
		// Return namespace, topic, command
		parts = strings.SplitN(cmd, ":", 3)
		namespace = AllNamespaces().ByName(parts[0])

		if len(parts) > 1 {
			Printf("%s", parts[1])
			topic = AllTopics().Namespace(namespace.Name).ByName(parts[1])
		}
		if len(parts) > 2 {
			command = parts[2]
		}
	} else {
		// Only return topic and command
		parts = strings.SplitN(cmd, ":", 2)
		topic = AllTopics().Namespace("").ByName(parts[0])

		if len(parts) > 1 {
			command = parts[1]
		}
	}
	return namespace, topic, command
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

	namespace, topic, _ := parseCmdString(cmd)
	command := AllCommands().Find(cmd)

	switch {
	case namespace == nil && topic == nil:
		helpShowNamespacesAndTopics()
	case topic == nil:
		helpShowTopics(namespace)
	case command == nil:
		helpShowTopic(namespace, topic)
	default:
		helpShowCommand(namespace, topic, command)
	}
}

// Show the overall help if no namespace, topic, or command is given
func helpShowNamespacesAndTopics() {
	Printf("Usage: %s COMMAND [command-specific-options]\n\n", BASE_CMD_NAME)
	Printf("Help topics, type \"%s help TOPIC\" for more details:\n\n", BASE_CMD_NAME)
	groups := AllTopics().NonHidden().NamespaceAndTopicDescriptions()

	longestTopic := 0
	var keys []string
	for key := range groups {
		keys = append(keys, key)
		if len(key) > longestTopic {
			longestTopic = len(key)
		}
	}

	sort.Strings(keys)

	for _, key := range keys {
		Printf("  %s %-"+strconv.Itoa(longestTopic+1)+"s# %s\n", BASE_CMD_NAME, key, groups[key])
	}
	Println()
	Exit(0)
}

func helpShowTopics(namespace *Namespace) {
	Printf("Usage: %s COMMAND [command-specific-options]\n\n", BASE_CMD_NAME)
	Printf("Help topics, type \"%s help TOPIC\" for more details:\n\n", BASE_CMD_NAME)

	topics := AllTopics().NonHidden()

	if namespace != nil {
		topics = topics.Namespace(namespace.Name)
	}

	longestTopic := 0
	for _, topic := range topics {
		if len(topic.String()) > longestTopic {
			longestTopic = len(topic.String())
		}
	}
	for _, topic := range topics {
		Printf("  %s %-"+strconv.Itoa(longestTopic+1)+"s# %s\n", BASE_CMD_NAME, topic.String(), topic.Description)
	}
	Println()
	Exit(0)
}

func helpShowTopic(namespace *Namespace, topic *Topic) {
	Printf("Usage: %s %s:COMMAND [command-specific-options]\n\n", BASE_CMD_NAME, topic.String())
	printTopicCommandsHelp(namespace, topic)
	Println()
	Exit(0)
}

func helpShowCommand(namespace *Namespace, topic *Topic, command *Command) {
	Printf("Usage: %s %s\n\n", BASE_CMD_NAME, CommandUsage(command))
	Println(command.buildFullHelp())
	if command.Command == "" {
		printTopicCommandsHelp(namespace, topic)
	}
	Println()
	Exit(0)
}

func printTopicCommandsHelp(namespace *Namespace, topic *Topic) {
	commands := AllCommands().NonHidden()

	if namespace != nil {
		commands = commands.Namespace(namespace.Name)
	}
	topicCommands := Commands{}
	for _, cur := range commands {
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
