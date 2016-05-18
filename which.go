package main

func init() {
	topics = append(topics, &Topic{
		Name:   "which",
		Hidden: true,
		Commands: Commands{
			{
				Topic: "which",
				Args:  []Arg{{Name: "command"}},
				Run: func(ctx *Context) {
					command := ctx.Args.(map[string]string)["command"]
					cmd := AllCommands().Find(command)
					if cmd == nil {
						Println("No command found. Could be a ruby command. https://github.com/heroku/heroku")
						Exit(1)
					}
					if cmd.Plugin == "" {
						Println("Command in go core. https://github.com/heroku/cli")
					} else {
						Println("Command in npm package: " + cmd.Plugin + ". https://www.npmjs.com/package/" + cmd.Plugin)
					}
				},
			},
		},
	})
}
