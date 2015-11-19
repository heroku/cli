package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

var pluginCachePath = filepath.Join(AppDir(), "plugin-cache.json")

// UpdatePluginCache updates all the plugins in ~/.heroku/plugin-cache.json
func UpdatePluginCache() {
	cache := FetchPluginCache()
	for _, plugin := range cache {
		cache[plugin.Name] = getPlugin(plugin.Name, false)
	}
	savePluginCache(cache)
}

// AddPluginsToCache adds/updates a set of plugins to ~/.heroku/plugin-cache.json
func AddPluginsToCache(plugins ...*Plugin) {
	cache := FetchPluginCache()
	for _, plugin := range plugins {
		cache[plugin.Name] = plugin
	}
	savePluginCache(cache)
}

func savePluginCache(cache map[string]*Plugin) {
	f, err := os.Create(pluginCachePath)
	if err != nil {
		panic(err)
	}
	if err := json.NewEncoder(f).Encode(cache); err != nil {
		panic(err)
	}
}

// FetchPluginCache returns the plugins from the cache
func FetchPluginCache() map[string]*Plugin {
	plugins := make(map[string]*Plugin, 100)
	if exists, _ := fileExists(pluginCachePath); !exists {
		return plugins
	}
	f, err := os.Open(pluginCachePath)
	if err != nil {
		return plugins
	}
	if err := json.NewDecoder(f).Decode(&plugins); err != nil {
		panic(err)
	}
	return plugins
}
