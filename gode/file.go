package gode

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

func fileExists(path string) (bool, error) {
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func getDirsWithPrefix(root, prefix string) []string {
	nodes := []string{}
	files, _ := ioutil.ReadDir(root)
	for _, f := range files {
		name := f.Name()
		if f.IsDir() && strings.HasPrefix(name, prefix) {
			nodes = append(nodes, name)
		}
	}
	return nodes
}

func tmpDir() string {
	root := filepath.Join(rootPath, "tmp")
	err := os.MkdirAll(root, 0755)
	if err != nil {
		panic(err)
	}
	dir, err := ioutil.TempDir(root, "")
	if err != nil {
		panic(err)
	}
	return dir
}
