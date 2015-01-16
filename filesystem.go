package main

import (
	"os"
	"os/user"
	"path/filepath"
)

// The user's home directory
var HomeDir = homeDir()

// The user's Heroku directory we use to cache dependencies, store plugins, write log files (among other things).
var AppDir = filepath.Join(HomeDir, ".heroku")

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
