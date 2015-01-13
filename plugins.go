package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"

	"github.com/dickeyxxx/gode"
	"github.com/stvp/rollbar"
)

// Plugin represents a javascript plugin
type Plugin struct {
	Topics   TopicSet   `json:"topics"`
	Commands CommandSet `json:"commands"`
}

var node = gode.NewClient(AppDir)

// SetupNode sets up node and npm in ~/.heroku
func SetupNode() {
	node.Registry = "http://54.173.158.18"
	node.NpmVersion = "2.1.8"
	if !node.IsSetup() {
		Log("setting up plugins... ")
		must(node.Setup())
		Logln("done")
	}
}

// LoadPlugins loads the topics and commands from the JavaScript plugins into the CLI
func (cli *Cli) LoadPlugins(plugins []Plugin) {
	for _, plugin := range plugins {
		for _, topic := range plugin.Topics {
			cli.AddTopic(topic)
		}
		for _, command := range plugin.Commands {
			if !cli.AddCommand(command) {
				Errln("WARNING: command %s has already been defined", command)
			}
		}
	}
}

var pluginsTopic = &Topic{
	Name:        "plugins",
	Description: "manage plugins",
}

var pluginsInstallCmd = &Command{
	Topic:       "plugins",
	Command:     "install",
	Args:        []Arg{{Name: "name"}},
	Description: "Installs a plugin into the CLI",
	Help: `Install a Heroku plugin

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-status`,

	Run: func(ctx *Context) {
		name := ctx.Args["name"]
		Errf("Installing plugin %s... ", name)
		must(node.InstallPackage(name))
		plugin := getPlugin(name)
		if plugin == nil || len(plugin.Commands) == 0 {
			Err("This does not appear to be a Heroku plugin, uninstalling... ")
			must(node.RemovePackage(name))
		}
		Errln("done")
	},
}

var pluginsListCmd = &Command{
	Topic:       "plugins",
	Description: "Lists the installed plugins",
	Help: `Lists installed plugins

  Example:
  $ heroku plugins`,

	Run: func(ctx *Context) {
		packages, err := node.Packages()
		must(err)
		for _, pkg := range packages {
			Println(pkg.Name, pkg.Version)
		}
	},
}

func runFn(module, topic, command string) func(ctx *Context) {
	return func(ctx *Context) {
		ctxJSON, err := json.Marshal(ctx)
		must(err)
		script := fmt.Sprintf(`
		require('%s')
		.commands.filter(function (command) {
			return command.topic == '%s' && command.command == '%s'
		})[0]
		.run(%s)`, module, topic, command, ctxJSON)

		cmd := node.RunScript(script)
		cmd.Stdout = Stdout
		r, w, _ := os.Pipe()
		cmd.Stderr = w
		stderr := captureText(r)
		if err := cmd.Run(); err != nil {
			Errf("Error in %s\n", ctx.Command.Plugin)
			if Channel != "?" {
				nodeErr := fmt.Errorf("%s %s\n%s", ctx.Command.Plugin, ctx.Command, stderr.String())
				rollbar.ErrorWithStack(rollbar.ERR, nodeErr, rollbar.Stack{})
				rollbar.Wait()
			}
			// Exit with the same exit code
			Exit(getExitCode(err))
		}
	}
}

func captureText(r io.Reader) *bytes.Buffer {
	var b bytes.Buffer
	go func() {
		scanner := bufio.NewScanner(r)
		for scanner.Scan() {
			b.WriteString(scanner.Text() + "\n")
			Errln(scanner.Text())
		}
	}()
	return &b
}

func getExitCode(err error) int {
	exitErr, ok := err.(*exec.ExitError)
	if !ok {
		panic(err)
	}
	status, ok := exitErr.Sys().(syscall.WaitStatus)
	if !ok {
		panic(err)
	}
	return status.ExitStatus()
}

func getPlugin(name string) *Plugin {
	script := `console.log(JSON.stringify(require('` + name + `')))`
	cmd := node.RunScript(script)
	cmd.Stderr = Stderr
	output, err := cmd.StdoutPipe()
	must(err)
	must(cmd.Start())
	var plugin Plugin
	err = json.NewDecoder(output).Decode(&plugin)
	if err != nil {
		Errln("Error reading plugin:", name)
		return nil
	}
	must(cmd.Wait())
	for _, command := range plugin.Commands {
		command.Plugin = name
		command.Run = runFn(name, command.Topic, command.Command)
	}
	return &plugin
}

// GetPlugins goes through all the node plugins and returns them in Go stucts
func GetPlugins() []Plugin {
	names := PluginNames()
	plugins := make([]Plugin, 0, len(names))
	for _, name := range names {
		plugin := getPlugin(name)
		if plugin != nil {
			plugins = append(plugins, *plugin)
		}
	}
	return plugins
}

// PluginNames just lists the files in ~/.heroku/node_modules
func PluginNames() []string {
	files, _ := ioutil.ReadDir(filepath.Join(AppDir, "node_modules"))
	names := make([]string, 0, len(files))
	for _, f := range files {
		names = append(names, f.Name())
	}
	return names
}
