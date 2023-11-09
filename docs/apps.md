`heroku apps`
=============

manage apps on Heroku

* [`heroku apps`](#heroku-apps)
* [`heroku apps:create [APPS]`](#heroku-appscreate-apps)
* [`heroku apps:delete`](#heroku-appsdelete)
* [`heroku apps:destroy`](#heroku-appsdestroy)
* [`heroku apps:errors`](#heroku-appserrors)
* [`heroku apps:favorites`](#heroku-appsfavorites)
* [`heroku apps:favorites:add`](#heroku-appsfavoritesadd)
* [`heroku apps:favorites:remove`](#heroku-appsfavoritesremove)
* [`heroku apps:info`](#heroku-appsinfo)
* [`heroku apps:join`](#heroku-appsjoin)
* [`heroku apps:leave`](#heroku-appsleave)
* [`heroku apps:list`](#heroku-appslist)
* [`heroku apps:lock`](#heroku-appslock)
* [`heroku apps:open [PATH]`](#heroku-appsopen-path)
* [`heroku apps:rename NEWNAME`](#heroku-appsrename-newname)
* [`heroku apps:stacks`](#heroku-appsstacks)
* [`heroku apps:stacks:set STACK`](#heroku-appsstacksset-stack)
* [`heroku apps:transfer RECIPIENT`](#heroku-appstransfer-recipient)
* [`heroku apps:unlock`](#heroku-appsunlock)

## `heroku apps`

list your apps

```
USAGE
  $ heroku apps [-A] [-j] [-s <value>] [-p] [-t <value>]

FLAGS
  -A, --all            include apps in all teams
  -j, --json           output in json format
  -p, --personal       list apps in personal account when a default team is set
  -s, --space=<value>  filter by space
  -t, --team=<value>   team to use

DESCRIPTION
  list your apps

ALIASES
  $ heroku list
  $ heroku apps:list

EXAMPLES
  $ heroku apps
```

_See code: [src/commands/apps/index.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/index.ts)_

## `heroku apps:create [APPS]`

creates a new app

```
USAGE
  $ heroku apps:create [APPS] [--addons <value>] [-b <value>] [-n] [-r <value>] [-s <value>] [--space <value>]
    [--region <value>] [--json] [-t <value>]

ARGUMENTS
  APPS  name of app to create

FLAGS
  -b, --buildpack=<value>  buildpack url to use for this app
  -n, --no-remote          do not create a git remote
  -r, --remote=<value>     [default: heroku] the git remote to create, default "heroku"
  -s, --stack=<value>      the stack to create the app on
  -t, --team=<value>       team to use
  --addons=<value>         comma-delimited list of addons to install
  --json                   output in json format
  --region=<value>         specify region for the app to run in
  --space=<value>          the private space to create the app in

DESCRIPTION
  creates a new app

ALIASES
  $ heroku create

EXAMPLES
  $ heroku apps:create
  Creating app... done, stack is heroku-22
  https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git
  # or just
  $ heroku create
  # use a heroku.yml manifest file
  $ heroku apps:create --manifest
  # specify a buildpack
  $ heroku apps:create --buildpack https://github.com/some/buildpack.git
  # specify a name
  $ heroku apps:create example
  # create a staging app
  $ heroku apps:create example-staging --remote staging
  # create an app in the eu region
  $ heroku apps:create --region eu
```

_See code: [src/commands/apps/create.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/create.ts)_

## `heroku apps:delete`

permanently destroy an app

```
USAGE
  $ heroku apps:delete [APP] [-a <value>] [-c <value>]

FLAGS
  -a, --app=<value>      app to run command against
  -c, --confirm=<value>

DESCRIPTION
  permanently destroy an app

ALIASES
  $ heroku destroy
  $ heroku apps:delete
```

## `heroku apps:destroy`

permanently destroy an app

```
USAGE
  $ heroku apps:destroy [APP] [-a <value>] [-c <value>]

FLAGS
  -a, --app=<value>      app to run command against
  -c, --confirm=<value>

DESCRIPTION
  permanently destroy an app

ALIASES
  $ heroku destroy
  $ heroku apps:delete
```

_See code: [src/commands/apps/destroy.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/destroy.ts)_

## `heroku apps:errors`

view app errors

```
USAGE
  $ heroku apps:errors -a <value> [--json] [--hours <value>] [--router] [--dyno]

FLAGS
  -a, --app=<value>  (required) app to run command against
  --dyno             show only dyno errors
  --hours=<value>    [default: 24] number of hours to look back (default 24)
  --json             output in json format
  --router           show only router errors

DESCRIPTION
  view app errors
```

_See code: [src/commands/apps/errors.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/errors.ts)_

## `heroku apps:favorites`

list favorited apps

```
USAGE
  $ heroku apps:favorites [-j]

FLAGS
  -j, --json  output in json format

DESCRIPTION
  list favorited apps
```

_See code: [src/commands/apps/favorites/index.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/favorites/index.ts)_

## `heroku apps:favorites:add`

favorites an app

```
USAGE
  $ heroku apps:favorites:add -a <value>

FLAGS
  -a, --app=<value>  (required) app to run command against

DESCRIPTION
  favorites an app
```

_See code: [src/commands/apps/favorites/add.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/favorites/add.ts)_

## `heroku apps:favorites:remove`

unfavorites an app

```
USAGE
  $ heroku apps:favorites:remove -a <value>

FLAGS
  -a, --app=<value>  (required) app to run command against

DESCRIPTION
  unfavorites an app
```

_See code: [src/commands/apps/favorites/remove.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/favorites/remove.ts)_

## `heroku apps:info`

show detailed app information

```
USAGE
  $ heroku apps:info [APP] [-a <value>] [-s] [-j]

FLAGS
  -a, --app=<value>  app to run command against
  -j, --json         output in json format
  -s, --shell        output more shell friendly key/value pairs

DESCRIPTION
  show detailed app information

ALIASES
  $ heroku info

EXAMPLES
  $ heroku apps:info

  $ heroku apps:info --shell
```

_See code: [src/commands/apps/info.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/info.ts)_

## `heroku apps:join`

add yourself to a team app

```
USAGE
  $ heroku apps:join -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  add yourself to a team app
```

## `heroku apps:leave`

remove yourself from a team app

```
USAGE
  $ heroku apps:leave -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove yourself from a team app
```

## `heroku apps:list`

list your apps

```
USAGE
  $ heroku apps:list [-A] [-j] [-s <value>] [-p] [-t <value>]

FLAGS
  -A, --all            include apps in all teams
  -j, --json           output in json format
  -p, --personal       list apps in personal account when a default team is set
  -s, --space=<value>  filter by space
  -t, --team=<value>   team to use

DESCRIPTION
  list your apps

ALIASES
  $ heroku list
  $ heroku apps:list

EXAMPLES
  $ heroku apps
```

## `heroku apps:lock`

prevent team members from joining an app

```
USAGE
  $ heroku apps:lock -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  prevent team members from joining an app
```

## `heroku apps:open [PATH]`

open the app in a web browser

```
USAGE
  $ heroku apps:open [PATH] -a <value>

FLAGS
  -a, --app=<value>  (required) app to run command against

DESCRIPTION
  open the app in a web browser

ALIASES
  $ heroku open

EXAMPLES
  $ heroku open -a myapp

  $ heroku open -a myapp /foo
```

_See code: [src/commands/apps/open.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/open.ts)_

## `heroku apps:rename NEWNAME`

rename an app

```
USAGE
  $ heroku apps:rename NEWNAME -a <value>

FLAGS
  -a, --app=<value>  (required) app to run command against

DESCRIPTION
  rename an app

ALIASES
  $ heroku rename

EXAMPLES
  $ heroku apps:rename --app oldname newname
```

_See code: [src/commands/apps/rename.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/rename.ts)_

## `heroku apps:stacks`

show the list of available stacks

```
USAGE
  $ heroku apps:stacks -a <value>

FLAGS
  -a, --app=<value>  (required) app to run command against

DESCRIPTION
  show the list of available stacks

ALIASES
  $ heroku stack
```

_See code: [src/commands/apps/stacks/index.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/stacks/index.ts)_

## `heroku apps:stacks:set STACK`

set the stack of an app

```
USAGE
  $ heroku apps:stacks:set STACK -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  set the stack of an app

ALIASES
  $ heroku stack:set

EXAMPLES
  $ heroku stack:set heroku-22 -a myapp
  Setting stack to heroku-22... done
  You will need to redeploy myapp for the change to take effect.
  Run git push heroku main to trigger a new build on myapp.
```

_See code: [src/commands/apps/stacks/set.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/apps/stacks/set.ts)_

## `heroku apps:transfer RECIPIENT`

transfer applications to another user or team

```
USAGE
  $ heroku apps:transfer RECIPIENT [-l] [--bulk] [-a <value>] [-r <value>]

ARGUMENTS
  RECIPIENT  user or team to transfer applications to

FLAGS
  -a, --app=<value>     app to run command against
  -l, --locked          lock the app upon transfer
  -r, --remote=<value>  git remote of app to use
  --bulk                transfer applications in bulk

DESCRIPTION
  transfer applications to another user or team


EXAMPLES
  $ heroku apps:transfer collaborator@example.com
  Transferring example to collaborator@example.com... done
  $ heroku apps:transfer acme-widgets
  Transferring example to acme-widgets... done
  $ heroku apps:transfer --bulk acme-widgets
  ...
```

## `heroku apps:unlock`

unlock an app so any team member can join

```
USAGE
  $ heroku apps:unlock -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  unlock an app so any team member can join
```
