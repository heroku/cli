package main

import (
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"runtime"

	"github.com/kardianos/osext"
)

// WINDOWS is "windows"
const WINDOWS = "windows"

// HomeDir is the user's home directory
var HomeDir = homeDir()

// AppDir is the subdirectory the binary is running from
var AppDir = appDir()

// DataHome is XDG_CONFIG_HOME/heroku or equivalent
var DataHome = dataHome()

func homeDir() string {
	home := os.Getenv("HOME")
	if home != "" {
		return home
	}
	user, err := user.Current()
	must(err)
	return user.HomeDir
}

func appDir() string {
	d, err := osext.ExecutableFolder()
	must(err)
	return filepath.Join(d, "..")
}

func dataHome() string {
	d := os.Getenv("XDG_DATA_HOME")
	if d == "" {
		if runtime.GOOS == WINDOWS && localAppData() != "" {
			d = localAppData()
		} else {
			d = filepath.Join(HomeDir, ".local", "share")
		}
	}
	d = filepath.Join(d, "heroku-cli")
	must(mkdirp(d))
	return d
}

func localAppData() string {
	return os.Getenv("LOCALAPPDATA")
}

// FileExists returns whether or not path exists
func FileExists(path string) (bool, error) {
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func mkdirp(path string) error {
	err := os.MkdirAll(path, 0755)
	if os.IsPermission(err) && runtime.GOOS != "windows" {
		fmt.Fprintf(os.Stderr, "Error creating %s which is needed for the Heroku CLI.\nRun `sudo mkdir -p %s && sudo chown $USER %s` to create this directory.\n", path, path, path)
		os.Exit(1)
	}
	return err
}
