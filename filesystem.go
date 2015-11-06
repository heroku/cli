package main

import (
	"os"
	"os/user"
	"path/filepath"
	"runtime"
)

// HomeDir is the user's home directory
var HomeDir = homeDir()

// AppDir is the .heroku path
func AppDir() string {
	if runtime.GOOS == "windows" {
		dir := os.Getenv("LOCALAPPDATA")
		if dir != "" {
			return filepath.Join(dir, "heroku")
		}
	}
	return filepath.Join(HomeDir, ".heroku")
}

func homeDir() string {
	home := os.Getenv("HOME")
	if home != "" {
		return home
	}
	user, err := user.Current()
	if err != nil {
		panic(err)
	}
	return user.HomeDir
}
