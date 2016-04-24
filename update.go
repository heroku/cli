package main

import (
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/dickeyxxx/golock"
	"github.com/franela/goreq"
	"github.com/ulikunitz/xz"
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
	truncateErrorLog()
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
	if manifest == nil || (manifest.Version == Version && manifest.Channel == Channel) {
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
	msg := fmt.Sprintf("heroku-cli: Updating to %s", manifest.Version)
	if manifest.Channel != "stable" {
		msg = fmt.Sprintf("%s (%s)", msg, manifest.Channel)
	}
	action(msg, "done", func() {
		build := manifest.Builds[runtime.GOOS][runtime.GOARCH]
		// on windows we can't remove an existing file or remove the running binary
		// so we download the file to binName.new
		// move the running binary to binName.old (deleting any existing file first)
		// rename the downloaded file to binName
		tmpBinPathNew := BinPath + ".new"
		tmpBinPathOld := BinPath + ".old"
		if err := downloadBin(tmpBinPathNew, build.URL); err != nil {
			panic(err)
		}
		if sha, _ := fileSha256(tmpBinPathNew); sha != build.Sha1 {
			panic("SHA mismatch")
		}
		os.Remove(tmpBinPathOld)
		os.Rename(BinPath, tmpBinPathOld)
		if err := os.Rename(tmpBinPathNew, BinPath); err != nil {
			panic(err)
		}
		os.Remove(tmpBinPathOld)
		unlock()
		clearAutoupdateFile() // force full update
	})
	wg.Wait()
	reexec() // reexec to finish updating with new code
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

type manifest struct {
	Channel, Version string
	Builds           map[string]map[string]struct {
		URL, Sha1 string
	}
}

func getUpdateManifest(channel string) (*manifest, error) {
	res, err := goreq.Request{
		Uri:       "https://cli-assets.heroku.com/" + channel + "/manifest.json",
		Timeout:   30 * time.Minute,
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
	defer out.Close()
	res, err := goreq.Request{
		Uri:       url + ".xz",
		Timeout:   30 * time.Minute,
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
	uncompressed, err := xz.NewReader(res.Body)
	if err != nil {
		return err
	}
	_, err = io.Copy(out, uncompressed)
	return err
}

// TriggerBackgroundUpdate will trigger an update to the client in the background
func TriggerBackgroundUpdate() {
	wg.Add(1)
	go func() {
		wg.Done()
		if IsUpdateNeeded("background") {
			exec.Command(BinPath, "update", "--background").Start()
		}
	}()
}

// restarts the CLI with the same arguments
func reexec() {
	Debugln("reexecing new CLI...")
	cmd := exec.Command(BinPath, os.Args[1:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	Exit(getExitCode(cmd.Run()))
}

func maxint(a, b int) int {
	if a > b {
		return a
	}
	return b
}
