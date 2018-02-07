heroku ps
=========

manage dynos (dynos, workers)
# Commands

* [heroku ps [TYPE [TYPE ...]]](#ps)
* [heroku ps:copy FILE [OPTIONS]](#pscopy)
* [heroku ps:exec [OPTIONS]](#psexec)
* [heroku ps:forward PORT [OPTIONS]](#psforward)
* [heroku ps:kill DYNO [OPTIONS]](#pskill)
* [heroku ps:resize [OPTIONS]](#psresize)
* [heroku ps:restart [DYNO] [OPTIONS]](#psrestart)
* [heroku ps:scale [OPTIONS]](#psscale)
* [heroku ps:socks [OPTIONS]](#pssocks)
* [heroku ps:stop DYNO [OPTIONS]](#psstop)
* [heroku ps:type [OPTIONS]](#pstype)
* [heroku psql [DATABASE] [OPTIONS]](#psql)
## ps

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

### ps:copy

Copy a file from a dyno to the local filesystem

```
USAGE
  $ heroku ps:copy FILE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -d, --dyno=dyno      specify the dyno to connect to
  -o, --output=output  the name of the output file
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       $ heroku ps:copy FILENAME --app murmuring-headland-14719
```

### ps:exec

Create an SSH session to a dyno

```
USAGE
  $ heroku ps:exec [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -d, --dyno=dyno      specify the dyno to connect to
  -r, --remote=remote  git remote of app to use
  --ssh                use native ssh
  --status             lists the status of the SSH server in the dyno

DESCRIPTION
  Example:

       $ heroku ps:exec 'node -i' --app murmuring-headland-14719
```

### ps:forward

Forward traffic on a local port to a dyno

```
USAGE
  $ heroku ps:forward PORT [OPTIONS]

OPTIONS
  -a, --app=app              (required) app to run command against
  -d, --dyno=dyno            specify the dyno to connect to
  -p, --localPort=localPort  the local port to use
  -r, --remote=remote        git remote of app to use

DESCRIPTION
  Example:

       $ heroku ps:forward 8080 --app murmuring-headland-14719
```

### ps:kill

stop app dyno

```
USAGE
  $ heroku ps:kill DYNO [OPTIONS]

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

### ps:resize

manage dyno sizes

```
USAGE
  $ heroku ps:resize [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
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

### ps:scale

scale dyno quantity up or down

```
USAGE
  $ heroku ps:scale [OPTIONS]

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

### ps:socks

Launch a SOCKS proxy into a dyno

```
USAGE
  $ heroku ps:socks [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -d, --dyno=dyno      specify the dyno to connect to
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       $ heroku ps:socks --app murmuring-headland-14719
       Establishing credentials... done
       SOCKSv5 proxy server started on port 1080
       Use CTRL+C to stop the proxy
```

### ps:stop

stop app dyno

```
USAGE
  $ heroku ps:stop DYNO [OPTIONS]

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

### ps:type

manage dyno sizes

```
USAGE
  $ heroku ps:type [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

### psql

open a psql shell to the database

```
USAGE
  $ heroku psql [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app            (required) app to run command against
  -c, --command=command    SQL command to run
  -r, --remote=remote      git remote of app to use
  --credential=credential  credential to use
```

## psql

open a psql shell to the database

```
USAGE
  $ heroku psql [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app            (required) app to run command against
  -c, --command=command    SQL command to run
  -r, --remote=remote      git remote of app to use
  --credential=credential  credential to use
```
