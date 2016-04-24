package main

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

// NpmRegistry is the npm registry to use
var NpmRegistry = npmRegistry()

// NpmVersion is the current npm version
var NpmVersion = "?"

// NpmPackage represents an npm package.
type NpmPackage struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// Packages returns a list of npm packages installed.
func (p *Plugins) Packages() ([]NpmPackage, error) {
	stdout, stderr, err := p.execNpm("list", "--json", "--depth=0")
	if err != nil {
		return nil, errors.New(stderr)
	}
	var response map[string]map[string]NpmPackage
	if err := json.Unmarshal([]byte(stdout), &response); err != nil {
		return nil, errors.New(stderr)
	}
	packages := make([]NpmPackage, 0, len(response["dependencies"]))
	for name, p := range response["dependencies"] {
		p.Name = name
		packages = append(packages, p)
	}
	return packages, nil
}

// installPackages installs a npm packages.
func (p *Plugins) installPackages(packages ...string) error {
	args := append([]string{"install"}, packages...)
	_, stderr, err := p.execNpm(args...)
	if err != nil {
		return errors.New("Error installing package. \n" + stderr + "\nTry running again with HEROKU_DEBUG=1 to see more output.")
	}
	return nil
}

// RemovePackages removes a npm packages.
func (p *Plugins) RemovePackages(packages ...string) error {
	installedPackages, err := p.Packages()
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
	_, stderr, err := p.execNpm(args...)
	if err != nil {
		return errors.New(stderr)
	}
	return nil
}

// OutdatedPackages returns a map of packages and their latest version
func (p *Plugins) OutdatedPackages(names ...string) (map[string]string, error) {
	args := append([]string{"outdated", "--json"}, names...)
	stdout, stderr, err := p.execNpm(args...)
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
func (p *Plugins) ClearCache() error {
	cmd, err := p.npmCmd("cache", "clean")
	if err != nil {
		return err
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func (p *Plugins) dedupe() error {
	cmd, err := p.npmCmd("prune")
	if err != nil {
		return err
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func (p *Plugins) prune() error {
	cmd, err := p.npmCmd("prune")
	if err != nil {
		return err
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func (p *Plugins) npmCmd(args ...string) (*exec.Cmd, error) {
	if err := os.MkdirAll(p.modulesPath(), 0755); err != nil {
		return nil, err
	}
	args = append([]string{p.npmBinPath()}, args...)
	if debugging {
		level := os.Getenv("GODE_DEBUG")
		if level == "" {
			level = "info"
		}
		args = append(args, "--loglevel="+level)
	}
	cmd := exec.Command(p.nodeBinPath(), args...)
	cmd.Dir = p.Path
	cmd.Env = p.environ()
	return cmd, nil
}

func (p *Plugins) execNpm(args ...string) (string, string, error) {
	cmd, err := p.npmCmd(args...)
	if err != nil {
		return "", "", err
	}
	var stdout, stderr bytes.Buffer
	if debugging {
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

func (p *Plugins) environ() []string {
	env := []string{
		"NPM_CONFIG_ALWAYS_AUTH=false",
		"NPM_CONFIG_CACHE=" + filepath.Join(CacheHome, "npm"),
		"NPM_CONFIG_REGISTRY=" + NpmRegistry,
		"NPM_CONFIG_GLOBAL=false",
		"NPM_CONFIG_ONLOAD_SCRIPT=false",
	}
	return append(env, os.Environ()...)
}

func npmRegistry() string {
	registry := os.Getenv("HEROKU_NPM_REGISTRY")
	if registry == "" {
		registry = "https://cli-npm.heroku.com"
	}
	return registry
}

func (p *Plugins) npmBinPath() string {
	return filepath.Join(AppDir, "lib", "npm-"+NpmVersion, "cli.js")
}
