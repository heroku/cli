package gode

//
// DO NOT EDIT
//
// THIS FILE IS GENERATED WITH ./set-node-version
//

// NodeVersion is the requested node version
const NodeVersion = "5.10.1"

// NpmVersion is the requested npm version
const NpmVersion = "3.8.5"

const npmSha = "d92201d52f1d03497f3eef174f3b2309211de5a013938dfcac5eae1d64f8af2c"
const npmURL = "https://cli-assets.heroku.com/npm/v3.8.5.tar.xz"
const npmBase = "npm-3.8.5"

type target struct {
	Arch string
	OS   string
	URL  string
	Sha  string
}

var targets = []target{
	{"386", "linux", "https://cli-assets.heroku.com/node/v5.10.1/node-5.10.1-linux-386.xz", "2ff69ca8608e290732c58d70624bf12533a13fae9c64f2a4b00a278ee8b1fa88"},
	{"amd64", "linux", "https://cli-assets.heroku.com/node/v5.10.1/node-5.10.1-linux-amd64.xz", "6aa697a5daf7a9ab95c5657af69c63290b2ac729169991b13246f6018d5b0dc8"},
	{"arm", "linux", "https://cli-assets.heroku.com/node/v5.10.1/node-5.10.1-linux-arm.xz", "0c4ac5df3c43b5b6027af8a56f14d07d6e459869e1142215288e4d1f46ed60f7"},
	{"amd64", "darwin", "https://cli-assets.heroku.com/node/v5.10.1/node-5.10.1-darwin-amd64.xz", "73c96d7781513d7999597dacffefb1f00332bb1d376cc0a24cd72a99c10705ca"},
	{"386", "windows", "https://cli-assets.heroku.com/node/v5.10.1/node-5.10.1-windows-386.exe.xz", "7d2b33dcde294900f672b51560f5b0b83c9348270db2fdd1f7ab154e2f86b6d1"},
	{"amd64", "windows", "https://cli-assets.heroku.com/node/v5.10.1/node-5.10.1-windows-amd64.exe.xz", "7bb93bf229b5295547000b1282a2b860ecdbeb63249ab0bff8645e81cb9552a5"},
}
