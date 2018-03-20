heroku releases
===============

manage app releases
# Commands

* [heroku releases [OPTIONS]](#releases)
* [heroku releases:info [RELEASE] [OPTIONS]](#releasesinfo)
* [heroku releases:output [RELEASE] [OPTIONS]](#releasesoutput)
* [heroku releases:rollback [RELEASE] [OPTIONS]](#releasesrollback)
## releases

display the releases for an app

```
USAGE
  $ heroku releases [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -n, --num=num        number of releases to show
  -r, --remote=remote  git remote of app to use
  --json               output releases in json format

DESCRIPTION

  Example:

       $ heroku releases
       === example Releases
       v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
       v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
       v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)
```

### releases:info

view detailed information for a release

```
USAGE
  $ heroku releases:info [RELEASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output in shell format
  --json               output in json format
```

### releases:output

View the release command output

```
USAGE
  $ heroku releases:output [RELEASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
```

### releases:rollback

rollback to a previous release

```
USAGE
  $ heroku releases:rollback [RELEASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  If RELEASE is not specified, it will rollback one release
```
