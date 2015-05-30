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
	Run: func(ctx *Context) {
		// don't use needsToken since this should fail if
		// not logged in. Should not show a login prompt.
		ctx.APIToken = apiToken()

		if ctx.APIToken == "" {
			Println("not logged in")
			Exit(100)
		}

		req := apiRequest(ctx.APIToken)
		req.Method = "GET"
		req.Uri = req.Uri + "/account"
		res, err := req.Do()
		ExitIfError(err)
		var doc map[string]interface{}
		res.Body.FromJsonTo(&doc)
		Println(doc["email"])
	},
}
