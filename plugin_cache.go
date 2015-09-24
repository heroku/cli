package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

var pluginCachePath = filepath.Join(AppDir(), "plugin-cache.json")

// ClearPluginCache deletes the plugin cache
func ClearPluginCache() {
	os.Remove(pluginCachePath)
}

// WritePluginCache caches the plugins to ~/.heroku/plugin-cache.json
func WritePluginCache(list []Plugin) {
	plugins := map[string]Plugin{}
	for _, plugin := range list {
		plugins[plugin.Name] = plugin
	}
	f, err := os.Create(pluginCachePath)
	if err != nil {
		panic(err)
	}
	if err := json.NewEncoder(f).Encode(plugins); err != nil {
		panic(err)
	}
}

// FetchPluginCache returns the plugins from the cache
func FetchPluginCache() map[string]*Plugin {
	var plugins map[string]*Plugin
	f, err := os.Open(pluginCachePath)
	if err != nil {
		return plugins
	}
	if err := json.NewDecoder(f).Decode(&plugins); err != nil {
		panic(err)
	}
	return plugins
}
