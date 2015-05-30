package main

import "github.com/franela/goreq"

func apiRequest(authToken string) *goreq.Request {
	req := goreq.Request{
		Uri:       "https://" + herokuAPIHost(),
		Accept:    "application/vnd.heroku+json; version=3",
		ShowDebug: debugging,
		Insecure:  !shouldVerifyHost(),
	}
	if authToken != "" {
		req.AddHeader("Authorization", "Bearer "+authToken)
	}
	return &req
}
