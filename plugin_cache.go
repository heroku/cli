package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

var pluginCachePath = filepath.Join(AppDir(), "plugin-cache.json")

// AddPluginsToCache adds/updates a set of plugins to ~/.heroku/plugin-cache.json
func AddPluginsToCache(plugins ...*Plugin) {
	cache := FetchPluginCache()
	for _, plugin := range plugins {
		if plugin != nil {
			cache.Plugins[plugin.Name] = plugin
		}
	}
	savePluginCache(cache)
}

// RemovePluginFromCache will take a plugin and remove it from the list
func RemovePluginFromCache(name string) {
	cache := FetchPluginCache()
	delete(cache.Plugins, name)
	savePluginCache(cache)
}

func savePluginCache(cache PluginCache) {
	f, err := os.Create(pluginCachePath)
	if err != nil {
		panic(err)
	}
	if err := json.NewEncoder(f).Encode(cache); err != nil {
		panic(err)
	}
}

const pluginCacheVersion = 1

// PluginCache is the cache document at ~/.heroku/plugin-cache.json
type PluginCache struct {
	Version int                `json:"version"`
	Plugins map[string]*Plugin `json:"plugins"`
}

// FetchPluginCache returns the plugins from the cache
func FetchPluginCache() PluginCache {
	newCache := PluginCache{pluginCacheVersion, make(map[string]*Plugin, 100)}
	if exists, _ := fileExists(pluginCachePath); !exists {
		return newCache
	}
	f, err := os.Open(pluginCachePath)
	if err != nil {
		return newCache
	}
	var cache PluginCache
	if err := json.NewDecoder(f).Decode(&cache); err != nil {
		panic(err)
	}
	if cache.Version != pluginCacheVersion {
		return newCache
	}
	return cache
}
