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
	"runtime"

	"github.com/dickeyxxx/golock"
	"github.com/franela/goreq"
)

var errInvalidSha = errors.New("Invalid SHA")

// IsSetup returns true if node is setup in RootPath
func IsSetup() bool {
	return isSetup(nodePath, npmPath)
}

func isSetup(nodePath, npmPath string) bool {
	if exists, _ := fileExists(nodePath); !exists {
		return false
	}

	exists, _ := fileExists(npmPath)
	return exists
}

// Setup downloads and sets up node in the RootPath directory
func Setup() error {
	golock.Lock(lockPath)
	defer golock.Unlock(lockPath)
	t := findTarget()
	if t == nil {
		return errors.New(`node does not offer a prebuilt binary for your OS.
You'll need to compile the tarball from nodejs.org and place it in ~/.heroku/node-v` + Version)
	}
	if t.isSetup() {
		return nil
	}
	if err := t.setup(); err != nil {
		return err
	}
	SetRootPath(rootPath) // essentially sets this node as the current one
	return t.clearOldNodeInstalls()
}

// NeedsUpdate returns true if it is using a node that isn't the latest version
func NeedsUpdate() bool {
	target := findTarget()
	if target == nil {
		return false
	}
	return target.isSetup()
}

func (t *Target) setupUnix() error {
	err := os.MkdirAll(filepath.Join(rootPath, "node_modules"), 0755)
	if err != nil {
		return err
	}
	resp, err := goreq.Request{Uri: t.URL}.Do()
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		msg, _ := resp.Body.ToString()
		return errors.New(msg)
	}

	getSha, stream := computeSha(resp.Body)
	uncompressed, err := gzip.NewReader(stream)
	if err != nil {
		return err
	}
	tmpDir := tmpDir("node")
	extractTar(tar.NewReader(uncompressed), tmpDir)
	if getSha() != t.Sha {
		return errInvalidSha
	}
	newDir := t.basePath()
	os.RemoveAll(newDir)
	if err := os.Rename(filepath.Join(tmpDir, t.Base), newDir); err != nil {
		return err
	}
	return os.Remove(tmpDir)
}

func (t *Target) setupWindows() error {
	os.RemoveAll(t.basePath())
	return downloadFile(t.nodePath(), t.URL, t.Sha)
}

func downloadFile(path, url, sha string) error {
	tmp := filepath.Join(tmpDir("download"), "file")
	// TODO: make this work with goreq
	// right now it fails because the body is closed for some reason
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	file, err := os.Create(tmp)
	if err != nil {
		return err
	}
	getSha, stream := computeSha(resp.Body)
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

func downloadNpm(modulesDir string) error {
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
	os.Rename(filepath.Join(tmpDir, "npm-"+NpmVersion), filepath.Join(modulesDir, "npm"))
	if err != nil {
		return err
	}
	return os.RemoveAll(tmpDir)
}

// gets the currently running os and arch target
func findTarget() *Target {
	for _, t := range targets {
		if runtime.GOARCH == t.Arch && runtime.GOOS == t.OS {
			return &t
		}
	}
	return nil
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
