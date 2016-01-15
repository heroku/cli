package main

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/heroku/heroku-cli/Godeps/_workspace/src/github.com/dickeyxxx/speakeasy"
	"github.com/heroku/heroku-cli/Godeps/_workspace/src/github.com/toqueteos/webbrowser"
)

var loginTopic = &Topic{
	Name:        "login",
	Description: "Login with your Heroku credentials.",
}

var loginCmd = &Command{
	Topic:       "login",
	Description: "Login with your Heroku credentials.",
	Flags: []Flag{
		{Name: "sso", Description: "login for enterprise users under SSO"},
	},
	Run: login,
}

var authLoginCmd = &Command{
	Topic:       "auth",
	Command:     "login",
	Description: "Login with your Heroku credentials.",
	Flags: []Flag{
		{Name: "sso", Description: "login for enterprise users under SSO"},
	},
	Run: login,
}

func login(ctx *Context) {
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
	if user == "" {
		ExitIfError(errors.New("Access token invalid."))
	}
	saveOauthToken(user, token)
	Println("Logged in as " + cyan(user))
}

func getUserFromToken(token string) string {
	req := apiRequest(token)
	req.Method = "GET"
	req.Uri = req.Uri + "/account"
	res, err := req.Do()
	ExitIfError(err)
	if res.StatusCode != 200 {
		return ""
	}
	var doc map[string]interface{}
	res.Body.FromJsonTo(&doc)
	return doc["email"].(string)
}

func interactiveLogin() {
	if apiHost() == "api.heroku.com" {
		Println("Enter your Heroku credentials.")
	} else {
		Printf("Enter your Heroku credentials for %s.\n", apiHost())
	}
	email := getString("Email: ")
	password := getPassword("Password (typing will be hidden): ")

	token, err := v2login(email, password, "")
	// TODO: use createOauthToken (v3 API)
	// token, err := createOauthToken(email, password, "")
	ExitIfError(err)
	saveOauthToken(email, token)
	Println("Logged in as " + cyan(email))
}

func saveOauthToken(email, token string) {
	netrc := getNetrc()
	netrc.RemoveMachine(apiHost())
	netrc.RemoveMachine(httpGitHost())
	netrc.AddMachine(apiHost(), email, token)
	netrc.AddMachine(httpGitHost(), email, token)
	ExitIfError(netrc.Save())
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
			os.Exit(1)
		}
		ExitIfError(err)
	}
	return s
}

func getPassword(prompt string) string {
	password, err := speakeasy.Ask(prompt)
	if err != nil {
		if err.Error() == "The handle is invalid." {
			Errln(`Login is currently incompatible with git bash/cygwin
In the meantime, login via cmd.exe
https://github.com/heroku/heroku-cli/issues/84`)
			Exit(1)
		} else {
			ExitIfError(err)
		}
	}
	return password
}

func v2login(email, password, secondFactor string) (string, error) {
	req := apiRequestBase("")
	req.Method = "POST"

	queryPassword := "&password=" + url.QueryEscape(password)
	req.Uri = req.Uri + "/login?username=" + url.QueryEscape(email) + queryPassword
	if secondFactor != "" {
		req.AddHeader("Heroku-Two-Factor-Code", secondFactor)
	}
	res, err := req.Do()
	if err != nil {
		errorStr := err.Error()
		errorStr = strings.Replace(errorStr, queryPassword, "&password=XXXXXXXX", -1)
		err = errors.New(errorStr)
	}
	ExitIfError(err)
	if res.StatusCode == 403 {
		return v2login(email, password, getString("Two-factor code: "))
	}
	if res.StatusCode == 404 {
		return "", errors.New("Authentication failure.")
	}
	if res.StatusCode != 200 {
		return "", errors.New("Invalid response from API.\nAre you behind a proxy?\nhttps://devcenter.heroku.com/articles/using-the-cli#using-an-http-proxy")
	}
	type Doc struct {
		APIKey string `json:"api_key"`
	}
	var doc Doc
	ExitIfError(res.Body.FromJsonTo(&doc))
	return doc.APIKey, nil
}

func createOauthToken(email, password, secondFactor string) (string, error) {
	req := apiRequest("")
	req.Method = "POST"
	req.Uri = req.Uri + "/oauth/authorizations"
	req.BasicAuthUsername = email
	req.BasicAuthPassword = password
	req.Body = map[string]interface{}{
		"scope":       []string{"global"},
		"description": "Toolbelt CLI login from " + time.Now().UTC().Format(time.RFC3339),
		"expires_in":  60 * 60 * 24 * 30, // 30 days
	}
	if secondFactor != "" {
		req.AddHeader("Heroku-Two-Factor-Code", secondFactor)
	}
	res, err := req.Do()
	ExitIfError(err)
	type Doc struct {
		ID          string
		Message     string
		AccessToken struct {
			Token string
		} `json:"access_token"`
	}
	var doc Doc
	res.Body.FromJsonTo(&doc)
	if doc.ID == "two_factor" {
		return createOauthToken(email, password, getString("Two-factor code: "))
	}
	if res.StatusCode != 201 {
		return "", errors.New(doc.Message)
	}
	return doc.AccessToken.Token, nil
}

var authTokenCmd = &Command{
	Topic:       "auth",
	Command:     "token",
	Description: "Display your API token.",
	NeedsAuth:   true,
	Run: func(ctx *Context) {
		Println(ctx.APIToken)
	},
}
