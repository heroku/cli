`heroku ps`
===========

Client tools for Heroku Exec

* [`heroku ps:copy FILE`](#heroku-pscopy-file)
* [`heroku ps:exec`](#heroku-psexec)
* [`heroku ps:forward PORT`](#heroku-psforward-port)
* [`heroku ps:socks`](#heroku-pssocks)

## `heroku ps:copy FILE`

Copy a file from a dyno to the local filesystem

```
USAGE
  $ heroku ps:copy FILE -a <value> [-d <value>] [-o <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -o, --output=<value>  the name of the output file
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Copy a file from a dyno to the local filesystem
  Example:

  $ heroku ps:copy FILENAME --app murmuring-headland-14719
```

## `heroku ps:exec`

Create an SSH session to a dyno

```
USAGE
  $ heroku ps:exec -a <value> [-d <value>] [--ssh] [--status] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -r, --remote=<value>  git remote of app to use
      --ssh             use native ssh
      --status          lists the status of the SSH server in the dyno

DESCRIPTION
  Create an SSH session to a dyno
  Example:

  $ heroku ps:exec 'node -i' --app murmuring-headland-14719
```

## `heroku ps:forward PORT`

Forward traffic on a local port to a dyno

```
USAGE
  $ heroku ps:forward PORT -a <value> [-d <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Forward traffic on a local port to a dyno
  Provide a port or comma-separated list of ports to forward.

  For example, "4000,9000:9001" will forward port 4000 to port 4000 and
  port 9000 to port 9001.

  Example:

  $ heroku ps:forward 8080 --app murmuring-headland-14719
```

## `heroku ps:socks`

Launch a SOCKS proxy into a dyno

```
USAGE
  $ heroku ps:socks -a <value> [-d <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Launch a SOCKS proxy into a dyno
  Example:

  $ heroku ps:socks --app murmuring-headland-14719
  Establishing credentials... done
  SOCKSv5 proxy server started on port 1080
  Use CTRL+C to stop the proxy
```
