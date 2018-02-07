heroku apps
===========

Heroku CLI plugin to manage apps.
# Commands

* [heroku apps [OPTIONS]](#apps)
* [heroku apps:create [APP] [OPTIONS]](#appscreate)
* [heroku apps:destroy [OPTIONS]](#appsdestroy)
* [heroku apps:errors [OPTIONS]](#appserrors)
* [heroku apps:favorites [OPTIONS]](#appsfavorites)
* [heroku apps:favorites:add [OPTIONS]](#appsfavoritesadd)
* [heroku apps:favorites:remove [OPTIONS]](#appsfavoritesremove)
* [heroku apps:info [OPTIONS]](#appsinfo)
* [heroku apps:open [PATH] [OPTIONS]](#appsopen)
* [heroku apps:rename NEWNAME [OPTIONS]](#appsrename)
* [heroku apps:stacks [OPTIONS]](#appsstacks)
* [heroku apps:stacks:set STACK [OPTIONS]](#appsstacksset)
## apps

list your apps

```
USAGE
  $ heroku apps [OPTIONS]

OPTIONS
  -A, --all          include apps in all teams
  -p, --personal     list apps in personal account when a default team is set
  -s, --space=space  filter by space
  -t, --team=team    team to use
  --json             output in json format

DESCRIPTION

  Example:

       $ heroku apps
       === My Apps
       example
       example2

       === Collaborated Apps
       theirapp   other@owner.name
```

### apps:create

creates a new app

```
USAGE
  $ heroku apps:create [APP] [OPTIONS]

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

DESCRIPTION
  Examples:

       $ heroku apps:create
       Creating app... done, stack is cedar-14
       https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git

       # or just
       $ heroku create

       # specify a buildpack
       $ heroku apps:create --buildpack https://github.com/some/buildpack.git

       # specify a name
       $ heroku apps:create example

       # create a staging app
       $ heroku apps:create example-staging --remote staging

       # create an app in the eu region
       $ heroku apps:create --region eu
```

### apps:destroy

permanently destroy an app

```
USAGE
  $ heroku apps:destroy [OPTIONS]

OPTIONS
  -a, --app=app          app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  This will also destroy all add-ons on the app.
```

### apps:errors

view app errors

```
USAGE
  $ heroku apps:errors [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --dyno               show only dyno errors
  --hours=hours        number of hours to look back (default 24)
  --json               output in json format
  --router             show only router errors
```

### apps:favorites

list favorited apps

```
USAGE
  $ heroku apps:favorites [OPTIONS]

OPTIONS
  --json  output in json format
```

#### apps:favorites:add

favorites an app

```
USAGE
  $ heroku apps:favorites:add [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### apps:favorites:remove

unfavorites an app

```
USAGE
  $ heroku apps:favorites:remove [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### apps:favorites:add

favorites an app

```
USAGE
  $ heroku apps:favorites:add [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### apps:favorites:remove

unfavorites an app

```
USAGE
  $ heroku apps:favorites:remove [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### apps:info

show detailed app information

```
USAGE
  $ heroku apps:info [OPTIONS]

OPTIONS
  -a, --app=app        app to run command against
  -j, --json
  -r, --remote=remote  git remote of app to use
  -s, --shell          output more shell friendly key/value pairs

DESCRIPTION
  Examples:

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

### apps:open

open the app in a web browser

```
USAGE
  $ heroku apps:open [PATH] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Examples:

       $ heroku open -a myapp
       # opens https://myapp.herokuapp.com

       $ heroku open -a myapp /foo
       # opens https://myapp.herokuapp.com/foo
```

### apps:rename

rename an app

```
USAGE
  $ heroku apps:rename NEWNAME [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --ssh-git            use ssh git protocol instead of https

DESCRIPTION

  This will locally update the git remote if it is set to the old app.

  Example:

       $ heroku apps:rename --app oldname newname
       https://newname.herokuapp.com/ | https://git.heroku.com/newname.git
       Git remote heroku updated
```

### apps:stacks

show the list of available stacks

```
USAGE
  $ heroku apps:stacks [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### apps:stacks:set

set the stack of an app

```
USAGE
  $ heroku apps:stacks:set STACK [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Example:

       $ heroku stack:set cedar-14 -a myapp
       Stack set. Next release on myapp will use cedar-14.
       Run git push heroku master to create a new release on myapp.
```

### apps:stacks:set

set the stack of an app

```
USAGE
  $ heroku apps:stacks:set STACK [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Example:

       $ heroku stack:set cedar-14 -a myapp
       Stack set. Next release on myapp will use cedar-14.
       Run git push heroku master to create a new release on myapp.
```
