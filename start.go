package main

import (
	"os"
	"runtime"
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

// GoFlagInitState is the default value for unset flags
const GoFlagInitState = "unset"

// BinaryName is the binary name
var BinaryName = GoFlagInitState

// FolderName is the folder to look for plugins
var FolderName = GoFlagInitState

// DefaultNamespace is The default namespace for this instance of the cli. Defaults to the binary name for the alias.
var DefaultNamespace = BinaryName

// Start the CLI
func Start(args ...string) {
	Args = args
	loadNewCLI()

	if strings.Contains(Args[1], "build:") {
		cmd := AllCommands().Find(Args[1])

		if cmd == nil {
			return
		}
		ctx, err := BuildContext(cmd, Args)
		must(err)
		cmd.Run(ctx)
		return
	}

	Println("This pilot version (5.6.x) of the Salesforce DX CLI is deprecated and must be uninstalled, then the GA version must be installed.")
	Println("")
	Println("To uninstall:")
	if runtime.GOOS == "windows" {
		Println("\t1: Select Start > Control Panel > Programs > Programs and Features.")
		Println("\t2: Select SFDX CLI, and click Uninstall.")
		Println("\t3: Inside your home directory, delete the .config\\sfdx directory.")
	} else {
		Println("Run https://gist.github.com/dcarroll/7d7a4b97a0d77f26c9f6fc6d73b689a6 as the system administrator (using sudo).")
		Println("NOTE: The pilot version included the Heroku CLI. Running the script will blow away ALL Heroku folders and configurations.")
	}
	Println("")
	Println("To reinstall:")
	Println("Go to https://developer.salesforce.com/tools/sfdxcli")
	ShowCursor()
	os.Exit(1)
}

// The executable name is always the namespace
func getExecutableName() string {
	defaultNs := getDefaultNamespace()

	// This should be set on initialzation, but return the binary name if it is not.
	if defaultNs == GoFlagInitState {
		return BinaryName
	}

	return defaultNs
}

func getFolderName() string {
	return FolderName
}

func getDefaultNamespace() string {
	return DefaultNamespace
}

var crashing = false
