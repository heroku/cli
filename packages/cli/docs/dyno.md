`heroku dyno`
=============

stop app dyno

stop app dyno or dyno type

* [`heroku dyno:kill DYNO`](#heroku-dynokill-dyno)
* [`heroku dyno:resize`](#heroku-dynoresize)
* [`heroku dyno:restart [DYNO]`](#heroku-dynorestart-dyno)
* [`heroku dyno:scale`](#heroku-dynoscale)
* [`heroku dyno:stop DYNO`](#heroku-dynostop-dyno)

## `heroku dyno:kill DYNO`

stop app dyno

```
USAGE
  $ heroku dyno:kill DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  stop app dyno or dyno type

EXAMPLES
  $ heroku ps:stop run.1828
  Stopping run.1828 dyno... done

  $ heroku ps:stop run
  Stopping run dynos... done
```

## `heroku dyno:resize`

manage dyno sizes

```
USAGE
  $ heroku dyno:resize

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

## `heroku dyno:restart [DYNO]`

restart app dynos

```
USAGE
  $ heroku dyno:restart [DYNO]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  if DYNO is not specified, restarts all dynos on app

EXAMPLES
  $ heroku ps:restart web.1
  Restarting web.1 dyno... done

  $ heroku ps:restart web
  Restarting web dynos... done

  $ heroku ps:restart
  Restarting dynos... done
```

## `heroku dyno:scale`

scale dyno quantity up or down

```
USAGE
  $ heroku dyno:scale

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

  Omitting any arguments will display the app's current dyno formation, in a
  format suitable for passing back into ps:scale.

EXAMPLES
  $ heroku ps:scale web=3:Standard-2X worker+1
  Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.

  $ heroku ps:scale
  web=3:Standard-2X worker=1:Standard-1X
```

## `heroku dyno:stop DYNO`

stop app dyno

```
USAGE
  $ heroku dyno:stop DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  stop app dyno or dyno type

EXAMPLES
  $ heroku ps:stop run.1828
  Stopping run.1828 dyno... done

  $ heroku ps:stop run
  Stopping run dynos... done
```
