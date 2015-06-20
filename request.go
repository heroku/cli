package main

import (
	"encoding/json"
	"os"
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
	if os.Getenv("HEROKU_HEADERS") != "" {
		var h map[string]string
		json.Unmarshal([]byte(os.Getenv("HEROKU_HEADERS")), &h)
		for k, v := range h {
			req.AddHeader(k, v)
		}
	}
	return &req
}

func shouldVerifyHost(host string) bool {
	return !strings.HasSuffix(host, "herokudev.com")
}
