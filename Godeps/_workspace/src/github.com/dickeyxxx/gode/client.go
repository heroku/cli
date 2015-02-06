package gode

import (
	"path/filepath"
	"runtime"
)

// The Node version to install.
// Override this by setting client.Version.
const DefaultNodeVersion = "1.1.0"

// The NPM version to install.
// Override this by setting client.Version.
const DefaultNpmVersion = "2.4.1"

// This is a Cloudfront CDN that mirrors http://iojs.org/dist
// It is much faster.
const NodeCDN = "http://d1gnwkq6ucr1xr.cloudfront.net"

// const NodeCDN = "http://d1nhjzpj45o0rc.cloudfront.net" for http://nodejs.org/dist

// Client is the interface between Node and Go.
// It also setups up the Node environment if needed.
type Client struct {
	RootPath    string
	NodeVersion string
	NpmVersion  string
	Registry    string
}

// NewClient creates a new Client at the specified rootPath
// The Node installation can then be setup here with client.Setup()
func NewClient(rootPath string) *Client {
	client := &Client{
		RootPath:    rootPath,
		NodeVersion: DefaultNodeVersion,
		NpmVersion:  DefaultNpmVersion,
	}

	return client
}

func (c *Client) nodeBase() string {
	switch {
	case runtime.GOARCH == "386":
		return "iojs-v" + c.NodeVersion + "-" + runtime.GOOS + "-x86"
	default:
		return "iojs-v" + c.NodeVersion + "-" + runtime.GOOS + "-x64"
	}
}

func (c *Client) nodeURL() string {
	switch {
	case runtime.GOOS == "windows" && runtime.GOARCH == "386":
		return NodeCDN + "/v" + c.NodeVersion + "/iojs.exe"
	case runtime.GOOS == "windows" && runtime.GOARCH == "amd64":
		return NodeCDN + "/v" + c.NodeVersion + "/x64/iojs.exe"
	case runtime.GOARCH == "386":
		return NodeCDN + "/v" + c.NodeVersion + "/" + c.nodeBase() + ".tar.gz"
	default:
		return NodeCDN + "/v" + c.NodeVersion + "/" + c.nodeBase() + ".tar.gz"
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

func (c *Client) npmURL() string {
	return "http://github.com/npm/npm/archive/v" + c.NpmVersion + ".zip"
}

func (c *Client) npmPath() string {
	return filepath.Join(c.RootPath, c.nodeBase(), "lib", "node_modules", "npm", "cli.js")
}
