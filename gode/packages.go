package gode

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
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
func Packages() ([]Package, error) {
	stdout, stderr, err := execNpm("list", "--json", "--depth=0")
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
func InstallPackage(packages ...string) error {
	args := append([]string{"install"}, packages...)
	_, stderr, err := execNpm(args...)
	if err != nil {
		if strings.Contains(stderr, "no such package available") {
			return errors.New("no such package available")
		}
		return errors.New(stderr)
	}
	return nil
}

// RemovePackage removes an npm package.
func RemovePackage(name string) error {
	_, stderr, err := execNpm("remove", name)
	if err != nil {
		return errors.New(stderr)
	}
	return nil
}

// UpdatePackages updates all packages.
func UpdatePackages() (string, error) {
	stdout, stderr, err := execNpm("update")
	if err != nil {
		return stdout, errors.New(stderr)
	}
	return stdout, nil
}

// UpdatePackage updates a package.
func UpdatePackage(name string) (string, error) {
	stdout, stderr, err := execNpm("update", name)
	if err != nil {
		return stdout, errors.New(stderr)
	}
	return stdout, nil
}

func execNpm(args ...string) (string, string, error) {
	if err := os.MkdirAll(filepath.Join(rootPath, "node_modules"), 0755); err != nil {
		return "", "", err
	}
	nodePath, err := filepath.Rel(rootPath, nodePath)
	if err != nil {
		return "", "", err
	}
	npmPath, err := filepath.Rel(rootPath, npmPath)
	if err != nil {
		return "", "", err
	}
	args = append([]string{npmPath}, args...)
	if debugging() {
		args = append(args, "--loglevel=silly")
	}
	cmd := exec.Command(nodePath, args...)
	cmd.Dir = rootPath
	cmd.Env = environ()
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err = cmd.Run()
	if debugging() {
		fmt.Fprintln(os.Stderr, stderr.String())
	}
	return stdout.String(), stderr.String(), err
}

func environ() []string {
	env := append(os.Environ(), "NPM_CONFIG_SPIN=false")
	env = append(env, "NPM_CONFIG_AUTO_AUTH=false")
	env = append(env, "NPM_CONFIG_CACHE="+filepath.Join(rootPath, ".npm-cache"))
	env = append(env, "NPM_CONFIG_REGISTRY="+registry)
	return env
}

func debugging() bool {
	e := os.Getenv("GODE_DEBUG")
	return e == "1" || e == "true"
}
