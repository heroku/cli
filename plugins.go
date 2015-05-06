package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/dickeyxxx/gode"
	"github.com/dickeyxxx/golock"
)

// Plugin represents a javascript plugin
type Plugin struct {
	Topics   TopicSet   `json:"topics"`
	Commands CommandSet `json:"commands"`
}

var node = gode.NewClient(AppDir)

func init() {
	node.Registry = "https://d3nfsbmspisrno.cloudfront.net"
	node.NodeVersion = "2.0.0"
	node.NpmVersion = "2.9.0"
}

// SetupNode sets up node and npm in ~/.heroku
func SetupNode() {
	if !node.IsSetup() {
		if err := golock.Lock(updateLockPath); err != nil {
			panic(err)
		}
		defer golock.Unlock(updateLockPath)
		Log("setting up plugins... ")
		if err := node.Setup(); err != nil {
			panic(err)
		}
		clearOldNodeInstalls()
		Logln("done")
	}
}

func clearOldNodeInstalls() {
	files, _ := ioutil.ReadDir(AppDir)
	for _, f := range files {
		name := f.Name()
		if name != node.NodeBase() && strings.HasPrefix(name, "iojs-v") {
			os.RemoveAll(filepath.Join(AppDir, name))
		}
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
				Errf("WARNING: command %s has already been defined\n", command)
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
		name := ctx.Args.(map[string]string)["name"]
		if len(name) == 0 {
			Errln("Must specify a plugin name")
			return
		}
		Errf("Installing plugin %s... ", name)
		if err := node.InstallPackage(name); err != nil {
			panic(err)
		}
		plugin := getPlugin(name)
		if plugin == nil || len(plugin.Commands) == 0 {
			Err("This does not appear to be a Heroku plugin, uninstalling... ")
			if err := (node.RemovePackage(name)); err != nil {
				panic(err)
			}
		}
		Errln("done")
	},
}

var pluginsLinkCmd = &Command{
	Topic:       "plugins",
	Command:     "link",
	Description: "Links a local plugin into CLI",
	Args:        []Arg{{Name: "path", Optional: true}},
	Help: `Links a local plugin into CLI.
	This is useful when developing plugins locally.
	It simply symlinks the specified path into ~/.heroku/node_modules

  Example:
	$ heroku plugins:link .`,

	Run: func(ctx *Context) {
		path := ctx.Args.(map[string]string)["path"]
		if path == "" {
			path = "."
		}
		path, err := filepath.Abs(path)
		if err != nil {
			panic(err)
		}
		if _, err := os.Stat(path); err != nil {
			panic(err)
		}
		name := filepath.Base(path)
		newPath := filepath.Join(ctx.HerokuDir, "node_modules", name)
		os.Remove(newPath)
		os.RemoveAll(newPath)
		err = os.Symlink(path, newPath)
		if err != nil {
			panic(err)
		}
		plugin := getPlugin(name)
		if plugin == nil || len(plugin.Commands) == 0 {
			Errln(name + " does not appear to be a Heroku plugin")
			if err := os.Remove(newPath); err != nil {
				panic(err)
			}
		}
	},
}

var pluginsUninstallCmd = &Command{
	Topic:       "plugins",
	Command:     "uninstall",
	Args:        []Arg{{Name: "name"}},
	Description: "Uninstalls a plugin from the CLI",
	Help: `Uninstalls a Heroku plugin

  Example:
  $ heroku plugins:uninstall heroku-production-status`,

	Run: func(ctx *Context) {
		name := ctx.Args.(map[string]string)["name"]
		Errf("Uninstalling plugin %s... ", name)
		if err := node.RemovePackage(name); err != nil {
			panic(err)
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
		if err != nil {
			panic(err)
		}
		for _, pkg := range packages {
			Println(pkg.Name, pkg.Version)
		}
	},
}

func runFn(module, topic, command string) func(ctx *Context) {
	return func(ctx *Context) {
		ctxJSON, err := json.Marshal(ctx)
		if err != nil {
			panic(err)
		}
		script := fmt.Sprintf(`
		var topic = '%s';
		var command = '%s';
		if (command === '') { command = null }
		require('%s')
		.commands.filter(function (c) {
			return c.topic === topic && c.command == command;
		})[0]
		.run(%s)`, topic, command, module, ctxJSON)

		// swallow sigint since the plugin will handle it
		swallowSignal(os.Interrupt)

		cmd := node.RunScript(script)
		cmd.Stdout = Stdout
		cmd.Stdin = os.Stdin
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			Exit(getExitCode(err))
		}
	}
}

func swallowSignal(s os.Signal) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, s)
	go func() {
		<-c
	}()
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
	if err != nil {
		panic(err)
	}
	if err := cmd.Start(); err != nil {
		panic(err)
	}
	buf := new(bytes.Buffer)
	buf.ReadFrom(output)
	s := buf.String()
	var plugin Plugin
	err = json.Unmarshal(buf.Bytes(), &plugin)
	if err != nil {
		Errf("Error reading plugin: %s. See %s for more information.\n", name, ErrLogPath)
		Logln(err, "\n", s)
		return nil
	}
	if err := cmd.Wait(); err != nil {
		panic(err)
	}
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
