package gode

import (
	"compress/gzip"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/dickeyxxx/golock"
	"github.com/mitchellh/ioprogress"
)

var errInvalidSha = errors.New("Invalid SHA")

// IsSetup returns true if node is setup in RootPath
func IsSetup() (bool, error) {
	exists, err := fileExists(nodeBinPath)
	if !exists {
		return exists, err
	}
	return fileExists(npmBinPath)
}

// Setup downloads and sets up node in the RootPath directory
func Setup() error {
	golock.Lock(lockPath)
	defer golock.Unlock(lockPath)
	if setup, _ := IsSetup(); setup {
		return nil
	}
	if t == nil {
		return errors.New(`node does not offer a prebuilt binary for your OS.
You'll need to compile the tarball from nodejs.org and place the binary at ` + nodeBinPath)
	}
	if err := downloadFile(nodeBinPath, t.URL, t.Sha, true); err != nil {
		return err
	}
	if err := os.Chmod(nodeBinPath, 0755); err != nil {
		return err
	}
	if err := downloadNpm(); err != nil {
		return err
	}
	if err := os.MkdirAll(modulesDir, 0755); err != nil {
		return err
	}
	return clearOldNodeInstalls()
}

func downloadNpm() error {
	tmpDir := tmpDir()
	zipfile := filepath.Join(tmpDir, "npm.zip")
	if err := downloadFile(zipfile, npmURL, npmSha, false); err != nil {
		return err
	}
	if err := extractZip(zipfile, tmpDir); err != nil {
		return err
	}
	os.RemoveAll(filepath.Join(modulesDir, "npm"))
	os.Rename(filepath.Join(tmpDir, "npm-"+NpmVersion), npmBasePath)
	return os.RemoveAll(tmpDir)
}

func downloadFile(path, url, sha string, gunzip bool) error {
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
	tmp := filepath.Join(tmpDir(), "file")
	file, err := os.Create(tmp)
	if err != nil {
		return err
	}
	var reader io.Reader
	getSha, stream := computeSha(progress)
	if gunzip {
		reader, err = gzip.NewReader(stream)
		if err != nil {
			return err
		}
	} else {
		reader = stream
	}
	if _, err = io.Copy(file, reader); err != nil {
		return err
	}
	file.Close()
	resp.Body.Close()
	if getSha() != sha {
		return errInvalidSha
	}
	if err = os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	os.Remove(path)
	err = os.Rename(tmp, path)
	if err != nil {
		return err
	}
	return os.RemoveAll(filepath.Dir(tmp))
}

func progressDrawFn(progress, total int64) string {
	return "heroku-cli: Adding dependencies... " + ioprogress.DrawTextFormatBytes(progress, total)
}

func clearOldNodeInstalls() error {
	for _, name := range getDirsWithPrefix(rootPath, "node-") {
		if !strings.HasPrefix(name, "node-"+NodeVersion) {
			if err := os.RemoveAll(filepath.Join(rootPath, name)); err != nil {
				return err
			}
		}
	}
	for _, name := range getDirsWithPrefix(rootPath, "npm-") {
		if name != "npm-"+NpmVersion {
			if err := os.RemoveAll(filepath.Join(rootPath, name)); err != nil {
				return err
			}
		}
	}
	return nil
}
