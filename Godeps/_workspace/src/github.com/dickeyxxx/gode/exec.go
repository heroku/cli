package gode

import (
	"fmt"
	"io/ioutil"
	"os/exec"
	"path/filepath"
)

// RunScript runs a given script in node
// Returns an *os/exec.Cmd instance
func (c *Client) RunScript(script string) *exec.Cmd {
	nodePath, err := filepath.Rel(c.RootPath, c.nodePath())
	if err != nil {
		panic(err)
	}
	cmd := exec.Command(nodePath, "-e", script)
	cmd.Dir = c.RootPath
	return cmd
}

// DebugScript is the same as RunScript except it launches with node-inspector
func (c *Client) DebugScript(script string) *exec.Cmd {
	scriptPath := filepath.Join(c.RootPath, "debug.js")
	if err := ioutil.WriteFile(scriptPath, []byte(script), 0644); err != nil {
		panic(err)
	}
	path := filepath.Join(c.RootPath, "node_modules", ".bin", "node-debug")
	if _, err := exec.LookPath(path); err != nil {
		fmt.Print("Installing node-inspector... ")
		c.InstallPackage("node-inspector")
		fmt.Println("done")
	}
	cmd := exec.Command(path, "debug.js")
	cmd.Dir = c.RootPath
	return cmd
}
