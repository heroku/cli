package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

func init() {
	Topics = append(Topics, TopicSet{
		{
			Name:        "build",
			Description: "These commands are used to build the CLI. They are not intended to be used otherwise.",
			Hidden:      true,
			Commands: CommandSet{
				{
					Topic:       "build",
					Command:     "plugins",
					Description: "installs core plugins",
					Run: func(ctx *Context) {
						pjson, err := readJSON(filepath.Join(corePlugins.Path, "package.json"))
						must(err)
						plugins := []string{}
						for name, v := range pjson["dependencies"].(map[string]interface{}) {
							plugins = append(plugins, name+"@"+v.(string))
						}
						must(corePlugins.installPackages(plugins...))
						for _, plugin := range plugins {
							plugin, err := corePlugins.ParsePlugin(strings.Split(plugin, "@")[0])
							must(err)
							corePlugins.addToCache(plugin)
						}
					},
				},
				{
					Topic:       "build",
					Command:     "manifest",
					Description: "builds manifest.json to upload to S3",
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
						re := regexp.MustCompile(`heroku-v\d+\.\d+\.\d+-\w+-(\w+)-(\w+)\.tar.xz`)
						for _, file := range files {
							filename := filepath.Base(file)
							info := re.FindStringSubmatch(filename)
							f, err := os.Open(file)
							must(err)
							fi, err := f.Stat()
							must(err)
							os := info[1]
							arch := info[2]
							sha256, err := fileSha256(file)
							must(err)
							manifest.Builds[os+"-"+arch] = &Build{
								URL:    "https://cli-assets.heroku.com/branches/" + manifest.Channel + "/" + manifest.Version + "/" + filename,
								Sha256: sha256,
								Bytes:  fi.Size(),
							}
						}
						data, err := json.MarshalIndent(manifest, "", "  ")
						must(err)
						Println(string(data))
					},
				},
			},
		},
	}...)
}

// Manifest is the manifest.json for releases
type Manifest struct {
	ReleasedAt string            `json:"released_at"`
	Version    string            `json:"version"`
	Channel    string            `json:"channel"`
	Builds     map[string]*Build `json:"builds"`
}

// Build is a part of a Manifest
type Build struct {
	URL    string `json:"url"`
	Sha256 string `json:"sha256"`
	Bytes  int64  `json:"bytes"`
}
