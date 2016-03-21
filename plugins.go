package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
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
	PrintError(err, false)
	if !setup {
		setupNode()
	}
}

func setupNode() {
	PrintError(gode.Setup(), true)
}

func updateNode() {
	gode.SetRootPath(AppDir())
	needsUpdate, err := gode.NeedsUpdate()
	PrintError(err, true)
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
		ExitIfError(installPlugins(name), true)
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
		newPath := pluginPath(name)
		os.Remove(newPath)
		os.RemoveAll(newPath)
		err = os.Symlink(path, newPath)
		if err != nil {
			panic(err)
		}
		plugin, err := ParsePlugin(name)
		ExitIfError(err, false)
		if name != plugin.Name {
			path = newPath
			newPath = pluginPath(plugin.Name)
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
		ExitIfError(gode.RemovePackages(name), true)
		RemovePluginFromCache(name)
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
		SetupBuiltinPlugins()
		var plugins []string
		for _, plugin := range GetPlugins() {
			if plugin != nil && len(plugin.Commands) > 0 {
				symlinked := ""
				if isPluginSymlinked(plugin.Name) {
					symlinked = " (symlinked)"
				}
				plugins = append(plugins, fmt.Sprintf("%s %s %s", plugin.Name, plugin.Version, symlinked))
			}
		}
		sort.Strings(plugins)
		for _, plugin := range plugins {
			Println(plugin)
		}
	},
}

func runFn(plugin *Plugin, topic, command string) func(ctx *Context) {
	return func(ctx *Context) {
		readLockPlugin(plugin.Name)
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
		if (!ctx.dev) {
			process.on('uncaughtException', function (err) {
				// ignore EPIPE errors (usually from piping to head)
				if (err.code === "EPIPE") return;
				console.error(' !   Error in ' + moduleName + ':')
				console.error(' !   ' + err.message || err);
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
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if ctx.Flags["debugger"] == true {
			cmd = gode.DebugScript(script)
		}
		if err := cmd.Run(); err != nil {
			os.Exit(getExitCode(err))
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
	case nil:
		return 0
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

// ParsePlugin requires the plugin's node module
// to get the commands and metadata
func ParsePlugin(name string) (*Plugin, error) {
	script := `
	var plugin = require('` + name + `');
	if (!plugin.commands) throw new Error('Contains no commands. Is this a real plugin?');
	var pjson  = require('` + name + `/package.json');

	plugin.name    = pjson.name;
	plugin.version = pjson.version;

	console.log(JSON.stringify(plugin))`
	cmd := gode.RunScript(script)
	cmd.Stderr = Stderr
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("Error reading plugin: %s\n%s", name, err)
	}
	var plugin Plugin
	err = json.Unmarshal([]byte(output), &plugin)
	if err != nil {
		return nil, fmt.Errorf("Error parsing plugin: %s\n%s\n%s", name, err, string(output))
	}
	for _, command := range plugin.Commands {
		command.Plugin = plugin.Name
		command.Help = strings.TrimSpace(command.Help)
	}
	return &plugin, nil
}

// GetPlugins goes through all the node plugins and returns them in Go stucts
func GetPlugins() map[string]*Plugin {
	plugins := FetchPluginCache()
	for name, plugin := range plugins {
		if plugin == nil || !pluginExists(name) {
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
		if plugin != nil && len(plugin.Commands) > 0 {
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
	if err := installPlugins(pluginNames...); err != nil {
		// retry once
		PrintError(gode.RemovePackages(pluginNames...), true)
		PrintError(gode.ClearCache(), true)
		Err("\rheroku-cli: Installing core plugins (retrying)...")
		ExitIfError(installPlugins(pluginNames...), true)
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
		lockPlugin(name)
	}
	defer func() {
		for _, name := range names {
			unlockPlugin(name)
		}
	}()
	err := gode.InstallPackages(names...)
	if err != nil {
		return err
	}
	plugins := make([]*Plugin, 0, len(names))
	for _, name := range names {
		plugin, err := ParsePlugin(name)
		if err != nil {
			return err
		}
		plugins = append(plugins, plugin)
	}
	AddPluginsToCache(plugins...)
	return nil
}

func pluginExists(plugin string) bool {
	exists, _ := fileExists(pluginPath(plugin))
	return exists
}

// directory location of plugin
func pluginPath(plugin string) string {
	return filepath.Join(AppDir(), "node_modules", plugin)
}

// lock a plugin for reading
func readLockPlugin(name string) {
	lockfile := updateLockPath + "." + name
	if exists, _ := fileExists(lockfile); exists {
		lockPlugin(name)
		unlockPlugin(name)
	}
}

// lock a plugin for writing
func lockPlugin(name string) {
	LogIfError(golock.Lock(updateLockPath + "." + name))
}

// unlock a plugin
func unlockPlugin(name string) {
	LogIfError(golock.Unlock(updateLockPath + "." + name))
}
