package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

const GoFlagInitState = "unset"

// Go flag for the name of this binary on the filesystem
var BinaryName = GoFlagInitState

// Shared token between this binary and sfdx. This enables us to know if sfdx was invoked by this process.
var CliToken = GoFlagInitState

func main() {
	var path string
	var lookPathErr error
	args := os.Args
	args = append(args, CliToken)

	// Check abs path locations
	curPath := strings.Split(args[0], string(os.PathSeparator))
	if len(curPath) > 1 {
		// Change the last name in the path to the BinaryName
		curPath[len(curPath)-1] = BinaryName
		path, lookPathErr = exec.LookPath(strings.Join(curPath, string(os.PathSeparator)))
	}

	// If not found in the absolute path, check the PATH
	if path == "" || lookPathErr != nil {
		path, lookPathErr = exec.LookPath(BinaryName)
	}

	if lookPathErr != nil {
		fmt.Printf("The %s command is not found.", BinaryName)
		fmt.Println()
		os.Exit(1)
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		fmt.Printf("Couldn't execute %s", path)
		fmt.Println()
		os.Exit(1)
	}

	command := exec.Command(path, args[1:]...)

	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	command.Stdin = os.Stdin

	command.Start()
	command.Wait()

	os.Exit(0)
}
