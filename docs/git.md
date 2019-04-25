`heroku git`
============

manage local git repository for app

* [`heroku git:clone [DIRECTORY]`](#heroku-gitclone-directory)
* [`heroku git:remote`](#heroku-gitremote)

## `heroku git:clone [DIRECTORY]`

clones a heroku app to your local machine at DIRECTORY (defaults to app name)

```
USAGE
  $ heroku git:clone [DIRECTORY]

ARGUMENTS
  DIRECTORY  where to clone the app

OPTIONS
  -a, --app=app        (required) the Heroku app to use
  -r, --remote=remote  the git remote to create, default "heroku"
  --ssh-git            use SSH git protocol

EXAMPLES
  $ heroku git:clone -a example
  Cloning into 'example'...
  remote: Counting objects: 42, done.
  ...
```

_See code: [@heroku-cli/plugin-git](https://github.com/heroku/cli/blob/v7.24.0/packages/git/src/commands/git/clone.ts)_

## `heroku git:remote`

adds a git remote to an app repo

```
USAGE
  $ heroku git:remote

OPTIONS
  -a, --app=app        the Heroku app to use
  -r, --remote=remote  the git remote to create
  --ssh-git            use SSH git protocol

DESCRIPTION
  extra arguments will be passed to git remote add

EXAMPLES
  # set git remote heroku to https://git.heroku.com/example.git
       $ heroku git:remote -a example

       # set git remote heroku-staging to https://git.heroku.com/example-staging.git
       $ heroku git:remote --remote heroku-staging -a example
```

_See code: [@heroku-cli/plugin-git](https://github.com/heroku/cli/blob/v7.24.0/packages/git/src/commands/git/remote.ts)_
