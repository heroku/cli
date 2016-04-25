package main

import "path/filepath"

// Config interacts with the config.json
type Config struct {
	path   string
	config map[string]interface{}
}

var config = Config{
	path: filepath.Join(ConfigHome, "config.json"),
}

// GetBool returns a config setting that is a bool
func (c *Config) GetBool(key string) (*bool, error) {
	r, err := c.get(key)
	if err != nil {
		return nil, err
	}
	if r == nil {
		return nil, nil
	}
	b := r.(bool)
	return &b, nil
}

func (c *Config) get(key string) (interface{}, error) {
	if c.config == nil {
		var err error
		c.config, err = readJSON(c.path)
		if err != nil {
			return nil, err
		}
	}
	return c.config[key], nil
}
