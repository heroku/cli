package gode

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
)

const registry = "https://cli-npm.heroku.com"

var rootPath string
var lockPath string
var nodePath string
var npmPath string

// SetRootPath sets the root for gode
func SetRootPath(root string) {
	rootPath = root
	base := filepath.Join(root, getLatestInstalledNode())
	nodePath = nodePathFromBase(base)
	herokuNodePath := os.Getenv("HEROKU_NODE_PATH")
	if herokuNodePath != "" {
		nodePath = herokuNodePath
	}
	npmPath = npmPathFromBase(base)
	lockPath = filepath.Join(rootPath, "node.lock")
}

func getLatestInstalledNode() string {
	nodes := getNodeInstalls()
	if len(nodes) == 0 {
		return ""
	}
	latest := nodes[len(nodes)-1]
	// ignore ancient versions
	if strings.HasPrefix(latest, "node-v0") {
		return ""
	}
	return latest
}

func getNodeInstalls() []string {
	nodes := []string{}
	files, _ := ioutil.ReadDir(rootPath)
	for _, f := range files {
		name := f.Name()
		if f.IsDir() && strings.HasPrefix(name, "node-v") {
			nodes = append(nodes, name)
		}
	}
	sort.Strings(nodes)
	return nodes
}

func nodePathFromBase(base string) string {
	path := filepath.Join(base, "bin", "node")
	if runtime.GOOS == "windows" {
		return path + ".exe"
	}
	return path
}

func npmPathFromBase(base string) string {
	return filepath.Join(base, "lib", "node_modules", "npm", "cli.js")
}

func cachePath() string {
	return filepath.Join(rootPath, ".npm-cache")
}
