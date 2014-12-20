package main

var cmdList = &Command{
	ShortHelp: "Lists the installed plugins",
	Help: `Lists installed plugins

  Example:
  $ heroku plugins`,

	Run: func(ctx *Context) {
		packages, err := node.Packages()
		must(err)
		for _, pkg := range packages {
			Println(pkg.Name, pkg.Version)
		}
	},
}
