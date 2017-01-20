package main

import (
	"errors"
	"os"
	"strings"
)

// Context is a struct that is passed to a Command's Run function.
// It contains information about the user's command arguments
// as well as Heroku information like the auth token and app name (if requested).
type Context struct {
	Topic         *Topic                 `json:"topic"`
	Command       *Command               `json:"command"`
	App           string                 `json:"app"`
	Org           string                 `json:"org,omitempty"`
	Args          interface{}            `json:"args"`
	Flags         map[string]interface{} `json:"flags"`
	Cwd           string                 `json:"cwd"`
	HerokuDir     string                 `json:"herokuDir"`
	Debug         bool                   `json:"debug"`
	DebugHeaders  bool                   `json:"debugHeaders"`
	Dev           bool                   `json:"dev"`
	SupportsColor bool                   `json:"supportsColor"`
	Version       string                 `json:"version"`
	APIToken      string                 `json:"apiToken"`
	APIHost       string                 `json:"apiHost"` // deprecated in favor of apiUrl
	APIURL        string                 `json:"apiUrl"`
	GitHost       string                 `json:"gitHost"`
	HTTPGitHost   string                 `json:"httpGitHost"`
	Auth          struct {
		Password string `json:"password"`
	} `json:"auth"`
}

var errHelp = errors.New(HELP)

// BuildContext builds a context object based on a command and args
func BuildContext(command *Command, args []string) (*Context, error) {
	var err error
	if command == nil {
		return nil, errHelp
	}
	ctx := &Context{}
	ctx.Command = command
	if ctx.Command.VariableArgs {
		ctx.Args, ctx.Flags, err = parseVarArgs(ctx.Command, args[2:])
	} else {
		ctx.Args, ctx.Flags, err = parseArgs(ctx.Command, args[2:])
	}
	if err != nil {
		return nil, err
	}
	if ctx.Command.NeedsApp || ctx.Command.WantsApp {
		var err error
		ctx.App, err = app(ctx.Flags)
		if err != nil && ctx.Command.NeedsApp {
			ExitWithMessage(err.Error())
		}
		if ctx.App == "" && ctx.Command.NeedsApp {
			ctx.Command.appNeededErr()
		}
	}
	if ctx.Command.NeedsOrg || ctx.Command.WantsOrg {
		if org, ok := ctx.Flags["org"].(string); ok {
			ctx.Org = org
		} else {
			ctx.Org = os.Getenv("HEROKU_ORGANIZATION")
		}
		if ctx.Org == "" && ctx.Command.NeedsOrg {
			ExitWithMessage("No org specified.\nRun this command with --org or by setting HEROKU_ORGANIZATION")
		}
	}
	if ctx.Command.NeedsAuth {
		ctx.APIToken = auth()
		ctx.Auth.Password = ctx.APIToken
	}
	ctx.Cwd, _ = os.Getwd()
	ctx.HerokuDir = CacheHome
	ctx.Debug = Debugging
	ctx.DebugHeaders = DebuggingHeaders
	ctx.Version = version()
	ctx.SupportsColor = supportsColor()
	ctx.APIHost = apiHost()
	ctx.APIURL = apiURL()
	ctx.GitHost = gitHost()
	ctx.HTTPGitHost = httpGitHost()
	return ctx, nil
}

func parseVarArgs(command *Command, args []string) (result []string, flags map[string]interface{}, err error) {
	result = make([]string, 0, len(args))
	flags = map[string]interface{}{}
	parseFlags := true
	possibleFlags := []*Flag{}
	populateFlagsFromEnvVars(command.Flags, flags)
	for _, flag := range command.Flags {
		f := flag
		possibleFlags = append(possibleFlags, &f)
	}
	if command.NeedsApp || command.WantsApp {
		possibleFlags = append(possibleFlags, AppFlag, RemoteFlag)
	}
	if command.NeedsOrg || command.WantsOrg {
		possibleFlags = append(possibleFlags, OrgFlag)
	}
	warnAboutDuplicateFlags(possibleFlags)
	for i := 0; i < len(args); i++ {
		switch {
		case parseFlags && (args[i] == "--"):
			parseFlags = false
		case parseFlags && (args[i] == "--help" || args[i] == "-h"):
			return nil, nil, errHelp
		case parseFlags && (args[i] == "--no-color"):
			continue
		case parseFlags && strings.HasPrefix(args[i], "-"):
			flag, val, err := ParseFlag(args[i], possibleFlags)
			if err != nil && strings.HasSuffix(err.Error(), "needs a value") {
				i++
				if len(args) == i {
					ExitWithMessage(err.Error())
				}
				flag, val, err = ParseFlag(args[i-1]+"="+args[i], possibleFlags)
			}
			if flag != nil {
				if flag.HasValue {
					flags[flag.Name] = val
				} else {
					flags[flag.Name] = true
				}
			}
			switch {
			case err != nil:
				ExitWithMessage(err.Error())
			case flag == nil && command.VariableArgs:
				result = append(result, args[i])
			case flag == nil:
				command.unexpectedFlagErr(args[i])
			}
		default:
			result = append(result, args[i])
		}
	}
	for _, flag := range command.Flags {
		if flag.Required && flags[flag.Name] == nil {
			ExitWithMessage("Required flag: %s", flag.String())
		}
	}
	return result, flags, nil
}

func parseArgs(command *Command, args []string) (result map[string]string, flags map[string]interface{}, err error) {
	result = map[string]string{}
	args, flags, err = parseVarArgs(command, args)
	if err != nil {
		return nil, nil, err
	}
	if len(args) > len(command.Args) {
		command.unexpectedArgumentsErr(args[len(command.Args):])
	}
	for i, arg := range args {
		result[command.Args[i].Name] = arg
	}
	for _, arg := range command.Args {
		if !arg.Optional && result[arg.Name] == "" {
			ExitWithMessage("Missing argument: %s", strings.ToUpper(arg.Name))
		}
	}
	return result, flags, nil
}

func app(flags map[string]interface{}) (string, error) {
	if flags["app"] != nil {
		return flags["app"].(string), nil
	}
	if flags["remote"] != nil {
		app, err := appFromGitRemote(flags["remote"].(string))
		if err != nil {
			return "", err
		}
		return app, nil
	}
	if flags["confirm"] != nil {
		return flags["confirm"].(string), nil
	}
	app := os.Getenv("HEROKU_APP")
	if app != "" {
		return app, nil
	}
	return appFromGitRemote(remoteFromGitConfig())
}

func populateFlagsFromEnvVars(flagDefinitons []Flag, flags map[string]interface{}) {
	for _, flag := range flagDefinitons {
		if strings.ToLower(flag.Name) == "user" && os.Getenv("HEROKU_USER") != "" {
			flags[flag.Name] = os.Getenv("HEROKU_USER")
		}
		if strings.ToLower(flag.Name) == "force" && os.Getenv("HEROKU_FORCE") == "1" {
			flags[flag.Name] = true
		}
	}
}

func warnAboutDuplicateFlags(flags []*Flag) {
	for _, a := range flags {
		for _, b := range flags {
			if a == b {
				continue
			}
			if (a.Char != "" && a.Char == b.Char) ||
				(a.Name != "" && a.Name == b.Name) {
				Errf("Flag conflict: %s conflicts with %s\n", a, b)
			}
		}
	}
}
