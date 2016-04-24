package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"syscall"

	"github.com/dickeyxxx/golock"
)

// Plugins represents either core or user plugins
type Plugins struct {
	Path string
}

var corePlugins = &Plugins{Path: filepath.Join(AppDir, "lib")}
var userPlugins = &Plugins{Path: filepath.Join(DataHome, "plugins")}

// Plugin represents a javascript plugin
type Plugin struct {
	Name     string     `json:"name"`
	Version  string     `json:"version"`
	Topics   TopicSet   `json:"topics"`
	Topic    *Topic     `json:"topic"`
	Commands CommandSet `json:"commands"`
}

// Commands lists all the commands of the plugins
func (p *Plugins) Commands() (commands CommandSet) {
	for _, plugin := range p.Plugins() {
		for _, command := range plugin.Commands {
			command.Run = p.runFn(plugin, command.Topic, command.Command)
			commands = append(commands, command)
		}
	}
	return
}

// Topics gets all the plugin's topics
func (p *Plugins) Topics() (topics TopicSet) {
	for _, plugin := range p.Plugins() {
		if plugin.Topic != nil {
			topics = append(topics, plugin.Topic)
		}
		topics = append(topics, plugin.Topics...)
	}
	return
}

var pluginsTopic = &Topic{
	Name:        "plugins",
	Description: "manage plugins",
}

var pluginsInstallCmd = &Command{
	Topic:        "plugins",
	Command:      "install",
	Hidden:       true,
	VariableArgs: true,
	Args:         []Arg{{Name: "name"}},
	Description:  "Installs a plugin into the CLI",
	Help: `Install a Heroku plugin

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-status`,

	Run: func(ctx *Context) {
		plugins := ctx.Args.([]string)
		if len(plugins) == 0 {
			Errln("Must specify a plugin name")
			return
		}
		action("Installing "+plural("plugin", len(plugins))+" "+strings.Join(plugins, " "), "done", func() {
			ExitIfError(userPlugins.InstallPlugins(plugins...))
		})
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
		pluginInstallRetry = false
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
		action("Symlinking "+name, "done", func() {
			newPath := userPlugins.pluginPath(name)
			os.Remove(newPath)
			os.RemoveAll(newPath)
			err = os.Symlink(path, newPath)
			if err != nil {
				panic(err)
			}
			plugin, err := userPlugins.ParsePlugin(name)
			ExitIfError(err)
			if name != plugin.Name {
				path = newPath
				newPath = userPlugins.pluginPath(plugin.Name)
				os.Remove(newPath)
				os.RemoveAll(newPath)
				os.Rename(path, newPath)
			}
			userPlugins.addToCache(plugin)
		})
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
		if !contains(userPlugins.PluginNames(), name) {
			ExitIfError(errors.New(name + " is not installed"))
		}
		Errf("Uninstalling plugin %s...", name)
		ExitIfError(userPlugins.RemovePackages(name))
		userPlugins.removeFromCache(name)
		Errln(" done")
	},
}

var pluginsListCmd = &Command{
	Topic:            "plugins",
	Hidden:           true,
	Description:      "Lists installed plugins",
	DisableAnalytics: true,
	Help: `
Example:
  $ heroku plugins`,

	Run: func(ctx *Context) {
		var names []string
		for _, plugin := range corePlugins.Plugins() {
			names = append(names, fmt.Sprintf("%s %s (core)", plugin.Name, plugin.Version))
		}
		for _, plugin := range userPlugins.Plugins() {
			symlinked := ""
			if userPlugins.isPluginSymlinked(plugin.Name) {
				symlinked = " (symlinked)"
			}
			names = append(names, fmt.Sprintf("%s %s%s", plugin.Name, plugin.Version, symlinked))
		}
		sort.Strings(names)
		for _, plugin := range names {
			Println(plugin)
		}
	},
}

func (p *Plugins) runFn(plugin *Plugin, topic, command string) func(ctx *Context) {
	return func(ctx *Context) {
		p.readLockPlugin(plugin.Name)
		ctx.Dev = p.isPluginSymlinked(plugin.Name)
		ctxJSON, err := json.Marshal(ctx)
		if err != nil {
			panic(err)
		}
		title, _ := json.Marshal("heroku " + strings.Join(os.Args[1:], " "))

		script := fmt.Sprintf(`'use strict';
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
cmd.run(ctx);
`, plugin.Name, plugin.Version, topic, command, string(title), ctxJSON, strconv.Quote(ErrLogPath))

		// swallow sigint since the plugin will handle it
		swallowSigint = true

		currentAnalyticsCommand.Plugin = plugin.Name
		currentAnalyticsCommand.Version = plugin.Version
		currentAnalyticsCommand.Language = fmt.Sprintf("node/" + NodeVersion)

		cmd, done := p.RunScript(script)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err = cmd.Run()
		done()
		Exit(getExitCode(err))
	}
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

var pluginInstallRetry = true

// ParsePlugin requires the plugin's node module
// to get the commands and metadata
func (p *Plugins) ParsePlugin(name string) (*Plugin, error) {
	script := `
	var plugin = require('` + name + `');
	if (!plugin.commands) throw new Error('Contains no commands. Is this a real plugin?');
	var pjson  = require('` + name + `/package.json');

	plugin.name    = pjson.name;
	plugin.version = pjson.version;

	console.log(JSON.stringify(plugin))`
	cmd, done := p.RunScript(script)
	cmd.Stderr = Stderr
	output, err := cmd.Output()
	done()

	if err != nil {
		// try again but this time grab stdout and stderr
		cmd, done := p.RunScript(script)
		output, err = cmd.CombinedOutput() // sometimes this actually works the second time
		if err != nil {
			done()
			if pluginInstallRetry && strings.Contains(string(output), "Error: Cannot find module") {
				pluginInstallRetry = false
				Warn("Failed to install " + name + ". Retrying...")
				WarnIfError(p.RemovePackages(name))
				WarnIfError(p.ClearCache())
				if err := p.installPackages(name); err != nil {
					return nil, err
				}
				return p.ParsePlugin(name)
			}
			return nil, fmt.Errorf("Error reading plugin: %s\n%s\n%s", name, err, output)
		}
	}
	var plugin Plugin
	err = json.Unmarshal([]byte(output), &plugin)
	if err != nil {
		return nil, fmt.Errorf("Error parsing plugin: %s\n%s\n%s", name, err, string(output))
	}
	for _, command := range plugin.Commands {
		if command == nil {
			continue
		}
		command.Plugin = plugin.Name
		command.Help = strings.TrimSpace(command.Help)
	}
	return &plugin, nil
}

// PluginNames lists all the plugin names
func (p *Plugins) PluginNames() []string {
	plugins := p.Plugins()
	names := make([]string, 0, len(plugins))
	for _, plugin := range plugins {
		names = append(names, plugin.Name)
	}
	return names
}

// PluginNamesNotSymlinked lists all the plugin names that are not symlinked
func (p *Plugins) PluginNamesNotSymlinked() []string {
	plugins := p.PluginNames()
	names := make([]string, 0, len(plugins))
	for _, plugin := range plugins {
		if !p.isPluginSymlinked(plugin) {
			names = append(names, plugin)
		}
	}
	return names
}

func (p *Plugins) isPluginSymlinked(plugin string) bool {
	path := filepath.Join(p.modulesPath(), plugin)
	fi, err := os.Lstat(path)
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeSymlink != 0
}

func contains(arr []string, s string) bool {
	for _, a := range arr {
		if a == s {
			return true
		}
	}
	return false
}

// InstallPlugins installs plugins
func (p *Plugins) InstallPlugins(names ...string) error {
	for _, name := range names {
		p.lockPlugin(name)
	}
	defer func() {
		for _, name := range names {
			p.unlockPlugin(name)
		}
	}()
	err := p.installPackages(names...)
	if err != nil {
		return err
	}
	plugins := make([]*Plugin, len(names))
	for i, name := range names {
		plugin, err := p.ParsePlugin(name)
		if err != nil {
			return err
		}
		plugins[i] = plugin
	}
	p.addToCache(plugins...)
	return nil
}

// directory location of plugin
func (p *Plugins) pluginPath(plugin string) string {
	return filepath.Join(p.Path, "node_modules", plugin)
}

// name of lockfile
func (p *Plugins) lockfile(name string) string {
	return filepath.Join(p.Path, name+".updating")
}

// lock a plugin for reading
func (p *Plugins) readLockPlugin(name string) {
	locked, err := golock.IsLocked(p.lockfile(name))
	LogIfError(err)
	if locked {
		p.lockPlugin(name)
		p.unlockPlugin(name)
	}
}

// lock a plugin for writing
func (p *Plugins) lockPlugin(name string) {
	LogIfError(golock.Lock(p.lockfile(name)))
}

// unlock a plugin
func (p *Plugins) unlockPlugin(name string) {
	LogIfError(golock.Unlock(p.lockfile(name)))
}

// Update updates the plugins
func (p *Plugins) Update() {
	plugins := p.PluginNamesNotSymlinked()
	if len(plugins) == 0 {
		return
	}
	packages, err := p.OutdatedPackages(plugins...)
	WarnIfError(err)
	if len(packages) > 0 {
		action("heroku-cli: Updating plugins", "done", func() {
			for name, version := range packages {
				p.lockPlugin(name)
				WarnIfError(p.installPackages(name + "@" + version))
				plugin, err := p.ParsePlugin(name)
				WarnIfError(err)
				p.addToCache(plugin)
				p.unlockPlugin(name)
			}
		})
		Errf(" done. Updated %d %s.\n", len(packages), plural("package", len(packages)))
	}
}
