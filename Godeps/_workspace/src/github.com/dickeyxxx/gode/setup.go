package gode

import (
	"archive/tar"
	"compress/gzip"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
)

// IsSetup returns true if node is setup in the client's RootPath directory
func (c *Client) IsSetup() bool {
	// TODO: better check if it is setup
	exists, _ := fileExists(c.nodePath())
	return exists
}

// Setup downloads and sets up node in the client's RootPath directory
func (c *Client) Setup() error {
	if c.IsSetup() {
		return nil
	}
	if runtime.GOOS == "windows" {
		return c.setupWindows()
	}
	return c.setupUnix()
}

func (c *Client) setupUnix() error {
	err := os.MkdirAll(filepath.Join(c.RootPath, "node_modules"), 0777)
	if err != nil {
		return err
	}
	resp, err := http.Get(c.nodeURL())
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	uncompressed, err := gzip.NewReader(resp.Body)
	if err != nil {
		return err
	}
	return extractTar(tar.NewReader(uncompressed), c.RootPath)
}

func (c *Client) setupWindows() error {
	err := downloadFile(c.nodePath(), c.nodeURL())
	if err != nil {
		return err
	}
	return c.downloadNpm()
}

func downloadFile(path, url string) error {
	err := os.MkdirAll(filepath.Dir(path), 0777)
	if err != nil {
		return err
	}
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	file, err := os.Create(path)
	defer file.Close()
	if err != nil {
		return err
	}
	_, err = io.Copy(file, resp.Body)
	return err
}

func (c *Client) downloadNpm() error {
	modulesDir := filepath.Join(c.RootPath, c.nodeBase(), "lib", "node_modules")
	zipfile := filepath.Join(modulesDir, "npm.zip")
	err := os.MkdirAll(modulesDir, 0777)
	if err != nil {
		return err
	}
	err = downloadFile(zipfile, "https://github.com/npm/npm/archive/v2.1.6.zip")
	if err != nil {
		return err
	}
	err = extractZip(zipfile, modulesDir)
	if err != nil {
		return err
	}
	err = os.Remove(zipfile)
	if err != nil {
		return err
	}
	return os.Rename(filepath.Join(modulesDir, "npm-2.1.6"), filepath.Join(modulesDir, "npm"))
}
