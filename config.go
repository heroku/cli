package main

import (
	"os"
	"path/filepath"
)

// Config interacts with the config.json
type Config struct {
	SkipAnalytics *bool `json:"skip_analytics"`
	Color         *bool `json:"color"`
}

var config *Config

func configPath() string {
	return filepath.Join(ConfigHome, "config.json")
}

func init() {
	err := readJSON(&config, configPath())
	if config == nil {
		config = &Config{
			SkipAnalytics: pbool(false),
			Color:         pbool(true),
		}
	}
	if err != nil {
		if os.IsNotExist(err) {
			saveJSON(&config, configPath())
		} else {
			WarnIfError(err)
		}
	}
}

func pbool(b bool) *bool {
	a := b
	return &a
}
