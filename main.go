// +build !test

package main

import (
	"os"
	"runtime"
)

func main() {
	defer handlePanic()
	runtime.GOMAXPROCS(1) // more procs causes runtime: failed to create new OS thread on Ubuntu
	if runtime.GOARCH == "arm" {
		Warn("Using deprecated v5 Heroku CLI.\nWe no longer provide autoupdates for arm systems.\nPlease reinstall following npm instructions at https://cli.heroku.com to receive further updates.")
	}

	// handle sigint
	handleSignal(os.Interrupt, func() {
		if !swallowSigint {
			ShowCursor()
			os.Exit(1)
		}
	})

	Start(os.Args...)
	Exit(0)
}
