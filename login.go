package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"time"

	"github.com/franela/goreq"
	"github.com/howeyc/gopass"
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
	email := getEmail()
	password := getPassword()

	token, err := createOauthToken(email, password)
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
	if err != nil {
		panic(err)
	}
	ioutil.WriteFile(netrcPath(), body, 0600)
}

func getEmail() (email string) {
	Print("Email: ")
	if _, err := fmt.Scanln(&email); err != nil {
		if err.Error() == "unexpected newline" {
			return getEmail()
		}
		panic(err)
	}
	return email
}

func getPassword() string {
	Print("Password (typing will be hidden): ")
	password := string(gopass.GetPasswd())
	if password == "" {
		return getPassword()
	}
	return password
}

func createOauthToken(email, password string) (string, error) {
	res, err := goreq.Request{
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
	}.Do()
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
	if res.StatusCode != 201 {
		return "", errors.New(doc.Message)
	}
	return doc.AccessToken.Token, nil
}
