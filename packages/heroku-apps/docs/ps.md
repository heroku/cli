heroku ps
=========

list dynos for an app

Examples:

    $ heroku ps
    === run: one-off dyno
    run.1: up for 5m: bash
    
    === web: bundle exec thin start -p $PORT
    web.1: created for 30s
    
    $ heroku ps run # specifying types
    === run: one-off dyno
    run.1: up for 5m: bash
* [heroku ps [TYPE [TYPE ...]]](#heroku-ps-type-type)
* [heroku ps:kill DYNO](#heroku-pskill-dyno)
* [heroku ps:resize](#heroku-psresize)
* [heroku ps:restart [DYNO]](#heroku-psrestart-dyno)
* [heroku ps:scale](#heroku-psscale)
* [heroku ps:stop DYNO](#heroku-psstop-dyno)
* [heroku ps:type](#heroku-pstype)

## heroku ps [TYPE [TYPE ...]]

list dynos for an app

```
USAGE
  $ heroku ps [TYPE [TYPE ...]]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               display as json

DESCRIPTION

  Examples:

       $ heroku ps
       === run: one-off dyno
       run.1: up for 5m: bash
    
       === web: bundle exec thin start -p $PORT
       web.1: created for 30s
    
       $ heroku ps run # specifying types
       === run: one-off dyno
       run.1: up for 5m: bash
```

### heroku ps:kill DYNO

stop app dyno

```
USAGE
  $ heroku ps:kill DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  stop app dyno or dyno type

  Examples:

       $ heroku ps:stop run.1828
       Stopping run.1828 dyno... done

       $ heroku ps:stop run
       Stopping run dynos... done
```

### heroku ps:resize

manage dyno sizes

```
USAGE
  $ heroku ps:resize

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

### heroku ps:restart [DYNO]

restart app dynos

```
USAGE
  $ heroku ps:restart [DYNO]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  if DYNO is not specified, restarts all dynos on app

  Examples:

       $ heroku ps:restart web.1
       Restarting web.1 dyno... done

       $ heroku ps:restart web
       Restarting web dynos... done

       $ heroku ps:restart
       Restarting dynos... done
```

### heroku ps:scale

scale dyno quantity up or down

```
USAGE
  $ heroku ps:scale

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

  Omitting any arguments will display the app's current dyno formation, in a
  format suitable for passing back into ps:scale.

  Examples:

       $ heroku ps:scale web=3:Standard-2X worker+1
       Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.

       $ heroku ps:scale
       web=3:Standard-2X worker=1:Standard-1X
```

### heroku ps:stop DYNO

stop app dyno

```
USAGE
  $ heroku ps:stop DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  stop app dyno or dyno type

  Examples:

       $ heroku ps:stop run.1828
       Stopping run.1828 dyno... done

       $ heroku ps:stop run
       Stopping run dynos... done
```

### heroku ps:type

manage dyno sizes

```
USAGE
  $ heroku ps:type

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

## heroku ps:kill DYNO

stop app dyno

```
USAGE
  $ heroku ps:kill DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  stop app dyno or dyno type

  Examples:

       $ heroku ps:stop run.1828
       Stopping run.1828 dyno... done

       $ heroku ps:stop run
       Stopping run dynos... done
```

## heroku ps:resize

manage dyno sizes

```
USAGE
  $ heroku ps:resize

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

## heroku ps:restart [DYNO]

restart app dynos

```
USAGE
  $ heroku ps:restart [DYNO]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  if DYNO is not specified, restarts all dynos on app

  Examples:

       $ heroku ps:restart web.1
       Restarting web.1 dyno... done

       $ heroku ps:restart web
       Restarting web dynos... done

       $ heroku ps:restart
       Restarting dynos... done
```

## heroku ps:scale

scale dyno quantity up or down

```
USAGE
  $ heroku ps:scale

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

  Omitting any arguments will display the app's current dyno formation, in a
  format suitable for passing back into ps:scale.

  Examples:

       $ heroku ps:scale web=3:Standard-2X worker+1
       Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.

       $ heroku ps:scale
       web=3:Standard-2X worker=1:Standard-1X
```

## heroku ps:stop DYNO

stop app dyno

```
USAGE
  $ heroku ps:stop DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  stop app dyno or dyno type

  Examples:

       $ heroku ps:stop run.1828
       Stopping run.1828 dyno... done

       $ heroku ps:stop run
       Stopping run dynos... done
```

## heroku ps:type

manage dyno sizes

```
USAGE
  $ heroku ps:type

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```
