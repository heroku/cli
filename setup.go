package main

import (
	"encoding/json"
	"io/ioutil"
	"path/filepath"
	"strings"
)

var setupTopic = &Topic{
	Name:   "setup",
	Hidden: true,
}

var setupCmd = &Command{
	Topic:       "setup",
	Description: "used in building the CLI",
	Hidden:      true,
	Run: func(ctx *Context) {
		pjson, err := readPackageJSON(filepath.Join(corePlugins.Path, "package.json"))
		ExitIfError(err)
		plugins := []string{}
		for name, v := range pjson["dependencies"].(map[string]interface{}) {
			plugins = append(plugins, name+"@"+v.(string))
		}
		corePlugins.installPackages(plugins...)
		for _, plugin := range plugins {
			plugin, err := corePlugins.ParsePlugin(strings.Split(plugin, "@")[0])
			ExitIfError(err)
			corePlugins.addToCache(plugin)
		}
	},
}

func readPackageJSON(path string) (pjson map[string]interface{}, err error) {
	if exists, err := fileExists(path); !exists {
		if err != nil {
			panic(err)
		}
		return map[string]interface{}{}, nil
	}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(data, &pjson)
	return pjson, err
}
