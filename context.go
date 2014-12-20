package main

type Context struct {
	Topic   *Topic            `json:"topic"`
	Command *Command          `json:"command"`
	App     string            `json:"app"`
	Args    map[string]string `json:"args"`
	Auth    struct {
		Username string `json:"username"`
		Password string `json:"password"`
	} `json:"auth"`
}
