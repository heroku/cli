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
	CLITopics = append(CLITopics, &Topic{
		Name:        "update",
		Description: "update heroku-cli",
		Commands: Commands{
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

// UpdateLockPath is the path to the updating lock file
var UpdateLockPath = filepath.Join(CacheHome, "updating.lock")
var autoupdateFile = filepath.Join(CacheHome, "autoupdate")

// Update updates the CLI and plugins
func Update(channel string) {
	touchAutoupdateFile()
	updateCLI(channel)
	SubmitAnalytics()
	UserPlugins.Update()
	UserPlugins.MigrateRubyPlugins()
	deleteOldPluginsDirectory()
	truncate(ErrLogPath, 1000)
	cleanTmp()
}

func updateCLI(channel string) {
	if Autoupdate == "no" {
		WarnIfError(merry.Errorf("Update CLI with apt-get update && apt-get upgrade"))
		return
	}
	if config.LockChannel != "" {
		if channel != Channel && channel != config.LockChannel {
			ExitWithMessage("channel must be " + config.LockChannel)
		}
		channel = config.LockChannel
	}
	manifest := GetUpdateManifest(channel, config.LockVersion)
	if npmExists() && manifest.Version == Version && manifest.Channel == Channel {
		return
	}
	DownloadCLI(channel, filepath.Join(DataHome, "cli"), manifest)
	loadNewCLI()
}

// DownloadCLI downloads a CLI update to a given path
func DownloadCLI(channel, path string, manifest *Manifest) {
	locked, err := golock.IsLocked(UpdateLockPath)
	LogIfError(err)
	if locked {
		ExitWithMessage("Update in progress")
	}
	LogIfError(golock.Lock(UpdateLockPath))
	unlock := func() {
		golock.Unlock(UpdateLockPath)
	}
	defer unlock()
	hideCursor()
	downloadingMessage := fmt.Sprintf("heroku-cli: Updating to %s...", manifest.Version)
	if manifest.Channel != "stable" {
		downloadingMessage = fmt.Sprintf("%s (%s)", downloadingMessage, manifest.Channel)
	}
	Logln(downloadingMessage)
	build := manifest.Builds[runtime.GOOS+"-"+runtime.GOARCH]
	if build == nil {
		must(merry.Errorf("no build for %s", manifest.Channel))
	}
	reader, getSha, err := downloadXZ(build.URL, downloadingMessage)
	must(err)
	tmp := tmpDir(DataHome)
	must(extractTar(reader, tmp))
	sha := getSha()
	if sha != build.Sha256 {
		must(merry.Errorf("SHA mismatch: expected %s to be %s", sha, build.Sha256))
	}
	exists, _ := FileExists(path)
	if exists {
		WarnIfError(os.Rename(expectedBinPath(), filepath.Join(tmpDir(DataHome), "heroku")))
		must(os.Rename(path, filepath.Join(tmpDir(DataHome), "heroku")))
	}
	must(os.Rename(filepath.Join(tmp, "heroku"), path))
	Debugf("updated to %s\n", manifest.Version)
}

// IsUpdateNeeded checks if an update is available
func IsUpdateNeeded() bool {
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

var updateManifestRetrying = false

// GetUpdateManifest loads the manifest.json for a channel
func GetUpdateManifest(channel, version string) *Manifest {
	var m Manifest
	url := "https://cli-assets.heroku.com/branches/" + channel + "/manifest.json"
	if version != "" {
		Errln("heroku-cli: locked to " + version)
		url = "https://cli-assets.heroku.com/branches/" + channel + "/" + version + "/manifest.json"
	}
	rsp, err := sling.New().Get(url).ReceiveSuccess(&m)
	if err != nil && !updateManifestRetrying {
		updateManifestRetrying = true
		return GetUpdateManifest(channel, version)
	}
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

func cleanTmp() {
	clean := func(base string) {
		dir := filepath.Join(base, "tmp")
		if exists, _ := FileExists(dir); !exists {
			return
		}
		files, err := ioutil.ReadDir(dir)
		LogIfError(err)
		for _, file := range files {
			if time.Since(file.ModTime()) > 24*time.Hour {
				path := filepath.Join(dir, file.Name())
				Debugf("removing old tmp: %s\n", path)
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
	expected, err := os.Stat(expectedBinPath())
	if err != nil {
		if os.IsNotExist(err) {
			if !npmExists() {
				Debugln("npm does not exist, forcing update")
				Update(Channel)
			}
			return
		}
		must(err)
	}
	current, err := os.Stat(BinPath)
	must(err)
	if !os.SameFile(current, expected) {
		bin := expectedBinPath()
		Debugf("Executing %s\n", bin)
		swallowSigint = true
		cmd := exec.Command(bin, Args[1:]...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		os.Exit(getExitCode(err))
	}
}

func npmExists() bool {
	exists, _ := FileExists(npmBinPath())
	return exists
}

// deleteOldPluginsDirectory removes the v4 directory
// this is a problem on windows because node will recurse up until it finds a node_modules directory
func deleteOldPluginsDirectory() {
	os.RemoveAll(filepath.Join(DataHome, "node_modules"))
}
