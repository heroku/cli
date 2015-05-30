package main

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
		req := apiRequest(ctx.Auth.Password)
		req.Method = "GET"
		req.Uri = req.Uri + "/account"
		res, err := req.Do()
		ExitIfError(err)
		var doc map[string]interface{}
		res.Body.FromJsonTo(&doc)
		Println(doc["email"])
	},
}
