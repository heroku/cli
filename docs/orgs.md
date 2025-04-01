`heroku orgs`
=============

manage organizations

* [`heroku orgs`](#heroku-orgs)
* [`heroku orgs:open`](#heroku-orgsopen)

## `heroku orgs`

list the teams that you are a member of

```
USAGE
  $ heroku orgs [--json] [--enterprise]

FLAGS
  --enterprise  filter by enterprise teams
  --json        output in json format

DESCRIPTION
  list the teams that you are a member of
```

_See code: [src/commands/orgs/index.ts](https://github.com/heroku/cli/blob/v10.4.1-beta.0/packages/cli/src/commands/orgs/index.ts)_

## `heroku orgs:open`

open the team interface in a browser window

```
USAGE
  $ heroku orgs:open -t <value>

FLAGS
  -t, --team=<value>  (required) team to use

DESCRIPTION
  open the team interface in a browser window
```

_See code: [src/commands/orgs/open.ts](https://github.com/heroku/cli/blob/v10.4.1-beta.0/packages/cli/src/commands/orgs/open.ts)_
