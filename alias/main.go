package main

import (
	"os/exec"
	"os"
	"path/filepath"
	"fmt"
)

var TargetBin = "unset"

func main() {
	cmd := filepath.Dir(os.Args[0]) + string(os.PathSeparator) + TargetBin


	args := os.Args;
	args = append(args, "--namespace")
	args = append(args, filepath.Base(os.Args[0]))

	if _, err := os.Stat(cmd); os.IsNotExist(err) {
		fmt.Fprintln(os.Stdout, "The sfdx command found at: ", cmd)
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