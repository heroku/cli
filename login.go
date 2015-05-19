package main

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/dickeyxxx/speakeasy"
	"github.com/franela/goreq"
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

func login() {
	Println("Enter your Heroku credentials.")
	email := getString("Email: ")
	password := getPassword()

	token, err := createOauthToken(email, password, "")
	if err != nil {
		PrintError(err)
		return
	}
	saveOauthToken(email, token)
	Println("Logged in")
}

func saveOauthToken(email, token string) {
	netrc := getNetrc()
	netrc.NewMachine(herokuAPIHost(), email, token, "")
	netrc.NewMachine(herokuGitHost(), email, token, "")
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

func createOauthToken(email, password, secondFactor string) (string, error) {
	req := goreq.Request{
		Uri:               "https://" + herokuAPIHost() + "/oauth/authorizations",
		Method:            "POST",
		Accept:            "application/vnd.heroku+json; version=3",
		ShowDebug:         debugging,
		BasicAuthUsername: email,
		BasicAuthPassword: password,
		Insecure:          !shouldVerifyHost(),
		Body: map[string]interface{}{
			"scope":       []string{"global"},
			"description": "Toolbelt CLI login from " + time.Now().UTC().Format(time.RFC3339),
			"expires_in":  60 * 60 * 24 * 30, // 30 days
		},
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
