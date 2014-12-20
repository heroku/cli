package main

import (
	"fmt"
	"runtime"
)

var version = &Topic{
	Name:      "version",
	ShortHelp: "print the version",
	Commands: []*Command{
		{
			ShortHelp: "print the version",
			Run: func(ctx *Context) {
				fmt.Printf("heroku-toolbelt/%s (%s-%s) %s\n", Version, runtime.GOARCH, runtime.GOOS, runtime.Version())
				if Channel != "master" {
					fmt.Printf("Channel: %s\n", Channel)
				}
			},
		},
	},
}
