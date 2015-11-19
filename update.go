package main

import (
	"crypto/sha1"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/dickeyxxx/golock"
	"github.com/franela/goreq"
	"github.com/heroku/heroku-cli/gode"
)

var updateTopic = &Topic{
	Name:        "update",
	Description: "update heroku-cli",
}

var updateCmd = &Command{
	Topic:       "update",
	Hidden:      true,
	Description: "updates heroku-cli",
	Args:        []Arg{{Name: "channel", Optional: true}},
	Flags:       []Flag{{Name: "background", Hidden: true}},
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

var binPath string
var updateLockPath = filepath.Join(AppDir(), "updating.lock")
var autoupdateFile = filepath.Join(AppDir(), "autoupdate")

func init() {
	binPath = os.Args[0]
}

// Update updates the CLI and plugins
func Update(channel string, t string) {
	Debugln("running from " + binPath)
	if !IsUpdateNeeded(t) {
		return
	}
	done := make(chan bool)
	go func() {
		touchAutoupdateFile()
		updateCLI(channel)
		updateNode()
		updatePlugins(t)
		done <- true
	}()
	select {
	case <-time.After(time.Second * 300):
		Errln("Timed out while updating")
	case <-done:
	}
}

func updatePlugins(t string) {
	updated := false
	plugins := PluginNamesNotSymlinked()
	if len(plugins) == 0 {
		return
	}
	Err("Updating plugins... ")
	if t == "foreground" || t == "block" {
		b, _ := gode.UpdatePackages()
		if len(b) > 0 {
			updated = true
		}
	} else {
		for _, name := range plugins {
			lockfile := updateLockPath + "." + name
			LogIfError(golock.Lock(lockfile))
			b, _ := gode.UpdatePackage(name)
			LogIfError(golock.Unlock(lockfile))
			if len(b) > 0 {
				updated = true
			}
		}
	}
	Errln("done")
	if updated {
		Err("rebuilding plugins cache... ")
		UpdatePluginCache()
		Errln("done")
	}
}

func updateCLI(channel string) {
	manifest, err := getUpdateManifest(channel)
	if err != nil {
		Warn("Error updating CLI")
		PrintError(err)
		return
	}
	if manifest.Version == Version && manifest.Channel == Channel {
		return
	}
	LogIfError(golock.Lock(updateLockPath))
	defer golock.Unlock(updateLockPath)
	Errf("Updating Heroku v4 CLI to %s (%s)... ", manifest.Version, manifest.Channel)
	build := manifest.Builds[runtime.GOOS][runtime.GOARCH]
	// on windows we can't remove an existing file or remove the running binary
	// so we download the file to binName.new
	// move the running binary to binName.old (deleting any existing file first)
	// rename the downloaded file to binName
	if err := downloadBin(binPath+".new", build.URL); err != nil {
		panic(err)
	}
	if fileSha1(binPath+".new") != build.Sha1 {
		panic("SHA mismatch")
	}
	os.Remove(binPath + ".old")
	os.Rename(binPath, binPath+".old")
	if err := os.Rename(binPath+".new", binPath); err != nil {
		panic(err)
	}
	os.Remove(binPath + ".old")
	Errln("done")
}

// IsUpdateNeeded checks if an update is available
func IsUpdateNeeded(t string) bool {
	if Channel == "?" {
		return false
	}
	f, err := os.Stat(autoupdateFile)
	if err != nil {
		return true
	}
	if t == "background" {
		return time.Since(f.ModTime()) > 4*time.Hour
	} else if t == "block" {
		return time.Since(f.ModTime()) > 336*time.Hour
	}
	return true
}

func touchAutoupdateFile() {
	out, err := os.OpenFile(autoupdateFile, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		panic(err)
	}
	out.WriteString(time.Now().String())
}

type manifest struct {
	Channel, Version string
	Builds           map[string]map[string]struct {
		URL, Sha1 string
	}
}

func getUpdateManifest(channel string) (*manifest, error) {
	res, err := goreq.Request{
		Uri:       "https://cli-assets.heroku.com/" + channel + "/manifest.json",
		ShowDebug: debugging,
	}.Do()
	if err != nil {
		return nil, err
	}
	var m manifest
	res.Body.FromJsonTo(&m)
	return &m, nil
}

func downloadBin(path, url string) error {
	out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	res, err := goreq.Request{
		Uri:       url + ".gz",
		ShowDebug: debugging,
	}.Do()
	if err != nil {
		return err
	}
	if res.StatusCode != 200 {
		b, _ := res.Body.ToString()
		return errors.New(b)
	}
	defer res.Body.Close()
	_, err = io.Copy(out, res.Body)
	if err != nil {
		return err
	}
	return out.Close()
}

func fileSha1(path string) string {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}
	return fmt.Sprintf("%x", sha1.Sum(data))
}

// TriggerBackgroundUpdate will trigger an update to the client in the background
func TriggerBackgroundUpdate() {
	if IsUpdateNeeded("background") {
		exec.Command(binPath, "update", "--background").Start()
	}
}
