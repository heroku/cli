package gode

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// Package represents an npm package.
type Package struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// Packages returns a list of npm packages installed.
func (c *Client) Packages() ([]Package, error) {
	stdout, stderr, err := c.execNpm("list", "--json", "--depth=0")
	if err != nil {
		return nil, errors.New(stderr)
	}
	var response map[string]map[string]Package
	if err := json.Unmarshal([]byte(stdout), &response); err != nil {
		return nil, errors.New(stderr)
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
	_, stderr, err := c.execNpm("install", name)
	if err != nil {
		if strings.Contains(stderr, "no such package available") {
			return errors.New("no such package available")
		}
		return errors.New(stderr)
	}
	return nil
}

// RemovePackage removes an npm package.
func (c *Client) RemovePackage(name string) error {
	_, stderr, err := c.execNpm("remove", name)
	if err != nil {
		return errors.New(stderr)
	}
	return nil
}

// UpdatePackages updates all packages.
func (c *Client) UpdatePackages() (string, error) {
	stdout, stderr, err := c.execNpm("update")
	if err != nil {
		return stdout, errors.New(stderr)
	}
	return stdout, nil
}

// UpdatePackage updates a package.
func (c *Client) UpdatePackage(name string) (string, error) {
	stdout, stderr, err := c.execNpm("update", name)
	if err != nil {
		return stdout, errors.New(stderr)
	}
	return stdout, nil
}

func (c *Client) execNpm(args ...string) (string, string, error) {
	if err := os.MkdirAll(filepath.Join(c.RootPath, "node_modules"), 0755); err != nil {
		return "", "", err
	}
	nodePath, err := filepath.Rel(c.RootPath, c.nodePath())
	if err != nil {
		return "", "", err
	}
	npmPath, err := filepath.Rel(c.RootPath, c.npmPath())
	if err != nil {
		return "", "", err
	}
	args = append([]string{npmPath}, args...)
	cmd := exec.Command(nodePath, args...)
	cmd.Dir = c.RootPath
	cmd.Env = c.environ()
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err = cmd.Run()
	return stdout.String(), stderr.String(), err
}

func (c *Client) environ() []string {
	env := append(os.Environ(), "NPM_CONFIG_SPIN=false")
	env = append(env, "NPM_CONFIG_AUTO_AUTH=false")
	env = append(env, "NPM_CONFIG_CACHE="+filepath.Join(c.RootPath, ".npm-cache"))
	if os.Getenv("HTTP_PROXY") != "" {
		env = append(env, "HTTP_PROXY="+os.Getenv("HTTP_PROXY"))
	}
	if os.Getenv("HTTPS_PROXY") != "" {
		env = append(env, "HTTPS_PROXY="+os.Getenv("HTTPS_PROXY"))
	}
	if c.Registry != "" {
		env = append(env, "NPM_CONFIG_REGISTRY="+c.Registry)
	}
	return env
}
