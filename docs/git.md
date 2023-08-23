`heroku git`
============

set git remote and clone Heroku repository

* [`heroku git:clone [DIRECTORY]`](#heroku-gitclone-directory)
* [`heroku git:remote`](#heroku-gitremote)

## `heroku git:clone [DIRECTORY]`

clones a heroku app to your local machine at DIRECTORY (defaults to app name)

```
USAGE
  $ heroku git:clone [DIRECTORY] -a <value> [-r <value>]

ARGUMENTS
  DIRECTORY  where to clone the app

FLAGS
  -a, --app=<value>     (required) the Heroku app to use
  -r, --remote=<value>  the git remote to create, default "heroku"

DESCRIPTION
  clones a heroku app to your local machine at DIRECTORY (defaults to app name)

EXAMPLES
  $ heroku git:clone -a example
  Cloning into 'example'...
  remote: Counting objects: 42, done.
  ...
```

_See code: [src/commands/git/clone.ts](https://github.com/heroku/cli/blob/v8.4.0-beta.2/src/commands/git/clone.ts)_

## `heroku git:remote`

adds a git remote to an app repo

```
USAGE
  $ heroku git:remote [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     the Heroku app to use
  -r, --remote=<value>  the git remote to create

DESCRIPTION
  adds a git remote to an app repo
  extra arguments will be passed to git remote add


EXAMPLES
  # set git remote heroku to https://git.heroku.com/example.git
      $ heroku git:remote -a example
      # set git remote heroku-staging to https://git.heroku.com/example.git
      $ heroku git:remote --remote heroku-staging -a example
```

_See code: [src/commands/git/remote.ts](https://github.com/heroku/cli/blob/v8.4.0-beta.2/src/commands/git/remote.ts)_
