package main

import "os"

var authTopic = &Topic{
	Name:        "auth",
	Description: "authentication (login/logout)",
}

var whoamiCmd = &Command{
	Topic:       "auth",
	Command:     "whoami",
	Description: "display your Heroku login",
	Default:     true,
	Help: `Example:

  $ heroku auth:whoami
	email@example.com`,
	Run: func(ctx *Context) {
		if os.Getenv("HEROKU_API_KEY") != "" {
			Warn("HEROKU_API_KEY is set")
		}

		// don't use needsToken since this should fail if
		// not logged in. Should not show a login prompt.
		ctx.APIToken = apiToken()

		if ctx.APIToken == "" {
			Println("not logged in")
			Exit(100)
		}

		user := getUserFromToken(ctx.APIToken)
		if user == "" {
			Println("not logged in")
			Exit(100)
		}
		Println(user)
	},
}
