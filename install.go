package main

var cmdInstall = &Command{
	Name:      "install",
	Args:      []*Arg{{Name: "name"}},
	ShortHelp: "Installs a plugin into the CLI",
	Help: `Install a Heroku plugin

  Example:
  $ heroku plugins:install dickeyxxx/heroku-production-status`,

	Run: func(ctx *Context) {
		name := ctx.Args["name"]
		Errf("Installing plugin %s... ", name)
		must(node.InstallPackage(name))
		Errln("done")
	},
}
