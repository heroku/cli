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
	err := os.MkdirAll(filepath.Join(c.RootPath, "node_modules"), 0755)
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
	tmpDir := c.tmpDir("node")
	extractTar(tar.NewReader(uncompressed), tmpDir)
	err = os.Rename(filepath.Join(tmpDir, c.NodeBase()), filepath.Join(c.RootPath, c.NodeBase()))
	if err != nil {
		return err
	}
	return os.Remove(tmpDir)
}

func (c *Client) setupWindows() error {
	os.RemoveAll(filepath.Join(c.RootPath, c.NodeBase()))
	modulesDir := filepath.Join(c.RootPath, c.NodeBase(), "lib", "node_modules")
	if err := os.MkdirAll(modulesDir, 0755); err != nil {
		return err
	}
	if err := c.downloadNpm(modulesDir); err != nil {
		return err
	}
	return c.downloadFile(c.nodePath(), c.nodeURL())
}

func (c *Client) downloadFile(path, url string) error {
	tmp := filepath.Join(c.tmpDir("download"), "file")
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	file, err := os.Create(tmp)
	defer file.Close()
	if err != nil {
		return err
	}
	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return err
	}
	err = os.MkdirAll(filepath.Dir(path), 0755)
	if err != nil {
		return err
	}
	err = os.Rename(tmp, path)
	if err != nil {
		return err
	}
	return os.RemoveAll(filepath.Dir(tmp))
}

func (c *Client) downloadNpm(modulesDir string) error {
	tmpDir := c.tmpDir("node")
	zipfile := filepath.Join(tmpDir, "npm.zip")
	err := c.downloadFile(zipfile, c.npmURL())
	if err != nil {
		return err
	}
	err = extractZip(zipfile, tmpDir)
	if err != nil {
		return err
	}
	os.Rename(filepath.Join(tmpDir, "npm-"+c.NpmVersion), filepath.Join(modulesDir, "npm"))
	if err != nil {
		return err
	}
	return os.RemoveAll(tmpDir)
}
