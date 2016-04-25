package main

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"time"
)

var buildTopic = &Topic{
	Name:        "build",
	Description: "These commands are used to build the CLI. They are not intended to be used otherwise.",
	Hidden:      true,
}

var buildPluginsCmd = &Command{
	Topic:       "build",
	Command:     "plugins",
	Description: "installs core plugins",
	Hidden:      true,
	Run: func(ctx *Context) {
		pjson, err := readJSON(filepath.Join(corePlugins.Path, "package.json"))
		ExitIfError(err)
		plugins := []string{}
		for name, v := range pjson["dependencies"].(map[string]interface{}) {
			plugins = append(plugins, name+"@"+v.(string))
		}
		ExitIfError(corePlugins.installPackages(plugins...))
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
	URL    string `json:"url"`
	Sha1   string `json:"sha1"`
	Sha256 string `json:"sha256"`
}

var buildManifestCmd = &Command{
	Topic:       "build",
	Command:     "manifest",
	Description: "builds manifest.json to upload to S3",
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
		files := strings.Split(ctx.Flags["targets"].(string), ",")
		for _, file := range files {
			filename := filepath.Base(file)
			info := strings.Split(filename, "-")
			os := info[3]
			arch := info[4]
			sha1, err := fileSha1(file)
			ExitIfError(err)
			sha256, err := fileSha256(file)
			ExitIfError(err)
			manifest.Builds[os+"-"+arch] = &Build{
				URL:    "https://cli-assets.heroku.com/branches/" + manifest.Channel + "/" + manifest.Version + "/" + filename,
				Sha1:   sha1,
				Sha256: sha256,
			}
		}
		data, err := json.MarshalIndent(manifest, "", "  ")
		ExitIfError(err)
		Println(string(data))
	},
}
