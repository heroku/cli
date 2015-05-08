package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"time"

	"github.com/bgentry/speakeasy"
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
	netrc.NewMachine("api.heroku.com", email, token, "")
	netrc.NewMachine("git.heroku.com", email, token, "")
	body, err := netrc.MarshalText()
	body = append(body, '\n')
	ExitIfError(err)
	ioutil.WriteFile(netrcPath(), body, 0600)
}

func getString(prompt string) string {
	var s string
	Print(prompt)
	if _, err := fmt.Scanln(&s); err != nil {
		if err.Error() == "unexpected newline" {
			return getString(prompt)
		}
		panic(err)
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
		Uri:               "https://api.heroku.com/oauth/authorizations",
		Method:            "POST",
		Accept:            "application/vnd.heroku+json; version=3",
		BasicAuthUsername: email,
		BasicAuthPassword: password,
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
	if err != nil {
		panic(err)
	}
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
