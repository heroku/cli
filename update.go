package main

import (
	"compress/gzip"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

var binPath = filepath.Join(AppDir, "hk")

func updateIfNeeded() {
	if !updateNeeded() {
		return
	}
	// TODO: update plugins
	manifest := getUpdateManifest()
	if manifest.Version == Version {
		// Set timestamp of bin so we don't update again
		os.Chtimes(binPath, time.Now(), time.Now())
		return
	}
	if !updatable() {
		Errf("Out of date: You are running %s but %s is out.\n", Version, manifest.Version)
		return
	}
	Errf("Updating to %s... ", manifest.Version)
	build := manifest.Builds[runtime.GOOS][runtime.GOARCH]
	update(build.Url, build.Sha1)
	Errln("done")
	execBin()
	os.Exit(0)
}

func updateNeeded() bool {
	if Version == "dev" {
		return false
	}
	f, err := os.Stat(binPath)
	if err != nil {
		must(err)
	}
	return f.ModTime().Add(20 * time.Minute).Before(time.Now())
}

type manifest struct {
	Channel, Version string
	Builds           map[string]map[string]struct {
		Url, Sha1 string
	}
}

func getUpdateManifest() manifest {
	res, err := http.Get("https://d1gvo455cekpjp.cloudfront.net/hk/" + Channel + "/manifest.json")
	if err != nil {
		panic(err)
	}
	var m manifest
	json.NewDecoder(res.Body).Decode(&m)
	return m
}

func updatable() bool {
	path, err := filepath.Abs(os.Args[0])
	if err != nil {
		Errln(err)
	}
	return path == binPath
}

func update(url, sha1 string) {
	tmp, err := downloadBin(url)
	if err != nil {
		panic(err)
	}
	if fileSha1(tmp) != sha1 {
		panic("SHA mismatch")
	}
	if err := os.Rename(tmp, binPath); err != nil {
		panic(err)
	}
}

func downloadBin(url string) (string, error) {
	out, err := os.OpenFile(binPath+"~", os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return "", err
	}
	defer out.Close()
	client := &http.Client{}
	req, err := http.NewRequest("GET", url+".gz", nil)
	if err != nil {
		return "", err
	}
	req.Header.Add("Accept-Encoding", "gzip")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	uncompressed, err := gzip.NewReader(resp.Body)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(out, uncompressed)
	return out.Name(), err
}

func fileSha1(path string) string {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}
	return fmt.Sprintf("%x", sha1.Sum(data))
}

func execBin() {
	cmd := exec.Command(binPath, os.Args[1:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		panic(err)
	}
}
