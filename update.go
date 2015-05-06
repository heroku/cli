package main

import (
	"compress/gzip"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"syscall"
	"time"

	"github.com/dickeyxxx/golock"
)

var updateTopic = &Topic{
	Name:        "update",
	Description: "update heroku-cli",
}

var updateCmd = &Command{
	Topic:       "update",
	Description: "updates heroku-cli",
	Args:        []Arg{{Name: "channel", Optional: true}},
	Run: func(ctx *Context) {
		channel := ctx.Args.(map[string]string)["channel"]
		if channel == "" {
			channel = Channel
		}
		Update(channel)
	},
}

var binPath = filepath.Join(AppDir, "heroku-cli")
var updateLockPath = filepath.Join(AppDir, "updating.lock")
var autoupdateFile = filepath.Join(AppDir, "autoupdate")

func init() {
	if runtime.GOOS == "windows" {
		binPath = binPath + ".exe"
	}
}

// Update updates the CLI and plugins
func Update(channel string) {
	touchAutoupdateFile()
	if err := golock.Lock(updateLockPath); err != nil {
		panic(err)
	}
	defer golock.Unlock(updateLockPath)
	done := make(chan bool)
	go func() {
		updateCLI(channel)
		updatePlugins()
		done <- true
	}()
	select {
	case <-time.After(time.Second * 120):
		Errln("Timed out while updating")
	case <-done:
	}
}

func updatePlugins() {
	Err("updating plugins... ")
	b, _ := node.UpdatePackages()
	Errln("done")
	if len(b) > 0 {
		Err("rebuilding plugins cache... ")
		ClearPluginCache()
		WritePluginCache(GetPlugins())
		Errln("done")
	}
}

func updateCLI(channel string) {
	Err("checking for CLI update... ")
	manifest := getUpdateManifest(channel)
	if manifest.Version == Version && manifest.Channel == Channel {
		Errf("already on latest version %s\n", Version)
		return
	}
	if !updatable() {
		Errf("Out of date: You are running %s but %s is out\n", Version, manifest.Version)
		return
	}
	Errf("updating from %s to %s (%s)... ", Version, manifest.Version, manifest.Channel)
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
	if err := os.Rename(binPath, binPath+".old"); err != nil {
		panic(err)
	}
	if err := os.Rename(binPath+".new", binPath); err != nil {
		panic(err)
	}
	Errln("done")
	reexecBin()
}

// IsUpdateNeeded checks if an update is available
func IsUpdateNeeded(t string) bool {
	f, err := os.Stat(autoupdateFile)
	if err != nil {
		return true
	}
	if t == "soft" {
		return time.Since(f.ModTime()) > 1*time.Hour
	}
	return time.Since(f.ModTime()) > 168*time.Hour
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

func getUpdateManifest(channel string) manifest {
	res, err := http.Get("https://d1gvo455cekpjp.cloudfront.net/" + channel + "/manifest.json")
	if err != nil {
		panic(err)
	}
	var m manifest
	json.NewDecoder(res.Body).Decode(&m)
	return m
}

func updatable() bool {
	path, err := filepath.Abs(os.Args[0])
	if err != nil {
		Errln(err)
	}
	return path == binPath
}

func downloadBin(path, url string) error {
	out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	client := &http.Client{}
	req, err := http.NewRequest("GET", url+".gz", nil)
	if err != nil {
		return err
	}
	req.Header.Add("Accept-Encoding", "gzip")
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	uncompressed, err := gzip.NewReader(resp.Body)
	if err != nil {
		return err
	}
	_, err = io.Copy(out, uncompressed)
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

func reexecBin() {
	if runtime.GOOS == "windows" {
		cmd := exec.Command(binPath, os.Args[1:]...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		os.Exit(0)
	} else {
		if err := syscall.Exec(binPath, os.Args, os.Environ()); err != nil {
			panic(err)
		}
		os.Exit(99) // should never happen
	}
}

// TriggerBackgroundUpdate will trigger an update to the client in the background
func TriggerBackgroundUpdate() {
	if err := exec.Command(binPath, "update").Start(); err != nil {
		panic(err)
	}
}
