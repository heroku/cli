package main

import (
	"fmt"
	"runtime"
)

var versionTopic = &Topic{
	Name:        "version",
	Description: "print the version",
}

var versionCmd = &Command{
	Topic:       "version",
	Description: "print the version",
	Run: func(ctx *Context) {
		fmt.Printf("heroku-cli/%s (%s-%s) %s", Version, runtime.GOARCH, runtime.GOOS, runtime.Version())
		if Channel != "master" {
			fmt.Printf(" %s", Channel)
		}
		fmt.Println()
	},
}
