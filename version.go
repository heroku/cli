package main

import (
	"fmt"
	"runtime"
)

func init() {
	CLITopics = append(CLITopics, &Topic{
		Name:   "version",
		Hidden: true,
		Commands: Commands{
			{
				Topic:            "version",
				Description:      "print the version",
				Hidden:           true,
				DisableAnalytics: true,
				Help: `Shows the ` + DefaultNamespace + ` CLI version.

Example:

  $ ` + getExecutableName() + ` version
	` + getExecutableName() + `-cli/1.2.3 (x86_64-darwin11.2.0) ruby/1.9.3`,
				Run: func(ctx *Context) {
					ShowVersion()
				},
			},
		},
	})
}

func version() string {
	return fmt.Sprintf(getExecutableName()+"-cli/%s (%s-%s) %s", Version, runtime.GOOS, runtime.GOARCH, runtime.Version())
}

// ShowVersion shows the version and exits
func ShowVersion() {
	Printf(version())
	if Channel != "stable" {
		Printf(" %s", Channel)
	}
	Println()
}
