package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Config interacts with the config.json
type Config struct {
	path string
}

var config = Config{
	path: filepath.Join(HomeDir, ".heroku", "config.json"),
}

// GetBool returns a config setting that is a bool
func (c *Config) GetBool(key string) (bool, error) {
	r, err := c.get(key)
	if err != nil {
		return false, err
	}
	return r.(bool), err
}

func (c *Config) get(key string) (interface{}, error) {
	f, err := os.Open(c.path)
	if err != nil {
		return nil, err
	}
	var config map[string]interface{}
	if err := json.NewDecoder(f).Decode(&config); err != nil {
		return nil, err
	}
	return config[key], nil
}
