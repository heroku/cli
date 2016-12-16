package main

import (
	"os/exec"
	"os"
	"fmt"
)

const GO_FLAG_INIT_STATE = "unset"

// Go flag for the name of this binary on the filesystem
var BinaryName = GO_FLAG_INIT_STATE

// Shared token between this binary and sfdx. This enables us to know if sfdx was invoked by this process.
var CliToken = GO_FLAG_INIT_STATE

func main() {
	args := os.Args;
	args = append(args, CliToken)

	path, lookPathErr := exec.LookPath(BinaryName)

	if lookPathErr != nil {
		fmt.Fprintln(os.Stdout, "The %s command is not found.", BinaryName)
		os.Exit(1)
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		fmt.Fprintln(os.Stdout, "Couldn't execute .", path)
		os.Exit(1)
	}

	command := exec.Command(path, args[1:]...)

	command.Stdout = os.Stdout;
	command.Stderr = os.Stderr;
	command.Stdin = os.Stdin;

	command.Start();
	command.Wait();

	os.Exit(0);
}