package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/dickeyxxx/golock"
	"github.com/franela/goreq"
)

var Autoupdate = "no"

var updateTopic = &Topic{
	Name:        "update",
	Description: "update heroku-cli",
}

var updateCmd = &Command{
	Topic:            "update",
	Hidden:           true,
	Description:      "updates heroku-cli",
	DisableAnalytics: true,
	Args:             []Arg{{Name: "channel", Optional: true}},
	Flags:            []Flag{{Name: "background", Hidden: true}},
	Run: func(ctx *Context) {
		channel := ctx.Args.(map[string]string)["channel"]
		if channel == "" {
			channel = Channel
		}
		t := "foreground"
		if ctx.Flags["background"] == true {
			t = "background"
		}
		Update(channel, t)
	},
}

var updateLockPath = filepath.Join(CacheHome, "updating.lock")
var autoupdateFile = filepath.Join(CacheHome, "autoupdate")

// Update updates the CLI and plugins
func Update(channel string, t string) {
	if !IsUpdateNeeded(t) {
		return
	}
	touchAutoupdateFile()
	SubmitAnalytics()
	updateCLI(channel)
	userPlugins.Update()
	truncate(ErrLogPath, 1000)
	cleanTmpDirs()
}

func updateCLI(channel string) {
	if Autoupdate != "yes" {
		return
	}
	manifest, err := getUpdateManifest(channel)
	if err != nil {
		Warn("Error updating CLI")
		WarnIfError(err)
		return
	}
	if manifest.Version == Version && manifest.Channel == Channel {
		return
	}
	locked, err := golock.IsLocked(updateLockPath)
	LogIfError(err)
	if locked {
		Warn("Update in progress")
		return
	}
	LogIfError(golock.Lock(updateLockPath))
	unlock := func() {
		golock.Unlock(updateLockPath)
	}
	defer unlock()
	downloadingMessage = fmt.Sprintf("heroku-cli: Updating to %s...", manifest.Version)
	if manifest.Channel != "stable" {
		downloadingMessage = fmt.Sprintf("%s (%s)", downloadingMessage, manifest.Channel)
	}
	Logln(downloadingMessage)
	build := manifest.Builds[runtime.GOOS+"-"+runtime.GOARCH]
	if build == nil {
		panic(fmt.Errorf("no build for %s", manifest.Channel))
	}
	reader, getSha, err := downloadXZ(build.URL)
	ExitIfError(err)
	tmp := tmpDir(DataHome)
	ExitIfError(extractTar(reader, tmp))
	sha := getSha()
	if sha != build.Sha256 {
		panic(fmt.Errorf("SHA mismatch: expected %s to be %s", sha, build.Sha256))
	}
	LogIfError(os.Rename(filepath.Join(DataHome, "cli"), filepath.Join(tmpDir(DataHome), "heroku")))
	LogIfError(os.Rename(filepath.Join(tmp, "heroku"), filepath.Join(DataHome, "cli")))
	unlock()
	Debugln("updating done, loading new cli " + manifest.Version)
	loadNewCLI()
}

// IsUpdateNeeded checks if an update is available
func IsUpdateNeeded(t string) bool {
	f, err := os.Stat(autoupdateFile)
	if err != nil {
		return true
	}
	if t == "background" {
		return time.Since(f.ModTime()) > 4*time.Hour
	} else if t == "block" {
		return time.Since(f.ModTime()) > 2160*time.Hour // 90 days
	}
	return true
}

func touchAutoupdateFile() {
	out, err := os.OpenFile(autoupdateFile, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		panic(err)
	}
	out.WriteString(time.Now().String())
	out.Close()
}

// forces a full update on the next run
func clearAutoupdateFile() {
	WarnIfError(os.Remove(autoupdateFile))
}

func getUpdateManifest(channel string) (*Manifest, error) {
	res, err := goreq.Request{
		Uri:       "https://cli-assets.heroku.com/" + channel + "/manifest.json",
		Timeout:   30 * time.Minute,
		ShowDebug: debugging,
	}.Do()
	if err != nil {
		return nil, err
	}
	if err := getHTTPError(res); err != nil {
		return nil, err
	}
	var m Manifest
	res.Body.FromJsonTo(&m)
	return &m, nil
}

// TriggerBackgroundUpdate will trigger an update to the client in the background
func TriggerBackgroundUpdate() {
	if IsUpdateNeeded("background") {
		exec.Command(BinPath, "update", "--background").Start()
	}
}

func cleanTmpDirs() {
	clean := func(base string) {
		Debugln("cleaning up tmp dirs in " + base)
		dir := filepath.Join(base, "tmp")
		if exists, _ := fileExists(dir); !exists {
			return
		}
		files, err := ioutil.ReadDir(dir)
		LogIfError(err)
		for _, file := range files {
			if time.Since(file.ModTime()) > 24*time.Hour {
				path := filepath.Join(dir, file.Name())
				LogIfError(os.RemoveAll(path))
			}
		}
	}
	clean(DataHome)
	clean(CacheHome)
}

func loadNewCLI() {
	if Autoupdate == "no" {
		return
	}
	bin := filepath.Join(DataHome, "cli", "bin", "heroku")
	if BinPath == bin {
		return
	}
	if exists, _ := fileExists(bin); !exists {
		return
	}
	execBin(bin, os.Args...)
}
