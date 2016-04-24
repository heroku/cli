package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

func (p *Plugins) addToCache(plugins ...*Plugin) {
	cache := p.Plugins()
	contains := func(name string) int {
		for i, plugin := range cache {
			if plugin.Name == name {
				return i
			}
		}
		return -1
	}
	for _, plugin := range plugins {
		// find or replace
		i := contains(plugin.Name)
		if i == -1 {
			cache = append(cache, plugin)
		} else {
			cache[i] = plugin
		}
	}
	p.saveCache(cache)
}

func (p *Plugins) removeFromCache(name string) {
	plugins := p.Plugins()
	for i, plugin := range plugins {
		if plugin.Name == name {
			plugins = append(plugins[:i], plugins[i+1:]...)
		}
	}
	p.saveCache(plugins)
}

func (p *Plugins) saveCache(plugins []*Plugin) {
	if err := saveJSON(plugins, p.cachePath()); err != nil {
		panic(err)
	}
}

// Plugins reads the cache file into the struct
func (p *Plugins) Plugins() (plugins []*Plugin) {
	if exists, _ := fileExists(p.cachePath()); !exists {
		return
	}
	f, err := os.Open(p.cachePath())
	if err != nil {
		LogIfError(err)
		return
	}
	err = json.NewDecoder(f).Decode(&plugins)
	WarnIfError(err)
	return
}

func (p *Plugins) cachePath() string {
	return filepath.Join(p.Path, "plugins.json")
}
