package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/ansel1/merry"
	"github.com/dghubble/sling"
	"github.com/dickeyxxx/golock"
)

func init() {
	Topics = append(Topics, &Topic{
		Name:        "update",
		Description: "update heroku-cli",
		Commands: CommandSet{
			{
				Topic:            "update",
				Hidden:           true,
				Description:      "updates the Heroku CLI",
				DisableAnalytics: true,
				Args:             []Arg{{Name: "channel", Optional: true}},
				Run: func(ctx *Context) {
					channel := ctx.Args.(map[string]string)["channel"]
					if channel == "" {
						channel = Channel
					}
					Update(channel)
				},
			},
		},
	})
}

// Autoupdate is a flag to enable/disable CLI autoupdating
var Autoupdate = "no"

var updateLockPath = filepath.Join(CacheHome, "updating.lock")
var autoupdateFile = filepath.Join(CacheHome, "autoupdate")

// Update updates the CLI and plugins
func Update(channel string) {
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
	manifest := getUpdateManifest(channel)
	binExists, _ := fileExists(expectedBinPath())
	if binExists && manifest.Version == Version && manifest.Channel == Channel {
		return
	}
	locked, err := golock.IsLocked(updateLockPath)
	LogIfError(err)
	if locked {
		must(merry.Errorf("Update in progress"))
	}
	LogIfError(golock.Lock(updateLockPath))
	unlock := func() {
		golock.Unlock(updateLockPath)
	}
	defer unlock()
	hideCursor()
	downloadingMessage = fmt.Sprintf("heroku-cli: Updating to %s...", manifest.Version)
	if manifest.Channel != "stable" {
		downloadingMessage = fmt.Sprintf("%s (%s)", downloadingMessage, manifest.Channel)
	}
	Logln(downloadingMessage)
	build := manifest.Builds[runtime.GOOS+"-"+runtime.GOARCH]
	if build == nil {
		must(merry.Errorf("no build for %s", manifest.Channel))
	}
	reader, getSha, err := downloadXZ(build.URL)
	must(err)
	tmp := tmpDir(DataHome)
	must(extractTar(reader, tmp))
	sha := getSha()
	if sha != build.Sha256 {
		must(merry.Errorf("SHA mismatch: expected %s to be %s", sha, build.Sha256))
	}
	LogIfError(os.Rename(filepath.Join(DataHome, "cli"), filepath.Join(tmpDir(DataHome), "heroku")))
	LogIfError(os.Rename(filepath.Join(tmp, "heroku"), filepath.Join(DataHome, "cli")))
	unlock()
	Debugln("updating done, loading new cli " + manifest.Version)
	loadNewCLI()
}

// IsUpdateNeeded checks if an update is available
func IsUpdateNeeded() bool {
	if exists, _ := fileExists(expectedBinPath()); !exists {
		return true
	}
	f, err := os.Stat(autoupdateFile)
	if err != nil {
		if os.IsNotExist(err) {
			return true
		}
		LogIfError(err)
		return true
	}
	return time.Since(f.ModTime()) > 4*time.Hour
}

func touchAutoupdateFile() {
	out, err := os.OpenFile(autoupdateFile, os.O_WRONLY|os.O_CREATE, 0644)
	must(err)
	_, err = out.WriteString(time.Now().String())
	must(err)
	err = out.Close()
	must(err)
}

func getUpdateManifest(channel string) *Manifest {
	var m Manifest
	url := "https://cli-assets.heroku.com/branches/" + channel + "/manifest.json"
	rsp, err := sling.New().Get(url).ReceiveSuccess(&m)
	must(err)
	must(getHTTPError(rsp))
	return &m
}

// TriggerBackgroundUpdate will trigger an update to the client in the background
func TriggerBackgroundUpdate() {
	if IsUpdateNeeded() {
		Debugln("triggering background update")
		touchAutoupdateFile()
		exec.Command(BinPath, "update").Start()
	}
}

func cleanTmpDirs() {
	clean := func(base string) {
		dir := filepath.Join(base, "tmp")
		if exists, _ := fileExists(dir); !exists {
			return
		}
		files, err := ioutil.ReadDir(dir)
		LogIfError(err)
		for _, file := range files {
			if time.Since(file.ModTime()) > 24*time.Hour {
				path := filepath.Join(dir, file.Name())
				Debugf("removing old tmp dir %s", path)
				LogIfError(os.RemoveAll(path))
			}
		}
	}
	clean(DataHome)
	clean(CacheHome)
}

func expectedBinPath() string {
	bin := filepath.Join(DataHome, "cli", "bin", "heroku")
	if runtime.GOOS == WINDOWS {
		bin = bin + ".exe"
	}
	return bin
}

func loadNewCLI() {
	if Autoupdate == "no" {
		return
	}
	expected := expectedBinPath()
	if BinPath == expected {
		return
	}
	if exists, _ := fileExists(expected); !exists {
		if exists, _ = fileExists(npmBinPath()); !exists {
			// uh oh, npm isn't where it should be.
			// The CLI probably isn't installed right so force an update
			Update(Channel)
		}
		return
	}
	execBin(expected, os.Args...)
}
