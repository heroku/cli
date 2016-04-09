/*
Package gode runs a sandboxed node installation to run node code and install npm packages.
*/
package gode

import (
	"os"
	"os/exec"
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

// ProgressDrawFn is the progress text to display when downloading node/npm
var ProgressDrawFn func(progress, total int64) string

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
		if t == nil {
			var err error
			nodeBinPath, err = exec.LookPath("node")
			if err != nil {
				panic(err)
			}
		} else {
			nodeBinPath = filepath.Join(rootPath, "node-"+NodeVersion+"-"+runtime.GOOS+"-"+runtime.GOARCH, "node")
			if runtime.GOOS == "windows" {
				nodeBinPath += ".exe"
			}
		}
	}
	npmBasePath = filepath.Join(rootPath, npmBase)
	npmBinPath = filepath.Join(npmBasePath, "cli.js")
}
