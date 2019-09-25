`heroku apps`
=============

manage apps on Heroku

* [`heroku apps`](#heroku-apps)
* [`heroku apps:create [APP]`](#heroku-appscreate-app)
* [`heroku apps:destroy`](#heroku-appsdestroy)
* [`heroku apps:errors`](#heroku-appserrors)
* [`heroku apps:favorites`](#heroku-appsfavorites)
* [`heroku apps:favorites:add`](#heroku-appsfavoritesadd)
* [`heroku apps:favorites:remove`](#heroku-appsfavoritesremove)
* [`heroku apps:info`](#heroku-appsinfo)
* [`heroku apps:join`](#heroku-appsjoin)
* [`heroku apps:leave`](#heroku-appsleave)
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
  $ heroku apps

OPTIONS
  -A, --all          include apps in all teams
  -p, --personal     list apps in personal account when a default team is set
  -s, --space=space  filter by space
  -t, --team=team    team to use
  --json             output in json format

EXAMPLES
  $ heroku apps
  === My Apps
  example
  example2

  === Collaborated Apps
  theirapp   other@owner.name
```

## `heroku apps:create [APP]`

creates a new app

```
USAGE
  $ heroku apps:create [APP]

ARGUMENTS
  APP  name of app to create

OPTIONS
  -b, --buildpack=buildpack  buildpack url to use for this app
  -n, --no-remote            do not create a git remote
  -r, --remote=remote        the git remote to create, default "heroku"
  -s, --stack=stack          the stack to create the app on
  -t, --team=team            team to use
  --addons=addons            comma-delimited list of addons to install
  --json                     output in json format
  --region=region            specify region for the app to run in
  --space=space              the private space to create the app in
  --ssh-git                  use SSH git protocol for local git remote

EXAMPLES
  $ heroku apps:create
  Creating app... done, stack is heroku-18
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

## `heroku apps:destroy`

permanently destroy an app

```
USAGE
  $ heroku apps:destroy

OPTIONS
  -a, --app=app          app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  This will also destroy all add-ons on the app.
```

## `heroku apps:errors`

view app errors

```
USAGE
  $ heroku apps:errors

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --dyno               show only dyno errors
  --hours=hours        number of hours to look back (default 24)
  --json               output in json format
  --router             show only router errors
```

## `heroku apps:favorites`

list favorited apps

```
USAGE
  $ heroku apps:favorites

OPTIONS
  --json  output in json format
```

## `heroku apps:favorites:add`

favorites an app

```
USAGE
  $ heroku apps:favorites:add

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:favorites:remove`

unfavorites an app

```
USAGE
  $ heroku apps:favorites:remove

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:info`

show detailed app information

```
USAGE
  $ heroku apps:info

OPTIONS
  -a, --app=app        app to run command against
  -j, --json
  -r, --remote=remote  git remote of app to use
  -s, --shell          output more shell friendly key/value pairs

DESCRIPTION
  $ heroku apps:info
  === example
  Git URL:   https://git.heroku.com/example.git
  Repo Size: 5M
  ...

  $ heroku apps:info --shell
  git_url=https://git.heroku.com/example.git
  repo_size=5000000
  ...
```

## `heroku apps:join`

add yourself to a team app

```
USAGE
  $ heroku apps:join

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:leave`

remove yourself from a team app

```
USAGE
  $ heroku apps:leave

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:lock`

prevent team members from joining an app

```
USAGE
  $ heroku apps:lock

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:open [PATH]`

open the app in a web browser

```
USAGE
  $ heroku apps:open [PATH]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku open -a myapp
  # opens https://myapp.herokuapp.com

  $ heroku open -a myapp /foo
  # opens https://myapp.herokuapp.com/foo
```

## `heroku apps:rename NEWNAME`

rename an app

```
USAGE
  $ heroku apps:rename NEWNAME

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --ssh-git            use ssh git protocol instead of https

DESCRIPTION
  This will locally update the git remote if it is set to the old app.

EXAMPLES
  $ heroku apps:rename --app oldname newname
  https://newname.herokuapp.com/ | https://git.heroku.com/newname.git
  Git remote heroku updated
```

## `heroku apps:stacks`

show the list of available stacks

```
USAGE
  $ heroku apps:stacks

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:stacks:set STACK`

set the stack of an app

```
USAGE
  $ heroku apps:stacks:set STACK

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku stack:set heroku-18 -a myapp
  Stack set. Next release on myapp will use heroku-18.
  Run git push heroku master to create a new release on myapp.
```

## `heroku apps:transfer RECIPIENT`

transfer applications to another user or team

```
USAGE
  $ heroku apps:transfer RECIPIENT

ARGUMENTS
  RECIPIENT  user or team to transfer applications to

OPTIONS
  -a, --app=app        app to run command against
  -l, --locked         lock the app upon transfer
  -r, --remote=remote  git remote of app to use
  --bulk               transfer applications in bulk

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
  $ heroku apps:unlock

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```
