package gode

import (
	"io/ioutil"
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

func SetRootPath(root string) {
	rootPath = root
	base := filepath.Join(root, getLatestInstalledNode())
	nodePath = nodePathFromBase(base)
	npmPath = npmPathFromBase(base)
	lockPath = filepath.Join(rootPath, "node.lock")
}

func getLatestInstalledNode() string {
	nodes := getNodeInstalls()
	if len(nodes) == 0 {
		return ""
	}
	return nodes[len(nodes)-1]
}

func getNodeInstalls() []string {
	nodes := []string{}
	files, _ := ioutil.ReadDir(rootPath)
	for _, f := range files {
		name := f.Name()
		if strings.HasPrefix(name, "node-v") || strings.HasPrefix(name, "iojs-v") {
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
	return filepath.Join(base, "npm", "cli.js")
}
