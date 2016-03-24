package gode

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/dickeyxxx/golock"
	"github.com/franela/goreq"
	"github.com/mitchellh/ioprogress"
)

var errInvalidSha = errors.New("Invalid SHA")

// IsSetup returns true if node is setup in RootPath
func IsSetup() (bool, error) {
	exists, err := fileExists(target.nodePath())
	if !exists {
		return exists, err
	}
	return fileExists(target.npmPath())
}

// Setup downloads and sets up node in the RootPath directory
func Setup() error {
	golock.Lock(lockPath)
	defer golock.Unlock(lockPath)
	if target == nil {
		return errors.New(`node does not offer a prebuilt binary for your OS.
You'll need to compile the tarball from nodejs.org and place it in ~/.heroku/node-v` + Version)
	}
	if target.OS == "windows" {
		if err := setupWindows(); err != nil {
			return err
		}
	} else {
		if err := setupUnix(); err != nil {
			return err
		}
	}
	if err := downloadNpm(target.npmPath()); err != nil {
		return err
	}
	SetRootPath(rootPath) // essentially sets this node as the current one
	return clearOldNodeInstalls()
}

func setupUnix() error {
	err := os.MkdirAll(filepath.Join(rootPath, "node_modules"), 0755)
	if err != nil {
		return err
	}
	resp, err := goreq.Request{Uri: target.URL}.Do()
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		msg, _ := resp.Body.ToString()
		return errors.New(msg)
	}
	size, _ := strconv.Atoi(resp.Header.Get("Content-Length"))
	progress := &ioprogress.Reader{
		Reader:   resp.Body,
		Size:     int64(size),
		DrawFunc: ioprogress.DrawTerminalf(os.Stderr, progressDrawFn),
	}
	getSha, stream := computeSha(progress)
	uncompressed, err := gzip.NewReader(stream)
	if err != nil {
		return err
	}
	tmpDir := tmpDir("node")
	extractTar(tar.NewReader(uncompressed), tmpDir)
	if getSha() != target.Sha {
		return errInvalidSha
	}
	newDir := target.basePath()
	os.RemoveAll(newDir)
	if err := os.Rename(filepath.Join(tmpDir, target.Base), newDir); err != nil {
		return err
	}
	return os.Remove(tmpDir)
}

func setupWindows() error {
	os.RemoveAll(target.basePath())
	if err := os.MkdirAll(target.basePath(), 0755); err != nil {
		return err
	}
	return downloadFile(target.nodePath(), target.URL, target.Sha)
}

func progressDrawFn(progress, total int64) string {
	return "heroku-cli: Adding dependencies... " + ioprogress.DrawTextFormatBytes(progress, total)
}

func downloadFile(path, url, sha string) error {
	tmp := filepath.Join(tmpDir("download"), "file")
	// TODO: make this work with goreq
	// right now it fails because the body is closed for some reason
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	size, _ := strconv.Atoi(resp.Header.Get("Content-Length"))
	progress := &ioprogress.Reader{
		Reader:   resp.Body,
		Size:     int64(size),
		DrawFunc: ioprogress.DrawTerminalf(os.Stderr, progressDrawFn),
	}
	file, err := os.Create(tmp)
	if err != nil {
		return err
	}
	getSha, stream := computeSha(progress)
	_, err = io.Copy(file, stream)
	if err != nil {
		return err
	}
	file.Close()
	resp.Body.Close()
	if getSha() != sha {
		return errInvalidSha
	}
	err = os.MkdirAll(filepath.Dir(path), 0755)
	if err != nil {
		return err
	}
	os.Remove(path)
	err = os.Rename(tmp, path)
	if err != nil {
		return err
	}
	return os.RemoveAll(filepath.Dir(tmp))
}

func downloadNpm(npmPath string) error {
	modulesDir := filepath.Dir(filepath.Dir(npmPath))
	os.MkdirAll(modulesDir, 0755)
	tmpDir := tmpDir("node")
	zipfile := filepath.Join(tmpDir, "npm.zip")
	err := downloadFile(zipfile, npmURL, npmSha)
	if err != nil {
		return err
	}
	err = extractZip(zipfile, tmpDir)
	if err != nil {
		return err
	}
	os.RemoveAll(filepath.Join(modulesDir, "npm"))
	os.Rename(filepath.Join(tmpDir, "npm-"+NpmVersion), filepath.Join(modulesDir, "npm"))
	if err != nil {
		return err
	}
	return os.RemoveAll(tmpDir)
}

func tmpDir(prefix string) string {
	root := filepath.Join(rootPath, "tmp")
	err := os.MkdirAll(root, 0755)
	if err != nil {
		panic(err)
	}
	dir, err := ioutil.TempDir(root, prefix)
	if err != nil {
		panic(err)
	}
	return dir
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

func clearOldNodeInstalls() error {
	for _, name := range getNodeInstalls() {
		if name != target.Base {
			return os.RemoveAll(filepath.Join(rootPath, name))
		}
	}
	return nil
}
