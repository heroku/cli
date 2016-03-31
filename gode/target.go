package gode

import (
	"os"
	"path/filepath"
	"runtime"
)

// Target represents a node tarball
type Target struct {
	Arch string
	OS   string
	URL  string
	Base string
	Sha  string
}

func (t *Target) basePath() string {
	return filepath.Join(rootPath, t.Base)
}

func (t *Target) nodePath() string {
	herokuNodePath := os.Getenv("HEROKU_NODE_PATH")
	if herokuNodePath != "" {
		return herokuNodePath
	}
	path := filepath.Join(t.basePath(), "bin", "node")
	if runtime.GOOS == "windows" {
		return path + ".exe"
	}
	return path
}

func (t *Target) npmPath() string {
	return filepath.Join(t.basePath(), "lib", "node_modules", "npm", "cli.js")
}
