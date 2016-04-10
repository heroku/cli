package gode

import (
	"bytes"
	"encoding/json"
	"errors"
	"log"
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

// InstallPackages installs a npm packages.
func InstallPackages(packages ...string) error {
	args := append([]string{"install"}, packages...)
	_, stderr, err := execNpm(args...)
	if err != nil {
		return errors.New("Error installing package. \n" + stderr + "\nTry running again with GODE_DEBUG=info to see more output.")
	}
	return nil
}

// RemovePackages removes a npm packages.
func RemovePackages(packages ...string) error {
	installedPackages, err := Packages()
	if err != nil {
		return err
	}
	toRemove := make([]string, 0, len(installedPackages))
	for _, a := range installedPackages {
		for _, b := range packages {
			if a.Name == b {
				toRemove = append(toRemove, b)
			}
		}
	}
	if len(toRemove) == 0 {
		return nil
	}
	args := append([]string{"remove"}, toRemove...)
	_, stderr, err := execNpm(args...)
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

// ClearCache clears the npm cache
func ClearCache() error {
	cmd, err := npmCmd("cache", "clean")
	if err != nil {
		return err
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func npmCmd(args ...string) (*exec.Cmd, error) {
	if err := os.MkdirAll(filepath.Join(rootPath, "node_modules"), 0755); err != nil {
		return nil, err
	}
	args = append([]string{npmBinPath}, args...)
	if debugging() {
		args = append(args, "--loglevel="+os.Getenv("GODE_DEBUG"))
	}
	cmd := exec.Command(nodeBinPath, args...)
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
		log.Printf("running npm from %s: %s\n", cmd.Dir, strings.Join(cmd.Args, " "))
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
	env := []string{
		"NPM_CONFIG_ALWAYS_AUTH=false",
		"NPM_CONFIG_CACHE=" + filepath.Join(rootPath, ".npm-cache"),
		"NPM_CONFIG_REGISTRY=" + registry,
		"NPM_CONFIG_GLOBAL=false",
		"NPM_CONFIG_ONLOAD_SCRIPT=false",
	}
	return append(env, os.Environ()...)
}

func debugging() bool {
	e := os.Getenv("GODE_DEBUG")
	return e != "" && e != "0" && e != "false"
}
