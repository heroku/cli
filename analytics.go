package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dickeyxxx/golock"
)

var analyticsPath = filepath.Join(HomeDir, ".heroku", "analytics.json")
var currentAnalyticsCommand = AnalyticsCommand{
	Command: "foo",
}

// AnalyticsCommand represents an analytics command
type AnalyticsCommand struct {
	Command   string `json:"command"`
	Timestamp int64  `json:"timestamp"`
	Version   string `json:"version"`
	Platform  string `json:"platform"`
	Language  string `json:"language"`
	Status    int64  `json:"status"`
	Runtime   int64  `json:"runtime"`
}

// RecordAnalytics sends the analytics info to the analytics service
func RecordAnalytics(cmd AnalyticsCommand) {
	wg.Add(1)
	go func() {
		defer wg.Done()
		if skipAnalytics() {
			return
		}
		commands := readAnalyticsFile()
		commands = append(commands, cmd)
		writeAnalyticsFile(commands)
	}()
}

func readAnalyticsFile() (commands []AnalyticsCommand) {
	f, err := os.Open(analyticsPath)
	if err != nil {
		Logln(err)
		return
	}
	if err := json.NewDecoder(f).Decode(&commands); err != nil {
		Logln(err)
		return
	}
	return commands
}

func writeAnalyticsFile(commands []AnalyticsCommand) {
	data, err := json.MarshalIndent(commands, "", "  ")
	if err != nil {
		Logln(err)
		return
	}
	if err := ioutil.WriteFile(analyticsPath, data, 0644); err != nil {
		Logln(err)
	}
}

// SubmitAnalytics sends the analytics info to the analytics service
func SubmitAnalytics() {
	wg.Add(1)
	go func() {
		defer wg.Done()
		if skipAnalytics() {
			return
		}
		commands := readAnalyticsFile()
		if len(commands) < 10 {
			// do not record if less than 10 commands
			return
		}
		lockfile := filepath.Join(AppDir(), "analytics.lock")
		if locked, _ := golock.IsLocked(lockfile); locked {
			// skip if already updating
			return
		}
		golock.Lock(lockfile)
		defer golock.Unlock(lockfile)
		plugins := func() map[string]string {
			plugins := make(map[string]string)
			for _, plugin := range GetPlugins() {
				plugins[plugin.Name] = plugin.Version
			}
			dirs, _ := ioutil.ReadDir(filepath.Join(HomeDir, ".heroku", "plugins"))
			for _, dir := range dirs {
				plugins[dir.Name()] = "ruby"
			}
			return plugins
		}

		req := apiRequestBase("")
		host := os.Getenv("HEROKU_ANALYTICS_HOST")
		if host == "" {
			host = "https://cli-analytics.heroku.com"
		}
		req.Uri = host + "/record"
		req.Method = "POST"
		req.Body = struct {
			Version  string             `json:"version"`
			Commands []AnalyticsCommand `json:"commands"`
			User     string             `json:"user"`
			Plugins  map[string]string  `json:"plugins"`
		}{version(), commands, netrcLogin(), plugins()}
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
	}()
}

func skipAnalytics() bool {
	skip, err := config.GetBool("skip_analytics")
	if err != nil {
		Logln(err)
		return true
	}
	return skip
}
