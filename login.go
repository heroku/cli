package main

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"time"

	"github.com/dickeyxxx/speakeasy"
)

var loginTopic = &Topic{
	Name:        "login",
	Description: "Login with your Heroku credentials.",
}

var loginCmd = &Command{
	Topic:       "login",
	Description: "Login with your Heroku credentials.",
	Run: func(ctx *Context) {
		login()
	},
}

var authLoginCmd = &Command{
	Topic:       "auth",
	Command:     "login",
	Description: "Login with your Heroku credentials.",
	Run: func(ctx *Context) {
		login()
	},
}

func login() {
	Println("Enter your Heroku credentials.")
	email := getString("Email: ")
	password := getPassword()

	token, err := v2login(email, password, "")
	// TODO: use createOauthToken (v3 API)
	// token, err := createOauthToken(email, password, "")
	if err != nil {
		PrintError(err)
		return
	}
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

func getPassword() string {
	password, err := speakeasy.Ask("Password (typing will be hidden): ")
	if err != nil {
		PrintError(err)
	}
	return password
}

func v2login(email, password, secondFactor string) (string, error) {
	req := apiRequestBase("")
	req.Method = "POST"
	req.Uri = req.Uri + "/login?username=" + url.QueryEscape(email) + "&password=" + url.QueryEscape(password)
	if secondFactor != "" {
		req.AddHeader("Heroku-Two-Factor-Code", secondFactor)
	}
	res, err := req.Do()
	ExitIfError(err)
	type Doc struct {
		APIKey string `json:"api_key"`
	}
	var doc Doc
	res.Body.FromJsonTo(&doc)
	if res.StatusCode == 403 {
		return v2login(email, password, getString("Two-factor code: "))
	}
	if res.StatusCode != 200 {
		return "", errors.New("Authentication failure.")
	}
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
