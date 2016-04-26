package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/ansel1/merry"
	"github.com/dickeyxxx/netrc"
	"github.com/dickeyxxx/speakeasy"
	"github.com/toqueteos/webbrowser"
)

func init() {
	Topics = append(Topics, TopicSet{{
		Name:        "auth",
		Description: "authentication (login/logout)",
		Commands: []*Command{
			{
				Command:     "login",
				Description: "login with your Heroku credentials.",
				Flags: []Flag{
					{Name: "sso", Description: "login for enterprise users under SSO"},
				},
				Run: login,
			},
			{
				Command:     "logout",
				Description: "clear your local Heroku credentials",
				Run:         logout,
			},
			{
				Command:     "whoami",
				Description: "display your Heroku login",
				Help: `Example:

  $ heroku auth:whoami
	email@example.com

	whoami will return nonzero status if not logged in:

  $ heroku auth:whoami
	not logged in
	$ echo $?
	100`,
				Run: whoami,
			},
			{
				Command:     "token",
				Description: "display your API token.",
				NeedsAuth:   true,
				Run: func(ctx *Context) {
					Println(ctx.APIToken)
				},
			},
			{
				Command:     "2fa",
				Description: "check 2fa status",
				NeedsAuth:   true,
				Run:         twoFactorRun,
			},
			{
				Command:     "2fa:enable",
				Description: "enable 2fa on your account",
				NeedsAuth:   true,
				Run:         twoFactorEnableRun,
			},
			{
				Command:     "2fa:gen-recovery-codes",
				Description: "generates and replaces recovery codes",
				NeedsAuth:   true,
				Run:         twoFactorGenerateRun,
			},
			{
				Command:     "2fa:disable",
				Description: "disable two-factor authentication for your account",
				NeedsAuth:   true,
				Run:         twoFactorDisableRun,
			},
		},
	},
		{
			Name:   "whoami",
			Hidden: true,
			Commands: []*Command{
				{
					Description: "display your Heroku login",
					Help: `Example:

  $ heroku auth:whoami
	email@example.com

	whoami will return nonzero status if not logged in:

  $ heroku auth:whoami
	not logged in
	$ echo $?
	100`,
					Run: whoami,
				},
			},
		},
		{
			Name:        "login",
			Description: "login with your Heroku credentials.",
			Commands: []*Command{
				{
					Description: "login with your Heroku credentials.",
					Flags: []Flag{
						{Name: "sso", Description: "login for enterprise users under SSO"},
					},
					Run: login,
				},
			},
		},
		{
			Name:        "logout",
			Hidden:      true,
			Description: "clear your local Heroku credentials",
			Commands: []*Command{
				{
					Description: "clear your local Heroku credentials",
					Run:         logout,
				},
			},
		},
		{
			Name:   "twofactor",
			Hidden: true,
			Commands: CommandSet{
				{
					NeedsAuth:   true,
					Description: "check 2fa status",
					Run:         twoFactorRun,
				},
				{
					Command:     "generate-recovery-codes",
					Description: "Generates and replaces recovery codes",
					NeedsAuth:   true,
					Run:         twoFactorGenerateRun,
				},
				{
					Command:     "disable",
					Description: "Disable two-factor authentication for your account",
					NeedsAuth:   true,
					Run:         twoFactorDisableRun,
				},
			},
		},
		{
			Name:   "2fa",
			Hidden: true,
			Commands: CommandSet{
				{
					NeedsAuth:   true,
					Description: "check 2fa status",
					Run:         twoFactorRun,
				},
				{
					Command:     "generate-recovery-codes",
					Description: "Generates and replaces recovery codes",
					NeedsAuth:   true,
					Run:         twoFactorGenerateRun,
				},
				{
					Command:     "disable",
					Description: "Disable two-factor authentication for your account",
					NeedsAuth:   true,
					Run:         twoFactorDisableRun,
				},
			},
		},
	}...,
	)
}

func whoami(ctx *Context) {
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
	if user == nil {
		Println("not logged in")
		Exit(100)
	}
	Println(user.Email)
}

func login(ctx *Context) {
	if os.Getenv("HEROKU_API_KEY") != "" {
		Warn("HEROKU_API_KEY is set")
	}
	if ctx.Flags["sso"] == true {
		ssoLogin()
	} else {
		interactiveLogin()
	}
}

func ssoLogin() {
	url := os.Getenv("SSO_URL")
	if url == "" {
		org := os.Getenv("HEROKU_ORGANIZATION")
		for org == "" {
			org = getString("Enter your organization name: ")
		}
		url = "https://sso.heroku.com/saml/" + org + "/init?cli=true"
	}
	Err("Opening browser for login...")
	err := webbrowser.Open(url)
	if err != nil {
		Errln(" " + err.Error() + ".\nNavigate to " + cyan(url))
	} else {
		Errln(" done")
	}
	token := getPassword("Enter your access token (typing will be hidden): ")
	user := getUserFromToken(token)
	if user == nil {
		must(errors.New("Access token invalid."))
	}
	saveOauthToken(user.Email, token)
	Println("Logged in as " + cyan(user.Email))
}

// Account is a heroku account from /account
type Account struct {
	Email                   string `json:"email"`
	TwoFactorAuthentication bool   `json:"two_factor_authentication"`
}

func getUserFromToken(token string) (account *Account) {
	res, err := apiRequest().Auth(token).Get("/account").ReceiveSuccess(&account)
	if res.StatusCode != 200 {
		return nil
	}
	must(err)
	return account
}

func interactiveLogin() {
	if apiHost() == "api.heroku.com" {
		Println("Enter your Heroku credentials.")
	} else {
		Printf("Enter your Heroku credentials for %s.\n", apiHost())
	}
	email := getString("Email: ")
	password := getPassword("Password (typing will be hidden): ")

	token := v2login(email, password, "")
	// TODO: use createOauthToken (v3 API)
	// token, err := createOauthToken(email, password, "")
	saveOauthToken(email, token)
	Println("Logged in as " + cyan(email))
}

func saveOauthToken(email, token string) {
	netrc := getNetrc()
	netrc.RemoveMachine(apiHost())
	netrc.RemoveMachine(httpGitHost())
	netrc.AddMachine(apiHost(), email, token)
	netrc.AddMachine(httpGitHost(), email, token)
	must(netrc.Save())
}

func getString(prompt string) string {
	var s string
	Err(prompt)
	if _, err := fmt.Scanln(&s); err != nil {
		if err.Error() == "unexpected newline" {
			return getString(prompt)
		}
		if err.Error() == "EOF" {
			Errln()
			Exit(1)
		}
		must(err)
	}
	return s
}

func getPassword(prompt string) string {
	password, err := speakeasy.Ask(prompt)
	if err != nil {
		if err.Error() == "The handle is invalid." {
			Errln(`Login is currently incompatible with git bash/cygwin
In the meantime, login via cmd.exe
https://github.com/heroku/cli/issues/84`)
			Exit(1)
		} else {
			must(err)
		}
	}
	return password
}

func v2login(email, password, secondFactor string) string {
	api := apiRequest().Post("/login")
	api.Set("Accept", "application/json")
	body := struct {
		Username string `url:"username"`
		Password string `url:"password"`
	}{email, password}
	api.BodyForm(body)
	if secondFactor != "" {
		api.Set("Heroku-Two-Factor-Code", secondFactor)
	}
	success := struct {
		APIKey string `json:"api_key"`
	}{}
	failure := struct {
		Error string `json:"error"`
	}{}
	res, err := api.Receive(&success, &failure)
	must(err)
	switch res.StatusCode {
	case 200:
		return success.APIKey
	case 401:
		ExitWithMessage(failure.Error)
	case 403:
		return v2login(email, password, getString("Two-factor code: "))
	case 404:
		ExitWithMessage("Authentication failed.\nEmail or password is not valid.\nCheck your credentials on https://dashboard.heroku.com")
	default:
		WarnIfError(getHTTPError(res))
		ExitWithMessage("Invalid response from API.\nHTTP %d\n%s\n\nAre you behind a proxy?\nhttps://devcenter.heroku.com/articles/using-the-cli#using-an-http-proxy", res.StatusCode, body)
	}
	must(fmt.Errorf("unreachable"))
	return ""
}

func createOauthToken(email, password, secondFactor string) (string, error) {
	body := map[string]interface{}{
		"scope":       []string{"global"},
		"description": "Heroku CLI login from " + time.Now().UTC().Format(time.RFC3339),
		"expires_in":  60 * 60 * 24 * 30, // 30 days
	}
	req, err := apiRequest().Post("/oauth/authorizations").BodyJSON(body).Request()
	must(err)
	req.SetBasicAuth(email, password)
	if secondFactor != "" {
		req.Header.Set("Heroku-Two-Factor-Code", secondFactor)
	}
	doc := struct {
		ID          string
		Message     string
		AccessToken struct {
			Token string
		} `json:"access_token"`
	}{}
	res, err := apiRequest().Do(req, doc, nil)
	must(err)
	if doc.ID == "two_factor" {
		return createOauthToken(email, password, getString("Two-factor code: "))
	}
	if res.StatusCode != 201 {
		return "", errors.New(doc.Message)
	}
	return doc.AccessToken.Token, nil
}

func logout(ctx *Context) {
	if os.Getenv("HEROKU_API_KEY") != "" {
		Warn("HEROKU_API_KEY is set")
	}
	netrc := getNetrc()
	netrc.RemoveMachine(apiHost())
	netrc.RemoveMachine(httpGitHost())
	must(netrc.Save())
	Println("Local credentials cleared.")
}

func getNetrc() *netrc.Netrc {
	n, err := netrc.Parse(netrcPath())
	if err != nil {
		if _, ok := err.(*os.PathError); ok {
			// File not found
			return &netrc.Netrc{Path: netrcPath()}
		}
		Errln("Error parsing netrc at " + netrcPath())
		Errln(err.Error())
		Exit(1)
	}
	return n
}

func auth() (password string) {
	token := apiToken()
	if token == "" {
		interactiveLogin()
		return auth()
	}
	return token
}

func apiToken() string {
	key := os.Getenv("HEROKU_API_KEY")
	if key != "" {
		return key
	}
	netrc := getNetrc()
	machine := netrc.Machine(apiHost())
	if machine != nil {
		return machine.Get("password")
	}
	return ""
}

func netrcPath() string {
	base := filepath.Join(HomeDir, ".netrc")
	if runtime.GOOS == WINDOWS {
		base = filepath.Join(HomeDir, "_netrc")
	}
	if exists, _ := fileExists(base + ".gpg"); exists {
		base = base + ".gpg"
	}
	return base
}

func netrcLogin() string {
	key := os.Getenv("HEROKU_API_KEY")
	if key != "" {
		return ""
	}
	netrc := getNetrc()
	machine := netrc.Machine(apiHost())
	if machine != nil {
		return machine.Get("login")
	}
	return ""
}

func twoFactorGenerateRun(ctx *Context) {
	req := apiRequest().Auth(ctx.APIToken).Post("/account/recovery-codes")
	req.Set("Heroku-Password", getPassword("Password (typing will be hidden): "))
	req.Set("Heroku-Two-Factor-Code", getString("Two-factor code: "))
	var codes []interface{}
	res, err := req.ReceiveSuccess(&codes)
	must(err)
	must(getHTTPError(res))
	Println("Recovery codes:")
	for _, code := range codes {
		Println(code)
	}
}

func twoFactorDisableRun(ctx *Context) {
	twoFactorToggle(ctx, false)
}

func twoFactorRun(ctx *Context) {
	account := getUserFromToken(ctx.APIToken)
	if account.TwoFactorAuthentication {
		Println("Two-factor authentication is enabled")
	} else {
		Println("Two-factor authentication is not enabled")
	}
}

func twoFactorEnableRun(ctx *Context) {
	twoFactorToggle(ctx, true)
}

func twoFactorToggle(ctx *Context, on bool) {
	req := apiRequest().Auth(ctx.APIToken).Patch("/account/")
	body := map[string]interface{}{
		"password": getPassword("Password (typing will be hidden):"),
	}
	if on {
		body["two_factor_authentication"] = "true"
	} else {
		body["two_factor_authentication"] = "false"
	}

	req.BodyJSON(body)
	failure := map[string]interface{}{}
	var account *Account
	res, err := req.Receive(&account, &failure)
	must(err)
	if res.StatusCode != 200 {
		must(merry.New(failure["message"].(string)))
		return
	}
	twoFactorRun(ctx)
}
