/*
Package gode runs a sandboxed node installation to run node code and install npm packages.
*/
package gode

import (
	"os"
	"path/filepath"
	"runtime"
)

var t *target
var registry string
var rootPath string
var lockPath string
var modulesDir string
var nodeBinPath string
var npmBasePath string
var npmBinPath string

func init() {
	registry = os.Getenv("HEROKU_NPM_REGISTRY")
	if registry == "" {
		registry = "https://cli-npm.heroku.com"
	}
}

// SetRootPath sets the root for gode
func SetRootPath(root string) {
	for _, target := range targets {
		if runtime.GOARCH == target.Arch && runtime.GOOS == target.OS {
			t = &target
			break
		}
	}
	rootPath = root
	lockPath = filepath.Join(rootPath, "node.lock")
	modulesDir = filepath.Join(rootPath, "node_modules")
	nodeBinPath = os.Getenv("HEROKU_NODE_PATH")
	if nodeBinPath == "" {
		nodeBinPath = filepath.Join(rootPath, "node-"+NodeVersion+"-"+t.OS+"-"+t.Arch, "node")
		if t.OS == "windows" {
			nodeBinPath += ".exe"
		}
	}
	npmBasePath = filepath.Join(rootPath, npmBase)
	npmBinPath = filepath.Join(npmBasePath, "cli.js")
}
