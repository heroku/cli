package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"syscall"

	"github.com/dickeyxxx/golock"
	"github.com/heroku/heroku-cli/gode"
)

// Plugin represents a javascript plugin
type Plugin struct {
	Name     string     `json:"name"`
	Version  string     `json:"version"`
	Topics   TopicSet   `json:"topics"`
	Topic    *Topic     `json:"topic"`
	Commands CommandSet `json:"commands"`
}

// SetupNode sets up node and npm in ~/.heroku
func SetupNode() {
	gode.SetRootPath(AppDir())
	setup, err := gode.IsSetup()
	PrintError(err)
	if !setup {
		setupNode()
	}
}

func setupNode() {
	Err("heroku-cli: Adding dependencies...")
	PrintError(gode.Setup())
	Errln(" done")
}

func updateNode() {
	gode.SetRootPath(AppDir())
	needsUpdate, err := gode.NeedsUpdate()
	PrintError(err)
	if needsUpdate {
		setupNode()
	}
}

// LoadPlugins loads the topics and commands from the JavaScript plugins into the CLI
func (cli *Cli) LoadPlugins(plugins map[string]*Plugin) {
	for _, plugin := range plugins {
		for _, topic := range plugin.Topics {
			cli.AddTopic(topic)
		}
		if plugin.Topic != nil {
			cli.AddTopic(plugin.Topic)
		}
		for _, command := range plugin.Commands {
			if !cli.AddCommand(command) {
				Errf("WARNING: command %s has already been defined\n", command)
			}
		}
	}
	sort.Sort(cli.Topics)
	sort.Sort(cli.Commands)
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
		err := installPlugins(name)
		ExitIfError(err)
		plugin := getPlugin(name, true)
		if plugin == nil || len(plugin.Commands) == 0 {
			Err("\nThis does not appear to be a Heroku plugin, uninstalling... ")
			ExitIfError(gode.RemovePackage(name))
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
		plugin := getPlugin(name, false)
		if plugin == nil || len(plugin.Commands) == 0 {
			Errln(name + " does not appear to be a Heroku plugin.\nDid you run " + cyan("npm install") + "?")
			if err := os.Remove(newPath); err != nil {
				panic(err)
			}
			return
		}
		if name != plugin.Name {
			path = newPath
			newPath = filepath.Join(ctx.HerokuDir, "node_modules", plugin.Name)
			os.Remove(newPath)
			os.RemoveAll(newPath)
			os.Rename(path, newPath)
		}
		Println("Symlinked", plugin.Name)
		AddPluginsToCache(plugin)
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
		err := gode.RemovePackage(name)
		ExitIfError(err)
		Errln("done")
	},
}

var pluginsListCmd = &Command{
	Topic:       "plugins",
	Hidden:      true,
	Description: "Lists installed plugins",
	Help: `
Example:
  $ heroku plugins`,

	Run: func(ctx *Context) {
		for _, plugin := range GetPlugins() {
			if plugin != nil && len(plugin.Commands) > 0 {
				symlinked := ""
				if isPluginSymlinked(plugin.Name) {
					symlinked = " (symlinked)"
				}
				Println(plugin.Name, plugin.Version, symlinked)
			}
		}
	},
}

func runFn(plugin *Plugin, topic, command string) func(ctx *Context) {
	return func(ctx *Context) {
		lockfile := updateLockPath + "." + plugin.Name
		if exists, _ := fileExists(lockfile); exists {
			golock.Lock(lockfile)
			golock.Unlock(lockfile)
		}
		checkIfPluginIsInstalled(plugin.Name)
		ctx.Dev = isPluginSymlinked(plugin.Name)
		ctxJSON, err := json.Marshal(ctx)
		if err != nil {
			panic(err)
		}
		title, _ := json.Marshal(processTitle(ctx))
		script := fmt.Sprintf(`
		'use strict';
		var moduleName = '%s';
		var moduleVersion = '%s';
		var topic = '%s';
		var command = '%s';
		process.title = %s;
		var ctx = %s;
		ctx.version = ctx.version + ' ' + moduleName + '/' + moduleVersion + ' node-' + process.version;
		var logPath = %s;
		process.chdir(ctx.cwd);
		function repair (name) {
			console.error('Attempting to repair ' + name + '...');
			require('child_process')
			.spawnSync('heroku', ['plugins:install', name],
			{stdio: [0,1,2]});
			console.error('Repair complete. Try running your command again.');
		}
		if (!ctx.dev) {
			process.on('uncaughtException', function (err) {
				console.error(' !   Error in ' + moduleName + ':')
				if (err.message) {
					console.error(' !   ' + err.message);
					if (err.message.indexOf('Cannot find module') != -1) {
						repair(moduleName);
						process.exit(1);
					}
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
		}
		if (command === '') { command = null }
		var module = require(moduleName);
		var cmd = module.commands.filter(function (c) {
			return c.topic === topic && c.command == command;
		})[0];
		cmd.run(ctx);`, plugin.Name, plugin.Version, topic, command, string(title), ctxJSON, strconv.Quote(ErrLogPath))

		// swallow sigint since the plugin will handle it
		swallowSignal(os.Interrupt)

		cmd := gode.RunScript(script)
		if ctx.Flags["debugger"] == true {
			cmd = gode.DebugScript(script)
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
	if (!plugin.commands) plugin = {}; // not a real plugin
	var pjson  = require('` + name + `/package.json');

	plugin.name    = pjson.name;
	plugin.version = pjson.version;

	console.log(JSON.stringify(plugin))`
	cmd := gode.RunScript(script)
	output, err := cmd.CombinedOutput()
	if err != nil {
		if attemptReinstall && strings.Contains(string(output), "Error: Cannot find module") {
			Errf("Error reading plugin %s. Reinstalling... ", name)
			if err := installPlugins(name); err != nil {
				panic(errors.New(name + ": " + string(output)))
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
	for _, command := range plugin.Commands {
		command.Plugin = plugin.Name
		command.Help = strings.TrimSpace(command.Help)
	}
	return &plugin
}

// GetPlugins goes through all the node plugins and returns them in Go stucts
func GetPlugins() map[string]*Plugin {
	plugins := FetchPluginCache()
	for name, plugin := range plugins {
		if plugin == nil {
			delete(plugins, name)
		} else {
			for _, command := range plugin.Commands {
				command.Run = runFn(plugin, command.Topic, command.Command)
			}
		}
	}
	return plugins
}

// PluginNames lists all the plugin names
func PluginNames() []string {
	plugins := FetchPluginCache()
	names := make([]string, 0, len(plugins))
	for _, plugin := range plugins {
		if plugin != nil {
			names = append(names, plugin.Name)
		}
	}
	return names
}

// PluginNamesNotSymlinked returns all the plugins that are not symlinked
func PluginNamesNotSymlinked() []string {
	a := PluginNames()
	b := make([]string, 0, len(a))
	for _, plugin := range a {
		if !isPluginSymlinked(plugin) {
			b = append(b, plugin)
		}
	}
	return b
}

func isPluginSymlinked(plugin string) bool {
	path := filepath.Join(AppDir(), "node_modules", plugin)
	fi, err := os.Lstat(path)
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeSymlink != 0
}

// SetupBuiltinPlugins ensures all the builtinPlugins are installed
func SetupBuiltinPlugins() {
	pluginNames := difference(BuiltinPlugins, PluginNames())
	if len(pluginNames) == 0 {
		return
	}
	Err("heroku-cli: Installing core plugins...")
	err := installPlugins(pluginNames...)
	if err != nil {
		Errln()
		PrintError(err)
		return
	}
	Errln(" done")
}

func difference(a, b []string) []string {
	res := make([]string, 0, len(a))
	for _, aa := range a {
		if !contains(b, aa) {
			res = append(res, aa)
		}
	}
	return res
}

func contains(arr []string, s string) bool {
	for _, a := range arr {
		if a == s {
			return true
		}
	}
	return false
}

func installPlugins(names ...string) error {
	for _, name := range names {
		lockfile := updateLockPath + "." + name
		LogIfError(golock.Lock(lockfile))
	}
	err := gode.InstallPackage(names...)
	plugins := make([]*Plugin, 0, len(names))
	for _, name := range names {
		plugins = append(plugins, getPlugin(name, true))
	}
	AddPluginsToCache(plugins...)
	for _, name := range names {
		lockfile := updateLockPath + "." + name
		LogIfError(golock.Unlock(lockfile))
	}
	return err
}

func checkIfPluginIsInstalled(plugin string) {
	if exists, _ := fileExists(filepath.Join(AppDir(), "node_modules", plugin)); !exists {
		installPlugins(plugin)
	}
}
