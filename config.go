package main

import (
	"os"
	"path/filepath"
)

// Config interacts with the config.json
type Config struct {
	SkipAnalytics *bool    `json:"skip_analytics"`
	Color         *bool    `json:"color"`
	Plugins       []string `json:"plugins"`
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
			WarnIfError(config.Save())
		} else {
			WarnIfError(err)
		}
	}
}

// Save the config
func (c *Config) Save() error {
	return saveJSON(c, configPath())
}

func pbool(b bool) *bool {
	a := b
	return &a
}
