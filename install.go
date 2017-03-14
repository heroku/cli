package main

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"github.com/ansel1/merry"
	"github.com/dghubble/sling"
	"github.com/dickeyxxx/golock"
)

var installLockPath = filepath.Join(DataHome, "v5.lock")

// Install installs the CLI
func Install(channel string) {
	if exists, err := FileExists(binPath()); exists || err != nil {
		WarnIfError(err)
		return
	}
	os := runtime.GOOS
	arch := runtime.GOARCH
	if arch == "amd64" {
		arch = "x64"
	}
	manifest := GetUpdateManifest(channel, os, arch)
	DownloadCLI(channel, filepath.Join(DataHome, "cli"), os, arch, manifest)
}

// DownloadCLI downloads a CLI update to a given path
func DownloadCLI(channel, path, runtimeOS, runtimeARCH string, manifest *Manifest) {
	locked, err := golock.IsLocked(installLockPath)
	LogIfError(err)
	if locked {
		Warn("Update in progress")
	}
	LogIfError(golock.Lock(installLockPath))
	unlock := func() {
		golock.Unlock(installLockPath)
	}
	defer unlock()
	downloadingMessage := fmt.Sprintf("heroku-cli: Updating to %s...", manifest.Version)
	if Channel != "stable" {
		downloadingMessage = fmt.Sprintf("%s (%s)", downloadingMessage, Channel)
	}
	url := "http://cli-assets.heroku.com/heroku-cli/channels/" + channel + "/heroku-cli-v" + manifest.Version + "-" + runtimeOS + "-" + runtimeARCH + ".tar.xz"
	reader, getSha, err := downloadXZ(url, downloadingMessage)
	must(err)
	tmp := filepath.Join(DataHome, "tmp")
	mkdirp(tmp)
	defer os.RemoveAll(tmp)
	must(extractTar(reader, tmp))
	sha := getSha()
	if sha != manifest.Sha256XZ {
		must(merry.Errorf("SHA mismatch: expected %s to be %s", sha, manifest.Sha256XZ))
	}
	exists, _ := FileExists(path)
	if exists {
		must(os.RemoveAll(path))
	}
	must(os.Rename(filepath.Join(tmp, "heroku-cli-v"+manifest.Version+"-"+runtimeOS+"-"+runtimeARCH), path))
	Debugf("updated to %s\n", manifest.Version)
}

// Manifest is the manifest.json for releases
type Manifest struct {
	Version  string `json:"version"`
	Sha256XZ string `json:"sha256xz"`
}

var updateManifestRetrying = false

// GetUpdateManifest loads the manifest.json for a channel
func GetUpdateManifest(channel, os, arch string) *Manifest {
	var m Manifest
	url := "http://cli-assets.heroku.com/heroku-cli/channels/" + channel + "/" + os + "-" + arch
	rsp, err := sling.New().Client(apiHTTPClient).Get(url).ReceiveSuccess(&m)
	if err != nil && !updateManifestRetrying {
		updateManifestRetrying = true
		return GetUpdateManifest(channel, os, arch)
	}
	must(err)
	must(getHTTPError(rsp))
	return &m
}

func binPath() string {
	bin := filepath.Join(DataHome, "cli", "bin", "heroku")
	if runtime.GOOS == WINDOWS {
		bin = bin + ".cmd"
	}
	return bin
}
