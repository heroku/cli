package main

import "github.com/franela/goreq"

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
	NeedsAuth: true,
	Run: func(ctx *Context) {
		req := goreq.Request{
			Uri:       "https://" + herokuAPIHost() + "/account",
			Method:    "GET",
			Accept:    "application/vnd.heroku+json; version=3",
			ShowDebug: debugging,
			Insecure:  !shouldVerifyHost(),
		}
		req.AddHeader("Authorization", "Bearer "+ctx.Auth.Password)
		res, err := req.Do()
		ExitIfError(err)
		var doc map[string]interface{}
		res.Body.FromJsonTo(&doc)
		Println(doc["email"])
	},
}
