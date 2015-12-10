package gode

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
)

// RunScript runs a given script in node
// Returns an *os/exec.Cmd instance
func RunScript(script string) *exec.Cmd {
	cmd := exec.Command(nodePath, "-e", script)
	cmd.Env = append(os.Environ(), "NODE_PATH="+modulesDir())
	cmd.Dir = rootPath
	return cmd
}

// DebugScript is the same as RunScript except it launches with node-inspector
func DebugScript(script string) *exec.Cmd {
	scriptPath := filepath.Join(rootPath, "debug.js")
	if err := ioutil.WriteFile(scriptPath, []byte(script), 0644); err != nil {
		panic(err)
	}
	path := filepath.Join(rootPath, "node_modules", ".bin", "node-debug")
	if _, err := exec.LookPath(path); err != nil {
		fmt.Print("Installing node-inspector... ")
		InstallPackage("node-inspector")
		fmt.Println("done")
	}
	cmd := exec.Command(path, "debug.js")
	cmd.Dir = rootPath
	return cmd
}
