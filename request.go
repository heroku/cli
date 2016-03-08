package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/heroku/heroku-cli/Godeps/_workspace/src/github.com/franela/goreq"
)

func init() {
	goreq.SetConnectTimeout(15 * time.Second)
	if !useSystemCerts() {
		goreq.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{RootCAs: getCACerts()}
	}
}

func useSystemCerts() bool {
	e := os.Getenv("HEROKU_USE_SYSTEM_CERTS")
	return e != "false" && e != "0"
}

func apiRequestBase(authToken string) *goreq.Request {
	req := goreq.Request{
		Uri:       apiURL(),
		ShowDebug: debugging,
		Insecure:  !shouldVerifyHost(apiURL()),
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

func apiRequest(authToken string) *goreq.Request {
	req := apiRequestBase(authToken)
	req.AddHeader("Accept", "application/vnd.heroku+json; version=3")
	return req
}

func shouldVerifyHost(host string) bool {
	return !(os.Getenv("HEROKU_SSL_VERIFY") == "disable" || strings.HasSuffix(host, "herokudev.com"))
}

func getCACerts() *x509.CertPool {
	certs := x509.NewCertPool()
	path := filepath.Join(AppDir(), "cacert.pem")
	data, err := ioutil.ReadFile(path)
	if err != nil {
		downloadCert(path)
		data, err = ioutil.ReadFile(path)
		if err != nil {
			PrintError(err, false)
			return nil
		}
	}
	ok := certs.AppendCertsFromPEM(data)
	if !ok {
		Warn("Error parsing " + path)
		return nil
	}
	return certs
}

func downloadCert(path string) {
	f, err := os.Create(path)
	if err != nil {
		PrintError(err, false)
		return
	}
	res, err := goreq.Request{
		Uri:       "https://cli-assets.heroku.com/cacert.pem",
		ShowDebug: debugging,
	}.Do()
	if err != nil {
		PrintError(err, false)
		return
	}
	defer res.Body.Close()
	defer f.Close()
	io.Copy(f, res.Body)
}
