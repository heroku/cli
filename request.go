package main

import (
	"strings"

	"github.com/franela/goreq"
)

func apiRequest(authToken string) *goreq.Request {
	req := goreq.Request{
		Uri:       "https://" + apiHost(),
		Accept:    "application/vnd.heroku+json; version=3",
		ShowDebug: debugging,
		Insecure:  !shouldVerifyHost(apiHost()),
	}
	if authToken != "" {
		req.AddHeader("Authorization", "Bearer "+authToken)
	}
	return &req
}

func shouldVerifyHost(host string) bool {
	return !strings.HasSuffix(host, "herokudev.com")
}
