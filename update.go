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
	"time"
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
		channel := ctx.Args["channel"]
		if channel == "" {
			channel = "master"
		}
		Errf("updating plugins... ")
		must(node.UpdatePackages())
		Errln("done")
		manifest := getUpdateManifest(channel)
		build := manifest.Builds[runtime.GOOS][runtime.GOARCH]
		Errf("updating to %s (%s)... ", manifest.Version, manifest.Channel)
		update(build.URL, build.Sha1)
		Errln("done")
	},
}

var binPath = filepath.Join(AppDir, "heroku-cli")

func init() {
	if runtime.GOOS == "windows" {
		binPath = binPath + ".exe"
	}
}

// UpdateIfNeeded checks for and performs an autoupdate if there is a new version out.
func UpdateIfNeeded() {
	if !updateNeeded() {
		return
	}
	node.UpdatePackages()
	manifest := getUpdateManifest(Channel)
	if manifest.Version == Version {
		// Set timestamp of bin so we don't update again
		os.Chtimes(binPath, time.Now(), time.Now())
		return
	}
	if !updatable() {
		Errf("Out of date: You are running %s but %s is out.\n", Version, manifest.Version)
		return
	}
	// Leave out updating text until heroku-cli is used in place of ruby cli
	// So it doesn't confuse users with 2 different version numbers
	//Errf("Updating to %s... ", manifest.Version)
	build := manifest.Builds[runtime.GOOS][runtime.GOARCH]
	update(build.URL, build.Sha1)
	//Errln("done")
	execBin()
	os.Exit(0)
}

func updateNeeded() bool {
	if Version == "dev" {
		return false
	}
	f, err := os.Stat(binPath)
	if err != nil {
		Errln("WARNING: Error autoupdating. The CLI will not be able to update itself.")
		return false
	}
	// TODO: Increase the autoupdate time later
	return f.ModTime().Add(2 * time.Minute).Before(time.Now())
}

type manifest struct {
	Channel, Version string
	Builds           map[string]map[string]struct {
		URL, Sha1 string
	}
}

func getUpdateManifest(channel string) manifest {
	res, err := http.Get("http://d1gvo455cekpjp.cloudfront.net/" + channel + "/manifest.json")
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
	tmp, err := downloadBin(url)
	if err != nil {
		panic(err)
	}
	if fileSha1(tmp) != sha1 {
		panic("SHA mismatch")
	}
	if err := os.Rename(tmp, binPath); err != nil {
		panic(err)
	}
}

func downloadBin(url string) (string, error) {
	out, err := os.OpenFile(binPath+"~", os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return "", err
	}
	defer out.Close()
	client := &http.Client{}
	req, err := http.NewRequest("GET", url+".gz", nil)
	if err != nil {
		return "", err
	}
	req.Header.Add("Accept-Encoding", "gzip")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	uncompressed, err := gzip.NewReader(resp.Body)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(out, uncompressed)
	return out.Name(), err
}

func fileSha1(path string) string {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}
	return fmt.Sprintf("%x", sha1.Sum(data))
}

func execBin() {
	cmd := exec.Command(binPath, os.Args[1:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		panic(err)
	}
}
