package main

import (
	"io/ioutil"
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

// BinPath is the running executable
var BinPath = binPath()

// AppDir is the subdirectory the binary is running from
var AppDir = appDir()

// ConfigHome is XDG_CONFIG_HOME/heroku or equivalent
var ConfigHome = configHome()

// DataHome is XDG_CONFIG_HOME/heroku or equivalent
var DataHome = dataHome()

// CacheHome is XDG_CACHE_HOME/heroku or equivalent
var CacheHome = cacheHome()

// ErrLogPath is the location of the error log
var ErrLogPath = filepath.Join(CacheHome, "error.log")

func homeDir() string {
	home := os.Getenv("HOME")
	if home != "" {
		return home
	}
	user, err := user.Current()
	must(err)
	return user.HomeDir
}

func binPath() string {
	d, err := osext.Executable()
	must(err)
	return d
}

func appDir() string {
	d, err := osext.ExecutableFolder()
	must(err)
	return filepath.Join(d, "..")
}

func configHome() string {
	d := os.Getenv("XDG_CONFIG_HOME")
	if d == "" {
		d = filepath.Join(HomeDir, ".config")
	}
	return filepath.Join(d, "heroku")
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
	return filepath.Join(d, "heroku")
}

func cacheHome() string {
	d := os.Getenv("XDG_CACHE_HOME")
	if d == "" {
		if runtime.GOOS == WINDOWS && localAppData() != "" {
			d = localAppData()
		} else {
			d = filepath.Join(HomeDir, ".cache")
		}
	}
	return filepath.Join(d, "heroku")
}

func localAppData() string {
	return os.Getenv("LOCALAPPDATA")
}

func fileExists(path string) (bool, error) {
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func tmpDir(base string) string {
	root := filepath.Join(base, "tmp")
	err := os.MkdirAll(root, 0755)
	must(err)
	dir, err := ioutil.TempDir(root, "")
	must(err)
	return dir
}
