package main

// Context is a struct that is passed to a Command's Run function.
// It contains information about the user's command arguments
// as well as Heroku information like the auth token and app name (if requested).
type Context struct {
	Topic     *Topic      `json:"topic"`
	Command   *Command    `json:"command"`
	App       string      `json:"app"`
	Args      interface{} `json:"args"`
	Cwd       string      `json:"cwd"`
	HerokuDir string      `json:"herokuDir"`
	Debug     bool        `json:"debug"`
	Auth      struct {
		Username string `json:"username"`
		Password string `json:"password"`
	} `json:"auth"`
}
