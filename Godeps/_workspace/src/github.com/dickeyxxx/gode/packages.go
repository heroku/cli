package gode

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
)

// Package represents an npm package.
type Package struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// Packages returns a list of npm packages installed.
func (c *Client) Packages() ([]Package, error) {
	cmd, err := c.execNpm("list", "--json", "--depth=0")
	if err != nil {
		return nil, err
	}
	var response map[string]map[string]Package
	output, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	err = cmd.Start()
	if err != nil {
		return nil, err
	}
	err = json.NewDecoder(output).Decode(&response)
	if err != nil {
		return nil, err
	}
	err = cmd.Wait()
	if err != nil {
		return nil, err
	}
	packages := make([]Package, 0, len(response["dependencies"]))
	for name, p := range response["dependencies"] {
		p.Name = name
		packages = append(packages, p)
	}
	return packages, nil
}

// InstallPackage installs an npm package.
func (c *Client) InstallPackage(name string) error {
	cmd, err := c.execNpm("install", name)
	if err != nil {
		return err
	}
	return cmd.Run()
}

func (c *Client) execNpm(args ...string) (*exec.Cmd, error) {
	nodePath, err := filepath.Rel(c.RootPath, c.nodePath())
	if err != nil {
		return nil, err
	}
	npmPath, err := filepath.Rel(c.RootPath, c.npmPath())
	if err != nil {
		return nil, err
	}
	args = append([]string{npmPath}, args...)
	cmd := exec.Command(nodePath, args...)
	cmd.Dir = c.RootPath
	cmd.Env = c.environ()
	cmd.Stderr = os.Stderr
	return cmd, nil
}

func (c *Client) environ() []string {
	env := append(os.Environ(), "NPM_CONFIG_SPIN=false")
	if c.Registry != "" {
		env = append(env, "NPM_CONFIG_REGISTRY="+c.Registry)
	}
	return env
}
