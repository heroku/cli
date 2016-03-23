package gode

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
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

// InstallPackages installs a npm packages.
func InstallPackages(packages ...string) error {
	args := append([]string{"install"}, packages...)
	_, stderr, err := execNpm(args...)
	if err != nil {
		return errors.New("Error installing package. \n" + stderr + "\nTry running again with GODE_DEBUG=info to see more output.")
	}
	return AddPackagesToPackageJSON(packages...)
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

// Prune runs `npm prune`
func Prune() error {
	_, stderr, err := execNpm("prune")
	if err != nil {
		return errors.New("prune error: " + stderr)
	}
	return nil
}

// Dedupe runs `npm dedupe`
func Dedupe() error {
	_, stderr, err := execNpm("dedupe")
	if err != nil {
		return errors.New("dedupe error: " + stderr)
	}
	return nil
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
	env = append(env, "NPM_CONFIG_GLOBAL=false")
	env = append(env, "NPM_CONFIG_ONLOAD_SCRIPT=false")
	return env
}

func debugging() bool {
	e := os.Getenv("GODE_DEBUG")
	return e != "" && e != "0" && e != "false"
}

// AddPackagesToPackageJSON ensures that packages are inside the package.json file
func AddPackagesToPackageJSON(packages ...string) error {
	path := filepath.Join(rootPath, "package.json")
	pjson, err := readPackageJSON(path)
	if err != nil {
		return err
	}
	pjson["name"] = "heroku"
	pjson["private"] = true
	dependencies, ok := pjson["dependencies"].(map[string]string)
	if !ok {
		dependencies = map[string]string{}
	}
	for _, dep := range packages {
		dependencies[dep] = "*"
	}
	pjson["dependencies"] = dependencies
	return savePackageJSON(path, pjson)
}

func readPackageJSON(path string) (pjson map[string]interface{}, err error) {
	if exists, _ := fileExists(path); !exists {
		return map[string]interface{}{}, nil
	}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(data, &pjson)
	return pjson, err
}

func savePackageJSON(path string, pjson map[string]interface{}) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()
	b, err := json.MarshalIndent(pjson, "", "  ")
	if err != nil {
		return err
	}
	_, err = file.Write(b)
	return err
}
