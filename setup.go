package main

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"time"
)

var setupTopic = &Topic{
	Name:   "setup",
	Hidden: true,
}

var setupCmd = &Command{
	Topic:       "setup",
	Description: "used in building the CLI",
	Hidden:      true,
	Run: func(ctx *Context) {
		pjson, err := readJSON(filepath.Join(corePlugins.Path, "package.json"))
		ExitIfError(err)
		plugins := []string{}
		for name, v := range pjson["dependencies"].(map[string]interface{}) {
			plugins = append(plugins, name+"@"+v.(string))
		}
		ExitIfError(corePlugins.installPackages(plugins...))
		ExitIfError(corePlugins.dedupe())
		ExitIfError(corePlugins.prune())
		for _, plugin := range plugins {
			plugin, err := corePlugins.ParsePlugin(strings.Split(plugin, "@")[0])
			ExitIfError(err)
			corePlugins.addToCache(plugin)
		}
	},
}

type Manifest struct {
	ReleasedAt string            `json:"released_at"`
	Version    string            `json:"version"`
	Channel    string            `json:"channel"`
	Builds     map[string]*Build `json:"builds"`
}
type Build struct {
	Url    string `json:"url"`
	Sha256 string `json:"sha256"`
}

var manifestCmd = &Command{
	Topic:       "setup",
	Command:     "manifest",
	Description: "used in building the CLI",
	Hidden:      true,
	Flags: []Flag{
		{Name: "dir", Char: "d", Required: true, HasValue: true},
		{Name: "version", Char: "v", Required: true, HasValue: true},
		{Name: "channel", Char: "c", Required: true, HasValue: true},
		{Name: "targets", Char: "t", Required: true, HasValue: true},
	},
	Run: func(ctx *Context) {
		manifest := &Manifest{
			ReleasedAt: time.Now().UTC().Format("2006-01-02T15:04:05Z0700"),
			Version:    ctx.Flags["version"].(string),
			Channel:    ctx.Flags["channel"].(string),
			Builds:     map[string]*Build{},
		}
		dir := (ctx.Flags["dir"].(string))
		targets := strings.Split(ctx.Flags["targets"].(string), ",")
		for _, target := range targets {
			info := strings.Split(target, "-")
			os := info[0]
			arch := info[1]
			file := "heroku-v" + manifest.Version + "-" + target + ".tar.xz"
			sha, err := fileSha256(filepath.Join(dir, file))
			ExitIfError(err)
			manifest.Builds[os+"-"+arch] = &Build{
				Url:    "https://cli-assets.heroku.com/" + manifest.Channel + "/" + manifest.Version + "/" + file,
				Sha256: sha,
			}
		}
		data, err := json.MarshalIndent(manifest, "", "  ")
		ExitIfError(err)
		Println(string(data))
	},
}
