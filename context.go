package main

import (
	"os"
)

// Context is a struct that is passed to a Command's Run function.
// It contains information about the user's command arguments
// as well as Heroku information like the auth token and app name (if requested).
type Context struct {
	Topic         *Topic                 `json:"topic"`
	Command       *Command               `json:"command"`
	App           string                 `json:"app"`
	Org           string                 `json:"org,omitempty"`
	Args          interface{}            `json:"args"`
	Flags         map[string]interface{} `json:"flags"`
	Cwd           string                 `json:"cwd"`
	HerokuDir     string                 `json:"herokuDir"`
	Debug         bool                   `json:"debug"`
	DebugHeaders  bool                   `json:"debugHeaders"`
	Dev           bool                   `json:"dev"`
	SupportsColor bool                   `json:"supportsColor"`
	Version       string                 `json:"version"`
	APIToken      string                 `json:"apiToken"`
	APIHost       string                 `json:"apiHost"` // deprecated in favor of apiUrl
	APIURL        string                 `json:"apiUrl"`
	GitHost       string                 `json:"gitHost"`
	HTTPGitHost   string                 `json:"httpGitHost"`
	Auth          struct {
		Password string `json:"password"`
	} `json:"auth"`
}

func app(flags map[string]interface{}) (string, error) {
	if flags["app"] != nil {
		return flags["app"].(string), nil
	}
	if flags["remote"] != nil {
		app, err := appFromGitRemote(flags["remote"].(string))
		if err != nil {
			return "", err
		}
		return app, nil
	}
	if flags["confirm"] != nil {
		return flags["confirm"].(string), nil
	}
	app := os.Getenv("HEROKU_APP")
	if app != "" {
		return app, nil
	}
	return appFromGitRemote(remoteFromGitConfig())
}
