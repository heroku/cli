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

// GoFlagInitState is the default value for unset flags
const GoFlagInitState = "unset"

// CliToken is the token that tells us this is called from a different binary
var CliToken = GoFlagInitState

// AliasName is the alias of the different binary
var AliasName = GoFlagInitState

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
	Args = removeCliTokenAndUpdateDefaultNamespace(args)

	ShowDebugInfo()

	if len(Args) <= 1 {
		// Heroku shows a dashboard, but to do that for sfdx an entirly new
		// plugin would need to be created and auto installed to utilize a
		// dashboard. For now, just show help. Should be removed eventually.
		if getDefaultNamespace() == HerokuNamespace.Name {
			// show dashboard if no args passed
			Args = append(Args, "dashboard")
		} else {
			Args = append(Args, "--help")
		}
	} else if len(Args) == 2 && getDefaultNamespace() != HerokuNamespace.Name && Args[1] == HerokuNamespace.Name {
		// Since dashboard is not the default command for the heroku namespace, there is no way
		// to find that command without changing the default namespace since the next thing after
		// "sfdx heroku" needs to be a topic, not a command.
		DefaultNamespace = HerokuNamespace.Name
		Args[1] = "dashboard"
	}

	switch Args[1] {
	case "_":
		guess := loadLastCommandGuess()
		if guess != nil {
			Args = append([]string{Args[0], guess.Guess}, guess.Args...)
		}
	case "help", "--help", "-h":
		if len(Args) >= 3 {
			namespace, _, _ := parseCmdString(Args[2])
			installRequiredNamespace(namespace)
		}
		help()
		return
	case "version", "--version", "-v":
		ShowVersion()
		return
	}

	namespace, _, _ := parseCmdString(Args[1])

	installRequiredNamespace(namespace)

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

func installRequiredNamespace(namespace *Namespace) {
	if namespace == nil {
		return
	}

	requiredPluginsMap := map[string][]string{
		"force": {"salesforcedx"},
	}

	/**
	Iterator over all installed user plugins to see if one has a namespace that is required.
	If so remove it from the requiredPluginsMap
	*/
	for _, plugin := range UserPlugins.Plugins() {
		if plugin != nil && plugin.Namespace != nil {
			_, isAlreadyInstalledRequiredNamespace := requiredPluginsMap[plugin.Namespace.Name]
			if isAlreadyInstalledRequiredNamespace {
				delete(requiredPluginsMap, plugin.Namespace.Name)
			}
		}
	}

	namespaceName := namespace.Name

	plugins, ok := requiredPluginsMap[namespaceName]

	if ok {
		toInstall := []string{}

		for _, plugin := range plugins {
			name := strings.Split(plugin, "@")[0]
			if UserPlugins.ByName(name) == nil {
				toInstall = append(toInstall, plugin)
			}
		}
		if len(toInstall) > 0 {
			Printf("Installing required plugins for %s...", namespaceName)
			UserPlugins.InstallPlugins(toInstall...)
			Printf(" done")
			Println()
			Println()
		}
	}
}

func removeCliTokenAndUpdateDefaultNamespace(args []string) []string {
	// Golang flags are set after variable initialzation, so Namespace
	// is still "unset". Namespace should always be defaulted to the BinaryName unless
	// the CliToken is specified to set the Namespace to the AliasName.
	DefaultNamespace = BinaryName

	newArray := []string{}

	for i := 0; i < len(args); i++ {
		if args[i] == CliToken {
			DefaultNamespace = AliasName
			Debugf("Alias moving default namespace to %s\n", DefaultNamespace)
		} else {
			newArray = append(newArray, args[i])
		}
	}
	return newArray
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

// ShowDebugInfo prints debugging information if HEROKU_DEBUG=1
// Can't run unit tests with this enabled. Tests fail.
func ShowDebugInfo() {
	info := []string{version(), BinPath}
	if len(Args) > 1 {
		info = append(info, fmt.Sprintf("cmd: %s", Args[1]))
	}
	Debugln(strings.Join(info, " "))
}
