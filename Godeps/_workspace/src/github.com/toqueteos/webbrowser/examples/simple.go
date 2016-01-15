package main

import "github.com/heroku/heroku-cli/Godeps/_workspace/src/github.com/toqueteos/webbrowser"

func main() {
	webbrowser.Open("http://golang.org")
	webbrowser.Open("http://reddit.com")
}
