package main

import (
	"os/exec"
	"os"
	"path/filepath"
	"fmt"
)

// Go flag for the name of this binary on the filesystem
var TargetBin = "unset"

// Shared token between this binary and sfdx. This enables us to know if sfdx was invoked by this process.
var CliToken = "unset"

func main() {
	cmd := filepath.Dir(os.Args[0]) + string(os.PathSeparator) + TargetBin


	args := os.Args;
	args = append(args, CliToken)

	if _, err := os.Stat(cmd); os.IsNotExist(err) {
		fmt.Fprintln(os.Stdout, "The sfdx command is not found at: ", cmd)
		os.Exit(1)
	}

	command := exec.Command(cmd, args[1:]...)

	command.Stdout = os.Stdout;
	command.Stderr = os.Stderr;
	command.Stdin = os.Stdin;

	command.Start();
	command.Wait();

	os.Exit(0);
}