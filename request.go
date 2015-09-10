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

	"github.com/franela/goreq"
)

func init() {
	goreq.SetConnectTimeout(15 * time.Second)
	goreq.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{RootCAs: getCACerts()}
}

func apiRequest(authToken string) *goreq.Request {
	req := goreq.Request{
		Uri:       apiURL(),
		Accept:    "application/vnd.heroku+json; version=3",
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

func shouldVerifyHost(host string) bool {
	return !strings.HasSuffix(host, "herokudev.com")
}

func getCACerts() *x509.CertPool {
	certs := x509.NewCertPool()
	path := filepath.Join(AppDir, "cacert.pem")
	data, err := ioutil.ReadFile(path)
	if err != nil {
		downloadCert(path)
		data, err = ioutil.ReadFile(path)
		if err != nil {
			PrintError(err)
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
		PrintError(err)
		return
	}
	res, err := goreq.Request{
		Uri:       "https://raw.githubusercontent.com/bagder/ca-bundle/master/ca-bundle.crt",
		ShowDebug: debugging,
	}.Do()
	if err != nil {
		PrintError(err)
		return
	}
	defer res.Body.Close()
	defer f.Close()
	io.Copy(f, res.Body)
}
