package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/dickeyxxx/golock"
)

var analyticsPath = filepath.Join(HomeDir, ".heroku", "analytics.json")

// AnalyticsCommands represents the analytics file
type AnalyticsCommands []struct {
	Command   string `json:"command"`
	Timestamp int64  `json:"timestamp"`
	Version   string `json:"version"`
	Platform  string `json:"platform"`
	Language  string `json:"language"`
}

// RecordAnalytics records the commands users run
// For now the actual recording is done in the Ruby CLI,
// this just performs the submission
func RecordAnalytics(wg *sync.WaitGroup) {
	defer wg.Done()
	if skipAnalytics() {
		return
	}
	f, err := os.Open(analyticsPath)
	if err != nil {
		Logln(err)
		return
	}
	var analytics AnalyticsCommands
	if err := json.NewDecoder(f).Decode(&analytics); err != nil {
		Logln(err)
		return
	}
	if len(analytics) < 10 {
		// do not record if less than 10 analytics
		return
	}
	lockfile := filepath.Join(AppDir(), "analytics.lock")
	if locked, _ := golock.IsLocked(lockfile); locked {
		// skip if already updating
		return
	}
	golock.Lock(lockfile)
	defer golock.Unlock(lockfile)
	req := apiRequestBase("")
	req.Uri = "https://cli-analytics.heroku.com/record"
	req.Method = "POST"
	req.Body = struct {
		Commands AnalyticsCommands `json:"commands"`
		User     string            `json:"user"`
	}{
		Commands: analytics,
		User:     netrcLogin(),
	}
	resp, err := req.Do()
	if err != nil {
		Logln(err)
		return
	}
	if resp.StatusCode != 201 {
		Logln("analytics: HTTP " + resp.Status)
		return
	}
	os.Truncate(analyticsPath, 0)
}

func skipAnalytics() bool {
	skip, err := config.GetBool("skip_analytics")
	if err != nil {
		Logln(err)
		return true
	}
	return skip
}
