package main

import (
	"os/user"
	"path/filepath"
)

var HomeDir = homeDir()
var AppDir = filepath.Join(HomeDir, ".heroku")

func homeDir() string {
	user, err := user.Current()
	if err != nil {
		panic(err)
	}
	return user.HomeDir
}
