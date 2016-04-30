// +build !test,!release

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/ansel1/merry"
	"github.com/kr/binarydist"
	"github.com/ulikunitz/xz"
)

func init() {
	Topics = append(Topics, TopicSet{
		{
			Name:        "build",
			Description: "These commands are used to build the CLI. They are not intended to be used otherwise.",
			Commands: CommandSet{
				{
					Command:     "plugins",
					Description: "installs core plugins",
					Run:         buildPlugins,
				},
				{
					Command:     "manifest",
					Description: "builds manifest.json to upload to S3",
					Flags: []Flag{
						{Name: "dir", Char: "d", Required: true, HasValue: true},
						{Name: "version", Char: "v", Required: true, HasValue: true},
						{Name: "channel", Char: "c", Required: true, HasValue: true},
						{Name: "targets", Char: "t", Required: true, HasValue: true},
					},
					Run: buildManifest,
				},
				{
					Command:     "bsdiff",
					Description: "generates bsdiff patch",
					Flags: []Flag{
						{Name: "new", HasValue: true, Required: true},
						{Name: "channel", HasValue: true, Required: true},
						{Name: "target", HasValue: true, Required: true},
						{Name: "out", HasValue: true, Required: true},
					},
					Run: buildBsdiff,
				},
			},
		},
	}...)
}

func buildPlugins(ctx *Context) {
	pjson := struct {
		Dependencies map[string]string `json:"dependencies"`
	}{}
	must(readJSON(&pjson, filepath.Join(CorePlugins.Path, "package.json")))
	plugins := []string{}
	for name, v := range pjson.Dependencies {
		plugins = append(plugins, name+"@"+v)
	}
	must(CorePlugins.installPackages(plugins...))
	for _, plugin := range plugins {
		plugin, err := CorePlugins.ParsePlugin(strings.Split(plugin, "@")[0])
		must(err)
		CorePlugins.addToCache(plugin)
	}
}

func buildManifest(ctx *Context) {
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
}

func buildBsdiff(ctx *Context) {
	channel := ctx.Flags["channel"].(string)
	newpath := ctx.Flags["new"].(string)
	target := ctx.Flags["target"].(string)
	out := ctx.Flags["out"].(string)
	patch, err := os.Create(out)
	must(err)
	newf, err := os.Open(newpath)
	must(err)
	defer newf.Close()
	new, err := xz.NewReader(newf)
	must(err)
	manifest := GetUpdateManifest(channel)
	build := manifest.Builds[target]
	old, sha, err := downloadXZ(build.URL, "")
	must(err)
	Errf("downloading %s\n", build.URL)
	defer patch.Close()
	Errf("bsdiffing %s\n", out)
	must(binarydist.Diff(old, new, patch))
	if sha() != build.Sha256 {
		must(merry.Errorf("SHA mismatch"))
	}
}
