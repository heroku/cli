package main

import (
	"container/list"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/franela/goreq"
	"github.com/mitchellh/ioprogress"
	"github.com/ulikunitz/xz"
)

func init() {
	goreq.SetConnectTimeout(15 * time.Second)
	certs := getCACerts()
	if certs != nil {
		goreq.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{RootCAs: certs}
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
		UserAgent: version(),
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
	paths := list.New()
	if !useSystemCerts() {
		path := filepath.Join(AppDir, "cacert.pem")
		if _, err := os.Stat(path); os.IsNotExist(err) {
			downloadCert(path)
		}
		paths.PushBack(path)
	}

	ssl_cert_file := os.Getenv("SSL_CERT_FILE")
	if ssl_cert_file != "" {
		paths.PushBack(ssl_cert_file)
	}

	ssl_cert_dir := os.Getenv("SSL_CERT_DIR")
	if ssl_cert_dir != "" {
		files, err := ioutil.ReadDir(ssl_cert_dir)
		if err != nil {
			Warn("Error opening " + ssl_cert_dir)
			return nil
		}
		for _, file := range files {
			path := filepath.Join(ssl_cert_dir, file.Name())
			paths.PushBack(path)
		}
	}

	if paths.Len() == 0 {
		return nil
	}

	certs := x509.NewCertPool()
	Debugln("Adding the following trusted certificate authorities")
	for e := paths.Front(); e != nil; e = e.Next() {
		path := e.Value.(string)
		Debugln("  " + path)
		data, err := ioutil.ReadFile(path)
		if err != nil {
			WarnIfError(err)
			return nil
		}
		ok := certs.AppendCertsFromPEM(data)
		if !ok {
			Warn("Error parsing " + path)
			return nil
		}
	}
	return certs
}

func downloadCert(path string) {
	f, err := os.Create(path)
	if err != nil {
		WarnIfError(err)
		return
	}
	res, err := goreq.Request{
		Uri:       "https://cli-assets.heroku.com/cacert.pem",
		ShowDebug: debugging,
	}.Do()
	if err != nil {
		WarnIfError(err)
		return
	}
	defer res.Body.Close()
	defer f.Close()
	io.Copy(f, res.Body)
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
	req := goreq.Request{Uri: url, Timeout: 30 * time.Minute}
	resp, err := req.Do()
	if err != nil {
		return nil, nil, err
	}
	if err := getHTTPError(resp); err != nil {
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

func getHTTPError(resp *goreq.Response) error {
	if resp.StatusCode < 400 {
		return nil
	}
	var body string
	body = resp.Header.Get("Content-Type")
	return fmt.Errorf("%s: %s", resp.Status, body)
}
