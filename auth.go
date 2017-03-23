package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/dickeyxxx/netrc"
	"github.com/dickeyxxx/speakeasy"
)

func init() {
	CLITopics = append(CLITopics, Topics{{
		Name:        "auth",
		Description: "authentication (login/logout)",
		Commands: []*Command{
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
				Command:     "2fa:generate",
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
			Name:   "twofactor",
			Hidden: true,
			Commands: Commands{
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
			Commands: Commands{
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
	token := createOauthToken(email, password, "")
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
		switch err.Error() {
		case "The handle is invalid.", "Controlador no válido.", "Identificador inválido.":
			ExitWithMessage(`Login is currently incompatible with git bash/cygwin
In the meantime, login via cmd.exe
https://github.com/heroku/cli/issues/84`)
		default:
			must(err)
		}
	}
	return password
}

func createOauthToken(email, password, secondFactor string) string {
	body := map[string]interface{}{
		"scope":       []string{"global"},
		"description": "Heroku CLI login from " + time.Now().UTC().Format(time.RFC3339),
		"expires_in":  60 * 60 * 24 * 365, // 365 days
	}
	req, err := apiRequest().Post("/oauth/authorizations").BodyJSON(body).Request()
	must(err)
	req.SetBasicAuth(email, password)
	if secondFactor != "" {
		req.Header.Set("Heroku-Two-Factor-Code", secondFactor)
	}
	success := struct {
		AccessToken struct {
			Token string
		} `json:"access_token"`
	}{}
	failure := struct {
		ID      string
		Message string
	}{}
	res, err := apiRequest().Do(req, &success, &failure)
	must(err)
	if failure.ID != "" {
		if failure.ID == "unauthorized" {
			ExitWithMessage("Authentication failed.\nEmail or password is not valid.\nCheck your credentials on https://dashboard.heroku.com")
		}
		if failure.ID == "two_factor" {
			return createOauthToken(email, password, getString("Two-factor code: "))
		}
		ExitWithMessage(failure.Message)
	}
	must(getHTTPError(res))
	return success.AccessToken.Token
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
	if exists, _ := FileExists(base + ".gpg"); exists {
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
		ExitWithMessage(failure["message"].(string))
		return
	}
	twoFactorRun(ctx)
}
