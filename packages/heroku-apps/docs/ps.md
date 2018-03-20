heroku ps
=========

manage dynos (dynos, workers)
# Commands

* [heroku ps [TYPE [TYPE ...]]](#ps)
* [heroku ps:kill DYNO [OPTIONS]](#pskill)
* [heroku ps:resize [OPTIONS]](#psresize)
* [heroku ps:restart [DYNO] [OPTIONS]](#psrestart)
* [heroku ps:scale [OPTIONS]](#psscale)
* [heroku ps:stop DYNO [OPTIONS]](#psstop)
* [heroku ps:type [OPTIONS]](#pstype)
## ps

list dynos for an app

```
USAGE
  $ heroku ps [TYPE [TYPE ...]]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
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

### ps:kill

stop app dyno

```
USAGE
  $ heroku ps:kill DYNO [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  stop app dyno or dyno type

  Examples:

       $ heroku ps:stop run.1828
       Stopping run.1828 dyno... done

       $ heroku ps:stop run
       Stopping run dynos... done
```

### ps:resize

manage dyno sizes

```
USAGE
  $ heroku ps:resize [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

### ps:restart

restart app dynos

```
USAGE
  $ heroku ps:restart [DYNO] [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
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

### ps:scale

scale dyno quantity up or down

```
USAGE
  $ heroku ps:scale [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
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

### ps:stop

stop app dyno

```
USAGE
  $ heroku ps:stop DYNO [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  stop app dyno or dyno type

  Examples:

       $ heroku ps:stop run.1828
       Stopping run.1828 dyno... done

       $ heroku ps:stop run
       Stopping run dynos... done
```

### ps:type

manage dyno sizes

```
USAGE
  $ heroku ps:type [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```
