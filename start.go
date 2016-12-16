package main

import (
	"fmt"
	"strings"
)

// Version is the version of the cli.
// This is set by a build flag in the `Rakefile`.
var Version = "dev"

// GitSHA is the git sha of the build
// This is set by a build flag in the `Rakefile`.
var GitSHA = ""

// Channel is the git branch the code was compiled on.
// This is set by a build flag in the `Rakefile` based on the git branch.
var Channel = "?"

// CLITopics are all the command topics
// This list is all the Go topics, the Node topics are filled in later
var CLITopics Topics

// Args is os.Args
var Args []string

const GO_FLAG_INIT_STATE = "unset"

// Go flag
var CliToken = GO_FLAG_INIT_STATE

// Go flag to capture the alias name
var AliasName = GO_FLAG_INIT_STATE

// Go flag to capture the binary name
var BinaryName = GO_FLAG_INIT_STATE

// Go flag to capture the folder name
var FolderName = GO_FLAG_INIT_STATE

// The default namespace for this instance of the cli. Defaults to the binary name for the alias.
var DefaultNamespace = BinaryName

// Start the CLI
func Start(args ...string) {
	Args = removeCliTokenAndUpdateDefaultNamespace(args)
	loadNewCLI()

	// Printf("**  %s  ** \n\n", Args[0])
	// cmdPath := strings.Split(Args[0], "/")
	// BASE_CMD_NAME = cmdPath[len(cmdPath)-1]
	ShowDebugInfo()

	if len(Args) <= 1 {
		// show dashboard if no args passed
		Args = append(Args, "dashboard")
	}

	switch Args[1] {
	case "_":
		guess := loadLastCommandGuess()
		if guess != nil {
			Args = append([]string{Args[0], guess.Guess}, guess.Args...)
		}
	case "help", "--help", "-h":
		help()
		return
	case "version", "--version", "-v":
		ShowVersion()
		return
	}

	for _, arg := range Args {
		if arg == "--help" || arg == "-h" {
			help()
			return
		}
	}

	cmd := AllCommands().Find(Args[1])

	if cmd == nil {
		helpInvalidCommand()
		return
	}
	if !cmd.DisableAnalytics {
		currentAnalyticsCommand.RecordStart()
	}
	ctx, err := BuildContext(cmd, Args)
	must(err)
	cmd.Run(ctx)
}

func removeCliTokenAndUpdateDefaultNamespace(args []string) []string {

	newArray := []string{}

	for i := 0; i < len(args); i++ {
		if args[i] == CliToken {
			fmt.Println(fmt.Sprintf("CliToken: %s", CliToken))
			DefaultNamespace = AliasName
		} else {
			newArray = append(newArray, args[i])
		}
	}

	return newArray
}

func getExecutableName() string {
	if DefaultNamespace == GO_FLAG_INIT_STATE {
		return BinaryName;
	}

	return DefaultNamespace;
}

var crashing = false

// ShowDebugInfo prints debugging information if HEROKU_DEBUG=1
func ShowDebugInfo() {
	info := []string{version(), BinPath}
	if len(Args) > 1 {
		info = append(info, fmt.Sprintf("cmd: %s", Args[1]))
	}
	Debugln(strings.Join(info, " "))
}
