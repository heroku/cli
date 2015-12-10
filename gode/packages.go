package gode

import (
	"bytes"
	"encoding/json"
	"errors"
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
		return errors.New("Error installing package. \n" + stderr + "\nTry running again with GODE_DEBUG=info to see more output.")
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

// OutdatedPackages returns a map of packages and their latest version
func OutdatedPackages(names ...string) (map[string]string, error) {
	args := append([]string{"outdated", "--json"}, names...)
	stdout, stderr, err := execNpm(args...)
	if err != nil {
		return nil, errors.New(stderr)
	}
	var outdated map[string]struct{ Latest string }
	json.Unmarshal([]byte(stdout), &outdated)
	packages := make(map[string]string, len(outdated))
	for name, versions := range outdated {
		packages[name] = versions.Latest
	}
	return packages, nil
}

func npmCmd(args ...string) (*exec.Cmd, error) {
	if err := os.MkdirAll(filepath.Join(rootPath, "node_modules"), 0755); err != nil {
		return nil, err
	}
	nodePath, err := filepath.Rel(rootPath, nodePath)
	if err != nil {
		return nil, err
	}
	npmPath, err := filepath.Rel(rootPath, npmPath)
	if err != nil {
		return nil, err
	}
	args = append([]string{npmPath}, args...)
	if debugging() {
		args = append(args, "--loglevel="+os.Getenv("GODE_DEBUG"))
	}
	cmd := exec.Command(nodePath, args...)
	cmd.Dir = rootPath
	cmd.Env = environ()
	return cmd, nil
}

func execNpm(args ...string) (string, string, error) {
	cmd, err := npmCmd(args...)
	if err != nil {
		return "", "", err
	}
	var stdout, stderr bytes.Buffer
	if debugging() {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	} else {
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr
	}
	err = cmd.Run()
	return stdout.String(), stderr.String(), err
}

func environ() []string {
	env := append(os.Environ(), "NPM_CONFIG_ALWAYS_AUTH=false")
	env = append(env, "NPM_CONFIG_CACHE="+filepath.Join(rootPath, ".npm-cache"))
	env = append(env, "NPM_CONFIG_REGISTRY="+registry)
	return env
}

func debugging() bool {
	e := os.Getenv("GODE_DEBUG")
	return e != "" && e != "0" && e != "false"
}
