package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"

	"github.com/dickeyxxx/gode"
	"github.com/dickeyxxx/golock"
)

// Plugin represents a javascript plugin
type Plugin struct {
	Name     string     `json:"name"`
	Topics   TopicSet   `json:"topics"`
	Commands CommandSet `json:"commands"`
}

var node = gode.NewClient(AppDir)

func init() {
	node.Registry = "https://d3nfsbmspisrno.cloudfront.net"
	node.NodeVersion = "2.0.1"
	node.NpmVersion = "2.9.0"
}

// SetupNode sets up node and npm in ~/.heroku
func SetupNode() {
	if !node.IsSetup() {
		golock.Lock(updateLockPath)
		defer golock.Unlock(updateLockPath)
		if node.IsSetup() {
			return
		}
		Debugln("setting up iojs", node.NodeVersion)
		ExitIfError(node.Setup())
		clearOldNodeInstalls()
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
	Hidden:      true,
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
		err := node.InstallPackage(name)
		ExitIfError(err)
		plugin := getPlugin(name, false)
		if plugin == nil || len(plugin.Commands) == 0 {
			Err("\nThis does not appear to be a Heroku plugin, uninstalling... ")
			ExitIfError(node.RemovePackage(name))
		}
		ClearPluginCache()
		WritePluginCache(GetPlugins())
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
		plugin := getPlugin(name, false)
		if plugin == nil || len(plugin.Commands) == 0 {
			Errln(name + " does not appear to be a Heroku plugin")
			if err := os.Remove(newPath); err != nil {
				panic(err)
			}
		}
		if name != plugin.Name {
			path = newPath
			newPath = filepath.Join(ctx.HerokuDir, "node_modules", plugin.Name)
			os.Remove(newPath)
			os.RemoveAll(newPath)
			os.Rename(path, newPath)
		}
		Println("symlinked", plugin.Name)
		Err("Updating plugin cache... ")
		ClearPluginCache()
		WritePluginCache(GetPlugins())
		Errln("done")
	},
}

var pluginsUninstallCmd = &Command{
	Topic:       "plugins",
	Command:     "uninstall",
	Hidden:      true,
	Args:        []Arg{{Name: "name"}},
	Description: "Uninstalls a plugin from the CLI",
	Help: `Uninstalls a Heroku plugin

  Example:
  $ heroku plugins:uninstall heroku-production-status`,

	Run: func(ctx *Context) {
		name := ctx.Args.(map[string]string)["name"]
		Errf("Uninstalling plugin %s... ", name)
		err := node.RemovePackage(name)
		ExitIfError(err)
		Errln("done")
	},
}

var pluginsListCmd = &Command{
	Topic:       "plugins",
	Hidden:      true,
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
		lockfile := updateLockPath + "." + module
		golock.Lock(lockfile)
		golock.Unlock(lockfile)
		ctx.Version = ctx.Version + " " + module + " iojs-v" + node.NodeVersion
		ctxJSON, err := json.Marshal(ctx)
		if err != nil {
			panic(err)
		}
		script := fmt.Sprintf(`
		'use strict';
		var moduleName = '%s';
		var module = require(moduleName);
		var topic = '%s';
		var command = '%s';
		var ctx = %s;
		var logPath = %s;
		process.chdir(ctx.cwd);
		process.on('uncaughtException', function (err) {
			console.error(' !   Error in ' + moduleName + ':')
			if (err.message) {
				console.error(' !   ' + err.message);
			} else {
				console.error(' !   ' + err);
			}
			if (err.stack) {
				var fs = require('fs');
				var log = function (line) {
					var d = new Date().toISOString()
					.replace(/T/, ' ')
					.replace(/-/g, '/')
					.replace(/\..+/, '');
					fs.appendFileSync(logPath, d + ' ' + line + '\n');
				}
				log('Error during ' + topic + ':' + command);
				log(err.stack);
				console.error(' !   See ' + logPath + ' for more info.');
			}
			process.exit(1);
		});
		if (command === '') { command = null }
		var cmd = module.commands.filter(function (c) {
			return c.topic === topic && c.command == command;
		})[0];
		cmd.run(ctx);`, module, topic, command, ctxJSON, strconv.Quote(ErrLogPath))

		// swallow sigint since the plugin will handle it
		swallowSignal(os.Interrupt)

		cmd := node.RunScript(script)
		if ctx.Flags["debugger"] == true {
			cmd = node.DebugScript(script)
		}
		os.Chdir(cmd.Dir)
		execBin(cmd.Path, cmd.Args)
	}
}

func execBin(bin string, args []string) {
	if runtime.GOOS == "windows" {
		cmd := exec.Command(bin, args[1:]...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			os.Exit(getExitCode(err))
		}
	} else {
		if err := syscall.Exec(bin, args, os.Environ()); err != nil {
			panic(err)
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
	switch e := err.(type) {
	case *exec.ExitError:
		status, ok := e.Sys().(syscall.WaitStatus)
		if !ok {
			panic(err)
		}
		return status.ExitStatus()
	default:
		panic(err)
	}
}

func getPlugin(name string, attemptReinstall bool) *Plugin {
	script := `
	var plugin = require('` + name + `');
	plugin.name = require('` + name + `/package.json').name;
	console.log(JSON.stringify(plugin))`
	cmd := node.RunScript(script)
	output, err := cmd.CombinedOutput()
	if err != nil {
		if attemptReinstall && strings.Contains(string(output), "Error: Cannot find module") {
			Errf("Error reading plugin %s. Reinstalling... ", name)
			if err := node.InstallPackage(name); err != nil {
				panic(errors.New(string(output)))
			}
			Errln("done")
			return getPlugin(name, false)
		}
		Errf("Error reading plugin: %s. See %s for more information.\n", name, ErrLogPath)
		Logln(err, "\n", string(output))
		return nil
	}
	var plugin Plugin
	json.Unmarshal([]byte(output), &plugin)
	return &plugin
}

// GetPlugins goes through all the node plugins and returns them in Go stucts
func GetPlugins() []Plugin {
	cache := FetchPluginCache()
	names := PluginNames()
	plugins := make([]Plugin, 0, len(names))
	for _, name := range names {
		plugin := cache[name]
		if plugin == nil {
			plugin = getPlugin(name, true)
		}
		if plugin != nil {
			for _, command := range plugin.Commands {
				command.Plugin = name
				command.Run = runFn(name, command.Topic, command.Command)
			}
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
		if !ignorePlugin(f.Name()) {
			names = append(names, f.Name())
		}
	}
	return names
}

func ignorePlugin(plugin string) bool {
	ignored := []string{".bin", "node-inspector"}
	for _, p := range ignored {
		if plugin == p {
			return true
		}
	}
	return false
}
