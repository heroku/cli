package gode

import (
	"path/filepath"
	"runtime"
)

// The Node version to install.
// Override this by setting client.Version.
const DefaultNodeVersion = "v0.10.32"

// Client is the interface between Node and Go.
// It also setups up the Node environment if needed.
type Client struct {
	RootPath string
	Version  string
	Registry string
}

// NewClient creates a new Client at the specified rootPath
// The Node installation can then be setup here with client.Setup()
func NewClient(rootPath string) *Client {
	client := &Client{
		RootPath: rootPath,
		Version:  DefaultNodeVersion,
	}

	return client
}

func (c *Client) nodeBase() string {
	switch {
	case runtime.GOARCH == "386":
		return "node-" + c.Version + "-" + runtime.GOOS + "-x86"
	default:
		return "node-" + c.Version + "-" + runtime.GOOS + "-x64"
	}
}

func (c *Client) nodeURL() string {
	switch {
	case runtime.GOOS == "windows" && runtime.GOARCH == "386":
		return "http://nodejs.org/dist/" + c.Version + "/node.exe"
	case runtime.GOOS == "windows" && runtime.GOARCH == "amd64":
		return "http://nodejs.org/dist/" + c.Version + "/x64/node.exe"
	case runtime.GOARCH == "386":
		return "http://nodejs.org/dist/" + c.Version + "/" + c.nodeBase() + ".tar.gz"
	default:
		return "http://nodejs.org/dist/" + c.Version + "/" + c.nodeBase() + ".tar.gz"
	}
}

func (c *Client) nodePath() string {
	switch {
	case runtime.GOOS == "windows":
		return filepath.Join(c.RootPath, c.nodeBase(), "bin", "node.exe")
	default:
		return filepath.Join(c.RootPath, c.nodeBase(), "bin", "node")
	}
}

func (c *Client) npmPath() string {
	return filepath.Join(c.RootPath, c.nodeBase(), "lib", "node_modules", "npm", "cli.js")
}
