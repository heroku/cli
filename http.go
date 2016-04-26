package main

import (
	"container/list"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/ansel1/merry"
	"github.com/dghubble/sling"
	"github.com/mitchellh/ioprogress"
	"github.com/ulikunitz/xz"
)

var apiHTTPClient *http.Client

func init() {
	getClient := func() *http.Client {
		return &http.Client{
			Timeout: 30 * time.Minute,
			Transport: &http.Transport{
				TLSClientConfig: httpTLSClientConfig(),
				Proxy:           http.ProxyFromEnvironment,
				Dial: (&net.Dialer{
					Timeout:   60 * time.Second,
					KeepAlive: 60 * time.Second,
				}).Dial,
				TLSHandshakeTimeout:   30 * time.Second,
				ExpectContinueTimeout: 3 * time.Second,
			},
		}
	}
	http.DefaultClient = getClient()
	apiHTTPClient = getClient()
	apiHTTPClient.Transport.(*http.Transport).TLSClientConfig.InsecureSkipVerify = !shouldVerifyHost(apiURL())
}

func useSystemCerts() bool {
	e := os.Getenv("HEROKU_USE_SYSTEM_CERTS")
	return e != "false" && e != "0"
}

// APIRequest is for requests to api.heroku.com
type APIRequest struct {
	*sling.Sling
}

// Auth the API request with a token
func (api *APIRequest) Auth(token string) *APIRequest {
	api.Set("Authorization", "Bearer "+token)
	return api
}

func apiRequest() *APIRequest {
	req := sling.New().Client(apiHTTPClient).Base(apiURL())
	req.Set("User-Agent", version())
	req.Set("Accept", "application/vnd.heroku+json; version=3")
	if os.Getenv("HEROKU_HEADERS") != "" {
		var h map[string]string
		json.Unmarshal([]byte(os.Getenv("HEROKU_HEADERS")), &h)
		for k, v := range h {
			req.Set(k, v)
		}
	}
	return &APIRequest{req}
}

func shouldVerifyHost(host string) bool {
	return !(os.Getenv("HEROKU_SSL_VERIFY") == "disable" || strings.HasSuffix(host, "herokudev.com"))
}

func httpTLSClientConfig() (config *tls.Config) {
	config = &tls.Config{}
	paths := list.New()
	if !useSystemCerts() {
		path := filepath.Join(AppDir, "lib", "cacert.pem")
		paths.PushBack(path)
	}

	sslCertFile := os.Getenv("SSL_CERT_FILE")
	if sslCertFile != "" {
		paths.PushBack(sslCertFile)
	}

	sslCertDir := os.Getenv("SSL_CERT_DIR")
	if sslCertDir != "" {
		files, err := ioutil.ReadDir(sslCertDir)
		if err != nil {
			Warn("Error opening " + sslCertDir)
			return
		}
		for _, file := range files {
			path := filepath.Join(sslCertDir, file.Name())
			paths.PushBack(path)
		}
	}

	if paths.Len() == 0 {
		return
	}

	certs := x509.NewCertPool()
	Debugln("Adding the following trusted certificate authorities")
	for e := paths.Front(); e != nil; e = e.Next() {
		path := e.Value.(string)
		Debugln("  " + path)
		data, err := ioutil.ReadFile(path)
		if err != nil {
			WarnIfError(err)
			return
		}
		ok := certs.AppendCertsFromPEM(data)
		if !ok {
			Warn("Error parsing " + path)
			return
		}
	}
	config.RootCAs = certs
	return
}

func getProxy() *url.URL {
	req, err := http.NewRequest("GET", "https://api.heroku.com", nil)
	WarnIfError(err)
	proxy, err := http.ProxyFromEnvironment(req)
	WarnIfError(err)
	return proxy
}

var downloadingMessage string

func progressDrawFn(progress, total int64) string {
	return fmt.Sprintf(downloadingMessage+" %15s", ioprogress.DrawTextFormatBytes(progress, total))
}

func downloadXZ(url string) (io.Reader, func() string, error) {
	req, err := sling.New().Get(url).Request()
	if err != nil {
		return nil, nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, nil, err
	}
	size, _ := strconv.Atoi(resp.Header.Get("Content-Length"))
	progress := &ioprogress.Reader{
		Reader:   resp.Body,
		Size:     int64(size),
		DrawFunc: ioprogress.DrawTerminalf(os.Stderr, progressDrawFn),
	}
	getSha, reader := computeSha(progress)
	uncompressed, err := xz.NewReader(reader)
	return uncompressed, getSha, err
}

func getHTTPError(rsp *http.Response) error {
	if rsp.StatusCode >= 200 && rsp.StatusCode < 300 {
		return nil
	}
	return merry.Errorf("HTTP Error: %s %s", rsp.Request.URL, rsp.Status)
}
