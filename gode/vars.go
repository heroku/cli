package gode

import (
	"os"
	"path/filepath"
	"runtime"
)

var registry string

var rootPath string
var lockPath string
var target *Target

func init() {
	registry = os.Getenv("HEROKU_NPM_REGISTRY")
	if registry == "" {
		registry = "https://cli-npm.heroku.com"
	}
}

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
