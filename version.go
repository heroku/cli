package main

import (
	"fmt"
	"runtime"
)

var versionTopic = &Topic{
	Name:      "version",
	ShortHelp: "print the version",
}

var versionCmd = &Command{
	Topic:     "version",
	ShortHelp: "print the version",
	Run: func(ctx *Context) {
		fmt.Printf("heroku-cli/%s (%s-%s) %s\n", Version, runtime.GOARCH, runtime.GOOS, runtime.Version())
		if Channel != "master" {
			fmt.Printf("Channel: %s\n", Channel)
		}
	},
}
