package gode

//
// DO NOT EDIT
//
// THIS FILE IS GENERATED WITH ./set-node-version
//

// NodeVersion is the requested node version
const NodeVersion = "5.10.0"

// NpmVersion is the requested npm version
const NpmVersion = "3.8.3"

const npmSha = "3a2588d7e2983d5ce34215e7259ee0201780b26bb4ec8eeb03e180a0574cfe0f"
const npmURL = "https://cli-assets.heroku.com/npm/v3.8.3.zip"
const npmBase = "npm-3.8.3"

type target struct {
	Arch     string
	OS       string
	URL      string
	Sha      string
}

var targets = []target{
	{"386", "linux", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-linux-386.gz", "c282e0f5ebcb0e0408a9aa0b4c65fa3d75ddc49bd83b177c3bac4a5cdc3c9921"},
	{"amd64", "linux", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-linux-amd64.gz", "c9a55972c2100ea49f6f4fd00ec72f6703d71de5f6b26bbd51e89803692a59ab"},
	{"arm", "linux", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-linux-arm.gz", "233c9a3e36492ec14a054db46122a2b57cbe17017882c1f8f97d361497ffc4ea"},
	{"amd64", "darwin", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-darwin-amd64.gz", "4e57167f9e1498e895945685278cd727441457d7ebfe7e206c391e2b41b5219e"},
	{"386", "windows", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-windows-386.exe.gz", "312bb7024050e1aef2396b91a9b7c2d89ad1a91ef0e9f1c730e6ee43f227c874"},
	{"amd64", "windows", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-windows-amd64.exe.gz", "d3fd27dd87e407133f6c509415e25f113fcde96d4532a537d9e732e6ae7ccc6b"},
}
