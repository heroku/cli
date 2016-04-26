package main

import (
	"fmt"
	"runtime"
)

func init() {
	Topics = append(Topics, &Topic{
		Name:   "version",
		Hidden: true,
		Commands: CommandSet{
			{
				Topic:            "version",
				Description:      "print the version",
				DisableAnalytics: true,
				Help: `Shows the Heroku CLI version.

Example:

  $ heroku version
	heroku-cli/1.2.3 (x86_64-darwin11.2.0) ruby/1.9.3`,
				Run: func(ctx *Context) {
					ShowVersion()
				},
			},
		},
	})
}

func version() string {
	return fmt.Sprintf("heroku-cli/%s (%s-%s) %s", Version, runtime.GOOS, runtime.GOARCH, runtime.Version())
}

// ShowVersion shows the version and exits
func ShowVersion() {
	Printf(version())
	if Channel != "stable" {
		Printf(" %s", Channel)
	}
	Println()
}
