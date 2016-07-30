package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/dghubble/sling"
	"github.com/dickeyxxx/golock"
)

var analyticsPath = filepath.Join(CacheHome, "analytics.json")

type analyticsBody struct {
	Schema   int                `json:"schema"`
	Commands []AnalyticsCommand `json:"commands,omitempty"`
	User     string             `json:"user,omitempty"`
}

var currentAnalyticsCommand = &AnalyticsCommand{
	Timestamp: time.Now().Unix(),
	OS:        runtime.GOOS,
	Arch:      runtime.GOARCH,
	Language:  "go",
	Valid:     true,
}

// AnalyticsCommand represents an analytics command
type AnalyticsCommand struct {
	Command       string `json:"command"`
	Plugin        string `json:"plugin,omitempty"`
	PluginVersion string `json:"plugin_version,omitempty"`
	Timestamp     int64  `json:"timestamp"`
	Version       string `json:"version"`
	OS            string `json:"os"`
	Arch          string `json:"arch"`
	Language      string `json:"language"`
	Status        int    `json:"status"`
	Runtime       int64  `json:"runtime"`
	Valid         bool   `json:"valid"`
	start         time.Time
}

// RecordStart marks when a command was started (for tracking runtime)
func (c *AnalyticsCommand) RecordStart() {
	c.Version = Version
	c.start = time.Now()
}

// RecordEnd marks when a command was completed
// and records it to the analytics file
func (c *AnalyticsCommand) RecordEnd(status int) {
	if c == nil || skipAnalytics() || len(Args) < 2 || (c.Valid && c.start.IsZero()) {
		return
	}
	c.Command = Args[1]
	c.Status = status
	if !c.start.IsZero() {
		c.Runtime = (time.Now().UnixNano() - c.start.UnixNano()) / 1000000
	}
	file := readAnalyticsFile()
	file.Commands = append(file.Commands, *c)
	LogIfError(writeAnalyticsFile(file))
}

func readAnalyticsFile() (file analyticsBody) {
	f, err := os.Open(analyticsPath)
	if err != nil {
		if !os.IsNotExist(err) {
			LogIfError(err)
		}
		return
	}
	if err := json.NewDecoder(f).Decode(&file); err != nil {
		LogIfError(err)
	}
	if file.Schema != 1 {
		return analyticsBody{Schema: 1}
	}
	return file
}

func writeAnalyticsFile(file analyticsBody) error {
	data, err := json.MarshalIndent(file, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(analyticsPath, data, 0644)
}

// SubmitAnalytics sends the analytics info to the analytics service
func SubmitAnalytics() {
	if skipAnalytics() {
		return
	}
	file := readAnalyticsFile()
	lockfile := filepath.Join(CacheHome, "analytics.lock")
	golock.Lock(lockfile)
	defer golock.Unlock(lockfile)
	file = readAnalyticsFile() // read commands again in case it was locked
	file.User = netrcLogin()

	host := os.Getenv("HEROKU_ANALYTICS_HOST")
	if host == "" {
		host = "https://cli-analytics.heroku.com"
	}

	resp, err := sling.New().Base(host).Post("/record").BodyJSON(file).ReceiveSuccess(nil)
	if err != nil {
		LogIfError(err)
		return
	}
	LogIfError(getHTTPError(resp))
	writeAnalyticsFile(analyticsBody{Schema: 1})
}

func skipAnalytics() bool {
	return os.Getenv("TESTING") == ONE || (config.SkipAnalytics != nil && *config.SkipAnalytics) || netrcLogin() == ""
}
