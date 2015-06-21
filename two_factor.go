package main

var twoFactorTopic = &Topic{
	Name:        "twofactor",
	Description: "manage two-factor authentication settings",
}

var twoFactorCmd = &Command{
	Topic:     "twofactor",
	NeedsAuth: true,
	Run: func(ctx *Context) {
		req := apiRequest(ctx.APIToken)
		req.Method = "GET"
		req.Uri = req.Uri + "/account"
		res, err := req.Do()
		ExitIfError(err)
		var doc map[string]bool
		res.Body.FromJsonTo(&doc)
		if doc["two_factor_authentication"] {
			Println("Two-factor authentication is enabled")
		} else {
			Println("Two-factor authentication is not enabled")
		}
	},
}
