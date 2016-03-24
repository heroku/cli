package gode

import (
	"path/filepath"
	"runtime"
)

const registry = "https://cli-npm.heroku.com"

var rootPath string
var lockPath string
var target *Target

// SetRootPath sets the root for gode
func SetRootPath(root string) {
	for _, t := range targets {
		if runtime.GOARCH == t.Arch && runtime.GOOS == t.OS {
			target = &t
			break
		}
	}
	rootPath = root
	lockPath = filepath.Join(rootPath, "node.lock")
}

func modulesDir() string {
	return filepath.Join(rootPath, "node_modules")
}
