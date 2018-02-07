heroku logs
===========

display recent log output
# Commands

* [heroku logs [OPTIONS]](#logs)
## logs

display recent log output

```
USAGE
  $ heroku logs [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -d, --dyno=dyno      dyno to limit filter by
  -n, --num=num        number of lines to display
  -r, --remote=remote  git remote of app to use
  -s, --source=source  log source to limit filter by
  -t, --tail           continually stream logs
  --force-colors       force use of colors (even on non-tty output)

DESCRIPTION
  Example:

       $ heroku logs
       2012-01-01T12:00:00+00:00 heroku[api]: Config add EXAMPLE by email@example.com
       2012-01-01T12:00:01+00:00 heroku[api]: Release v1 created by email@example.com
```
