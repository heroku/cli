package main

import (
	"encoding/json"
	"fmt"
)

func runFn(module, topic, command string) func(ctx *Context) {
	return func(ctx *Context) {
		ctxJson, err := json.Marshal(ctx)
		must(err)
		script := fmt.Sprintf(`
		require('%s')
		.commands.filter(function (command) {
			return command.topic == '%s' && command.name == '%s'
		})[0]
		.run(%s)`, module, topic, command, ctxJson)

		cmd := node.RunScript(script)
		cmd.Stdout = Stdout
		cmd.Stderr = Stderr
		must(cmd.Run())
	}
}

func getPackageCommands(name string) []*Command {
	script := `console.log(JSON.stringify(require('` + name + `')))`
	cmd := node.RunScript(script)
	cmd.Stderr = Stderr
	output, err := cmd.StdoutPipe()
	must(err)
	must(cmd.Start())
	var response map[string][]*Command
	err = json.NewDecoder(output).Decode(&response)
	if err != nil {
		Errln("Error reading plugin:", name)
		return nil
	}
	must(cmd.Wait())
	commands := response["commands"]
	for _, command := range commands {
		command.Run = runFn(name, command.Topic, command.Name)
	}
	return commands
}

func PluginCommands() (commands []*Command) {
	packages, err := node.Packages()
	must(err)
	for _, pkg := range packages {
		commands = append(commands, getPackageCommands(pkg.Name)...)
	}
	return commands
}
