package main

var twoFactorTopic = &Topic{
	Name:        "twofactor",
	Description: "manage two-factor authentication settings",
}

var twoFactorTopicAlias = &Topic{
	Name:        "2fa",
	Description: "manage two-factor authentication settings",
}

var twoFactorCmd = &Command{
	Topic:     "twofactor",
	NeedsAuth: true,
	Run:       twoFactorRun,
}

var twoFactorCmdAlias = &Command{
	Topic:     "2fa",
	NeedsAuth: true,
	Run:       twoFactorRun,
}

func twoFactorRun(ctx *Context) {
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
}

var twoFactorGenerateCmd = &Command{
	Topic:       "twofactor",
	Command:     "generate-recovery-codes",
	Description: "Generates and replaces recovery codes",
	NeedsAuth:   true,
	Run:         twoFactorGenerateRun,
}

var twoFactorGenerateCmdAlias = &Command{
	Topic:       "2fa",
	Command:     "generate-recovery-codes",
	Description: "Generates and replaces recovery codes",
	NeedsAuth:   true,
	Run:         twoFactorGenerateRun,
}

func twoFactorGenerateRun(ctx *Context) {
	req := apiRequest(ctx.APIToken)
	req.Method = POST
	req.Uri = req.Uri + "/account/recovery-codes"
	req.AddHeader("Heroku-Password", getPassword("Password (typing will be hidden): "))
	req.AddHeader("Heroku-Two-Factor-Code", getString("Two-factor code: "))
	res, err := req.Do()
	ExitIfError(err)
	var codes []interface{}
	res.Body.FromJsonTo(&codes)
	Println("Recovery codes:")
	for _, code := range codes {
		Println(code)
	}
}

var twoFactorDisableCmd = &Command{
	Topic:       "twofactor",
	Command:     "disable",
	Description: "Disable two-factor authentication for your account",
	NeedsAuth:   true,
	Run:         twoFactorDisableRun,
}

var twoFactorDisableCmdAlias = &Command{
	Topic:       "2fa",
	Command:     "disable",
	Description: "Disable two-factor authentication for your account",
	NeedsAuth:   true,
	Run:         twoFactorDisableRun,
}

func twoFactorDisableRun(ctx *Context) {
	req := apiRequest(ctx.APIToken)
	req.Method = "PATCH"
	req.Uri = req.Uri + "/account/"
	req.Body = map[string]interface{}{
		"two_factor_authentication": "false",
		"password":                  getPassword("Password (typing will be hidden):"),
	}
	res, err := req.Do()
	ExitIfError(err)
	if res.StatusCode != 200 {
		var doc map[string]string
		res.Body.FromJsonTo(&doc)
		Error(doc["message"])
		return
	}
	Println("disabled two-factor authentication")
}
