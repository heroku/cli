// +build !test

package main

import (
	"os"
	"runtime"
)

func main() {
	defer handlePanic()
	runtime.GOMAXPROCS(1) // more procs causes runtime: failed to create new OS thread on Ubuntu

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
