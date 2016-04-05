package gode

//
// DO NOT EDIT
//
// THIS FILE IS GENERATED WITH ./set-node-version
//

// NodeVersion is the requested node version
const NodeVersion = "5.10.0"

// NpmVersion is the requested npm version
const NpmVersion = "3.8.5"

const npmSha = "d92201d52f1d03497f3eef174f3b2309211de5a013938dfcac5eae1d64f8af2c"
const npmURL = "https://heroku-cli-assets.s3.amazonaws.com/npm/v3.8.5.tar.xz"
const npmBase = "npm-3.8.5"

type target struct {
	Arch string
	OS   string
	URL  string
	Sha  string
}

var targets = []target{
	{"386", "linux", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-linux-386.xz", "fe2d1ab5f70482d30616efb5dd19b56b105db33e404f7f6c7e891a7876b14831"},
	{"amd64", "linux", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-linux-amd64.xz", "f42ec483b8eb8e76897783fc6fe7b9370a881840b930930c4e1863156aff9f80"},
	{"arm", "linux", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-linux-arm.xz", "45547afb4642c49d546d46ae8c772bb630375d098cb1716809f1b770ca7e1664"},
	{"amd64", "darwin", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-darwin-amd64.xz", "e2609153d8ce4ee8898ac72f43379d09606134db0a1d6b4df8a58319a85aa204"},
	{"386", "windows", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-windows-386.exe.xz", "a486782de0b4cdddf3011986136082e4bcd67a1e2c5db0a7b6a24b05afeec6f7"},
	{"amd64", "windows", "https://cli-assets.heroku.com/node/v5.10.0/node-5.10.0-windows-amd64.exe.xz", "4b19ef6e209c8703b709dd30295721a1e0146644537689e0f988d3a99b2ed41a"},
}
