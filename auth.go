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
