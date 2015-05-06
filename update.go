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
			channel = "master"
		}
		Errf("updating plugins... ")
		start := time.Now()
		updatePlugins()
		Errln("done. Took", time.Since(start).String())
		manifest := getUpdateManifest(channel)
		build := manifest.Builds[runtime.GOOS][runtime.GOARCH]
		Errf("updating to %s (%s)... ", manifest.Version, manifest.Channel)
		start = time.Now()
		update(build.URL, build.Sha1)
		Errln("done. Took", time.Since(start).String())
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
func Update() {
	if err := golock.Lock(updateLockPath); err != nil {
		panic(err)
	}
	defer golock.Unlock(updateLockPath)
	touchAutoupdateFile()
	doneUpdatingPlugins := make(chan bool)
	done := make(chan bool)
	go func() {
		updatePlugins()
		doneUpdatingPlugins <- true
	}()
	go func() {
		updateCLI()
		<-doneUpdatingPlugins // wait till plugins are done
		done <- true
	}()
	select {
	case <-time.After(time.Second * 30):
		Errln("Timed out while updating")
	case <-done:
	}
}

func updatePlugins() {
	node.UpdatePackages()
	ClearPluginCache()
	WritePluginCache(GetPlugins())
}

func updateCLI() {
	manifest := getUpdateManifest(Channel)
	if manifest.Version == Version {
		return
	}
	if !updatable() {
		Errf("Out of date: You are running %s but %s is out.\n", Version, manifest.Version)
		return
	}
	build := manifest.Builds[runtime.GOOS][runtime.GOARCH]
	update(build.URL, build.Sha1)
}

// IsUpdateNeeded checks if an update is available
func IsUpdateNeeded() bool {
	if Version == "dev" {
		return false
	}
	f, err := os.Stat(autoupdateFile)
	if err != nil {
		return true
	}
	return time.Since(f.ModTime()) > 1*time.Hour
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

func update(url, sha1 string) {
	// on windows we can't remove an existing file or remove the running binary
	// so we download the file to binName.new
	// move the running binary to binName.old (deleting any existing file first)
	// rename the downloaded file to binName
	if err := downloadBin(binPath+".new", url); err != nil {
		panic(err)
	}
	if fileSha1(binPath+".new") != sha1 {
		panic("SHA mismatch")
	}
	os.Remove(binPath + ".old")
	if err := os.Rename(binPath, binPath+".old"); err != nil {
		panic(err)
	}
	if err := os.Rename(binPath+".new", binPath); err != nil {
		panic(err)
	}
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
