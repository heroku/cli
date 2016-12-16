package main

import (
	"fmt"
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

// ConfigHome is XDG_CONFIG_HOME/FOLDER_NAME or equivalent
var ConfigHome = configHome()

// DataHome is XDG_CONFIG_HOME/FOLDER_NAME or equivalent
var DataHome = dataHome()

// CacheHome is XDG_CACHE_HOME/FOLDER_NAME or equivalent
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
	d = filepath.Join(d, FolderName)
	must(mkdirp(d))
	return d
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
	d = filepath.Join(d, FolderName)
	must(mkdirp(d))
	return d
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
	d = filepath.Join(d, FolderName)
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

func tmpDir(base string) string {
	root := filepath.Join(base, "tmp")
	err := mkdirp(root)
	must(err)
	dir, err := ioutil.TempDir(root, "")
	must(err)
	return dir
}

func mkdirp(path string) error {
	err := os.MkdirAll(path, 0755)
	if os.IsPermission(err) && runtime.GOOS != "windows" {
		fmt.Fprintf(os.Stderr, "Error creating %s which is needed for the SFDX CLI.\nRun `sudo mkdir -p %s && sudo chown $USER %s` to create this directory.\n", path, path, path)
		os.Exit(1)
	}
	return err
}
