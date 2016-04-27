package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"syscall"

	"github.com/ansel1/merry"
	"github.com/dickeyxxx/golock"
)

func init() {
	Topics = append(Topics, &Topic{
		Name:        "plugins",
		Description: "manage plugins",
		Commands: CommandSet{
			{
				Topic:            "plugins",
				Hidden:           true,
				Description:      "Lists installed plugins",
				DisableAnalytics: true,
				Flags: []Flag{
					{Name: "core", Description: "show core plugins"},
				},
				Help: `
Example:
  $ heroku plugins`,

				Run: pluginsList,
			},
			{
				Topic:        "plugins",
				Command:      "install",
				Hidden:       true,
				VariableArgs: true,
				Description:  "Installs a plugin into the CLI",
				Help: `Install a Heroku plugin

  Example:
  $ heroku plugins:install heroku-production-status`,

				Run: pluginsInstall,
			},
			{
				Topic:       "plugins",
				Command:     "link",
				Description: "Links a local plugin into CLI",
				Args:        []Arg{{Name: "path", Optional: true}},
				Help: `Links a local plugin into CLI.
	This is useful when developing plugins locally.
	It simply symlinks the specified path into the plugins directory
	and parses the plugin.

	You will need to run it again if you change any of the plugin metadata.

  Example:
	$ heroku plugins:link .`,

				Run: pluginsLink,
			},
			{
				Topic:       "plugins",
				Command:     "uninstall",
				Hidden:      true,
				Args:        []Arg{{Name: "name"}},
				Description: "Uninstalls a plugin from the CLI",
				Help: `Uninstalls a Heroku plugin

  Example:
  $ heroku plugins:uninstall heroku-production-status`,

				Run: pluginsUninstall,
			},
		},
	})
}

func pluginsList(ctx *Context) {
	var names []string
	for _, plugin := range userPlugins.Plugins() {
		symlinked := ""
		if userPlugins.isPluginSymlinked(plugin.Name) {
			symlinked = " (symlinked)"
		}
		names = append(names, fmt.Sprintf("%s %s%s", plugin.Name, plugin.Version, symlinked))
	}
	if ctx.Flags["core"] != nil {
		userPluginNames := userPlugins.PluginNames()
		for _, plugin := range corePlugins.Plugins() {
			if contains(userPluginNames, plugin.Name) {
				continue
			}
			names = append(names, fmt.Sprintf("%s %s (core)", plugin.Name, plugin.Version))
		}
	}
	sort.Strings(names)
	for _, plugin := range names {
		Println(plugin)
	}
}
func pluginsInstall(ctx *Context) {
	plugins := ctx.Args.([]string)
	if len(plugins) == 0 {
		ExitWithMessage("Must specify a plugin name.\nUSAGE: heroku plugins:install heroku-debug")
	}
	toinstall := make([]string, 0, len(plugins))
	core := corePlugins.PluginNames()
	for _, plugin := range plugins {
		if contains(core, strings.Split(plugin, "@")[0]) {
			Warn("Not installing " + plugin + " because it is already installed as a core plugin.")
			continue
		}
		toinstall = append(toinstall, plugin)
	}
	if len(toinstall) == 0 {
		Exit(1)
	}
	action("Installing "+plural("plugin", len(toinstall))+" "+strings.Join(toinstall, " "), "done", func() {
		err := userPlugins.InstallPlugins(toinstall...)
		if err != nil {
			if strings.Contains(err.Error(), "no such package available") {
				ExitWithMessage("Plugin not found")
			}
			must(err)
		}
	})
}

func pluginsLink(ctx *Context) {
	path := ctx.Args.(map[string]string)["path"]
	if path == "" {
		path = "."
	}
	path, err := filepath.Abs(path)
	must(err)
	_, err = os.Stat(path)
	must(err)
	name := filepath.Base(path)
	action("Symlinking "+name, "done", func() {
		newPath := userPlugins.pluginPath(name)
		os.Remove(newPath)
		os.RemoveAll(newPath)
		os.MkdirAll(filepath.Dir(newPath), 0755)
		err = os.Symlink(path, newPath)
		must(err)
		plugin, err := userPlugins.ParsePlugin(name)
		must(err)
		if name != plugin.Name {
			path = newPath
			newPath = userPlugins.pluginPath(plugin.Name)
			os.Remove(newPath)
			os.RemoveAll(newPath)
			os.Rename(path, newPath)
		}
		userPlugins.addToCache(plugin)
	})
}

func pluginsUninstall(ctx *Context) {
	name := ctx.Args.(map[string]string)["name"]
	if !contains(userPlugins.PluginNames(), name) {
		must(errors.New(name + " is not installed"))
	}
	Errf("Uninstalling plugin %s...", name)
	must(userPlugins.RemovePackages(name))
	userPlugins.removeFromCache(name)
	Errln(" done")
}

// Plugins represents either core or user plugins
type Plugins struct {
	Path    string
	plugins []*Plugin
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

func (p *Plugins) runFn(plugin *Plugin, topic, command string) func(ctx *Context) {
	return func(ctx *Context) {
		p.readLockPlugin(plugin.Name)
		ctx.Dev = p.isPluginSymlinked(plugin.Name)
		ctxJSON, err := json.Marshal(ctx)
		must(err)
		title, _ := json.Marshal("heroku " + strings.Join(os.Args[1:], " "))

		script := fmt.Sprintf(`'use strict'
let pluginName = '%s'
let pluginVersion = '%s'
let topic = '%s'
let command = '%s'
process.title = %s
let ctx = %s
ctx.version = ctx.version + ' ' + pluginName + '/' + pluginVersion + ' node-' + process.version
process.chdir(ctx.cwd)
if (command === '') { command = null }
let plugin = require(pluginName)
let cmd = plugin.commands.filter((c) => c.topic === topic && c.command == command)[0]
cmd.run(ctx)
`, plugin.Name, plugin.Version, topic, command, string(title), ctxJSON)

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
			must(err)
		}
		return status.ExitStatus()
	}
	must(err)
	return -1
}

// ParsePlugin requires the plugin's node module
// to get the commands and metadata
func (p *Plugins) ParsePlugin(name string) (*Plugin, error) {
	script := `
	var plugin = require('` + name + `');
	var pjson  = require('` + name + `/package.json');

	plugin.name    = pjson.name;
	plugin.version = pjson.version;

	console.log(JSON.stringify(plugin))`
	cmd, done := p.RunScript(script)
	cmd.Stderr = Stderr
	output, err := cmd.Output()
	done()

	if err != nil {
		return nil, merry.Errorf("Error installing plugin %s", name)
	}
	var plugin Plugin
	err = json.Unmarshal(output, &plugin)
	if err != nil {
		return nil, fmt.Errorf("Error parsing plugin: %s\n%s\n%s", name, err, string(output))
	}
	if len(plugin.Commands) == 0 {
		return nil, fmt.Errorf("Invalid plugin. No commands found.")
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
		action("heroku-cli: Updating plugins", "", func() {
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

func (p *Plugins) addToCache(plugins ...*Plugin) {
	contains := func(name string) int {
		for i, plugin := range p.plugins {
			if plugin.Name == name {
				return i
			}
		}
		return -1
	}
	for _, plugin := range plugins {
		// find or replace
		i := contains(plugin.Name)
		if i == -1 {
			p.plugins = append(p.plugins, plugin)
		} else {
			p.plugins[i] = plugin
		}
	}
	p.saveCache()
}

func (p *Plugins) removeFromCache(name string) {
	for i, plugin := range p.plugins {
		if plugin.Name == name {
			p.plugins = append(p.plugins[:i], p.plugins[i+1:]...)
		}
	}
	p.saveCache()
}

func (p *Plugins) saveCache() {
	if err := saveJSON(p.plugins, p.cachePath()); err != nil {
		must(err)
	}
}

// Plugins reads the cache file into the struct
func (p *Plugins) Plugins() []*Plugin {
	if p.plugins == nil {
		p.plugins = []*Plugin{}
		if exists, _ := fileExists(p.cachePath()); !exists {
			return p.plugins
		}
		f, err := os.Open(p.cachePath())
		if err != nil {
			LogIfError(err)
			return p.plugins
		}
		err = json.NewDecoder(f).Decode(&p.plugins)
		WarnIfError(err)
	}
	return p.plugins
}

func (p *Plugins) cachePath() string {
	return filepath.Join(p.Path, "plugins.json")
}
