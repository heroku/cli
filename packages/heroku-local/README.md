heroku-local
============

Run heroku apps locally. This plugin is built into the Heroku Toolbelt, you do not need to install it separately.

To use:

```
$ heroku local
forego  | starting web.1 on port 5000
```

This command internally uses [forego](https://github.com/ddollar/forego) to run the app locally.

Help
=======

```
$ heroku help local

Usage: heroku local [PROCESSNAME]

 run heroku app locally

 Start the application specified by a Procfile (defaults to ./Procfile)

 Examples:

   heroku local
   heroku local web
   heroku local -f Procfile.test -e .env.test

 -f, --procfile PROCFILE
 -e, --env ENV
 -c, --concurrency CONCURRENCY
 -p, --port PORT
 -r, --r

Additional commands, type "heroku help COMMAND" for more details:

  local:version  #  display forego version
```
