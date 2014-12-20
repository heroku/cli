package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"

	"github.com/dickeyxxx/gode"
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
	Name:      "plugins",
	ShortHelp: "manage plugins",
	Help: `Manage the Heroku CLI Plugins

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-check`,
}

var pluginsInstallCmd = &Command{
	Topic:     "plugins",
	Command:   "install",
	Args:      []Arg{{Name: "name"}},
	ShortHelp: "Installs a plugin into the CLI",
	Help: `Install a Heroku plugin

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-status`,

	Run: func(ctx *Context) {
		name := ctx.Args["name"]
		Errf("Installing plugin %s... ", name)
		must(node.InstallPackage(name))
		Errln("done")
	},
}

var pluginsListCmd = &Command{
	Topic:     "plugins",
	ShortHelp: "Lists the installed plugins",
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
		cmd.Stderr = Stderr
		must(cmd.Run())
	}
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
		command.Run = runFn(name, command.Topic, command.Command)
	}
	return &plugin
}

// GetPlugins goes through all the node plugins and returns them in Go stucts
func GetPlugins() []Plugin {
	names := PluginNames()
	plugins := make([]Plugin, 0, len(names))
	for _, name := range names {
		plugins = append(plugins, *getPlugin(name))
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
