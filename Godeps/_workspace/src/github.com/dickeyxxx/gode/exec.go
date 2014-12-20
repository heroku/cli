package gode

import (
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
