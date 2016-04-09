package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/dickeyxxx/golock"
)

var analyticsPath = filepath.Join(HomeDir, ".heroku", "analytics.json")
var currentAnalyticsCommand = &AnalyticsCommand{
	Timestamp:  time.Now().Unix(),
	Version:    version(),
	OS:         runtime.GOOS,
	Arch:       runtime.GOARCH,
	Language:   runtime.Version(),
	CLIVersion: version(),
}

// AnalyticsCommand represents an analytics command
type AnalyticsCommand struct {
	Command    string `json:"command"`
	Plugin     string `json:"plugin,omitempty"`
	Timestamp  int64  `json:"timestamp"`
	CLIVersion string `json:"cli_version"`
	Version    string `json:"version"`
	OS         string `json:"os"`
	Arch       string `json:"arch"`
	Language   string `json:"language"`
	Status     int    `json:"status"`
	Runtime    int64  `json:"runtime"`
	Valid      bool   `json:"valid"`
	start      time.Time
}

// RecordStart marks when a command was started (for tracking runtime)
func (c *AnalyticsCommand) RecordStart() {
	c.start = time.Now()
}

// RecordEnd marks when a command was completed
// and records it to the analytics file
func (c *AnalyticsCommand) RecordEnd(status int) {
	if c == nil || skipAnalytics() || len(os.Args) < 2 {
		return
	}
	c.Command = os.Args[1]
	c.Status = status
	if !c.start.IsZero() {
		c.Valid = true
		c.Runtime = (time.Now().UnixNano() - c.start.UnixNano()) / 1000000
	}
	commands := readAnalyticsFile()
	commands = append(commands, *c)
	LogIfError(writeAnalyticsFile(commands))
}

func readAnalyticsFile() (commands []AnalyticsCommand) {
	f, err := os.Open(analyticsPath)
	if err != nil {
		return
	}
	json.NewDecoder(f).Decode(&commands)
	return commands
}

func writeAnalyticsFile(commands []AnalyticsCommand) error {
	data, err := json.MarshalIndent(commands, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(analyticsPath, data, 0644)
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
			LogIfError(err)
			return
		}
		if resp.StatusCode != 201 {
			Logln("analytics: HTTP " + resp.Status)
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
	return skip || netrcLogin() == ""
}
