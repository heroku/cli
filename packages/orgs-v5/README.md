Heroku Orgs CLI [![CircleCI](https://circleci.com/gh/heroku/heroku-orgs/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-orgs/tree/master)
===========
[![Code Climate](https://codeclimate.com/github/heroku/heroku-orgs/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-orgs)
[![npm version](https://badge.fury.io/js/heroku-orgs.svg)](https://badge.fury.io/js/heroku-orgs)
[![License](https://img.shields.io/github/license/heroku/heroku-orgs.svg)](https://github.com/heroku/heroku-orgs/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

### Available commands

https://github.com/heroku/heroku-orgs/blob/master/index.js.

### Development

First, please read [Developing CLI Plugins on Heroku's DevCenter](https://devcenter.heroku.com/articles/developing-toolbelt-plug-ins).

#### Run Tests

```
$ npm test
```

#### Deploy

1. Release a new version of this npm package.

  ```
  $ npm version patch/minor/major
  ```

2. Open a new pr in https://github.com/heroku/cli/blob/master/package.json, updating to the appropriate heroku-orgs version.

#### Commands

<!-- commands -->
* [`heroku access`](#heroku-access)
* [`heroku access:add EMAIL`](#heroku-accessadd-email)
* [`heroku access:remove EMAIL`](#heroku-accessremove-email)
* [`heroku access:update EMAIL`](#heroku-accessupdate-email)
* [`heroku apps:join`](#heroku-appsjoin)
* [`heroku apps:leave`](#heroku-appsleave)
* [`heroku apps:lock`](#heroku-appslock)
* [`heroku apps:transfer RECIPIENT`](#heroku-appstransfer-recipient)
* [`heroku apps:unlock`](#heroku-appsunlock)
* [`heroku join`](#heroku-join)
* [`heroku leave`](#heroku-leave)
* [`heroku lock`](#heroku-lock)
* [`heroku members`](#heroku-members)
* [`heroku members:add EMAIL`](#heroku-membersadd-email)
* [`heroku members:remove EMAIL`](#heroku-membersremove-email)
* [`heroku members:set EMAIL`](#heroku-membersset-email)
* [`heroku orgs`](#heroku-orgs)
* [`heroku orgs:open`](#heroku-orgsopen)
* [`heroku teams`](#heroku-teams)
* [`heroku unlock`](#heroku-unlock)

## `heroku access`

list who has access to an app

```
USAGE
  $ heroku access -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  list who has access to an app
```

## `heroku access:add EMAIL`

add new users to your app

```
USAGE
  $ heroku access:add EMAIL -a <value> [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>          (required) app to run command against
  -p, --permissions=<value>  list of permissions comma separated
  -r, --remote=<value>       git remote of app to use

DESCRIPTION
  add new users to your app


EXAMPLES
  $ heroku access:add user@email.com --app APP # add a collaborator to your app

  $ heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma separated
```

## `heroku access:remove EMAIL`

remove users from a team app

```
USAGE
  $ heroku access:remove EMAIL -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove users from a team app


EXAMPLES
  $ heroku access:remove user@email.com --app APP
```

## `heroku access:update EMAIL`

update existing collaborators on an team app

```
USAGE
  $ heroku access:update EMAIL -a <value> [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>          (required) app to run command against
  -p, --permissions=<value>  comma-delimited list of permissions to update (deploy,manage,operate)
  -r, --remote=<value>       git remote of app to use

DESCRIPTION
  update existing collaborators on an team app


EXAMPLES
  $ heroku access:update user@email.com --app APP --permissions deploy,manage,operate
```

## `heroku apps:join`

add yourself to a team app

```
USAGE
  $ heroku apps:join -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  add yourself to a team app
```

## `heroku apps:leave`

remove yourself from a team app

```
USAGE
  $ heroku apps:leave -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove yourself from a team app
```

## `heroku apps:lock`

prevent team members from joining an app

```
USAGE
  $ heroku apps:lock -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  prevent team members from joining an app
```

## `heroku apps:transfer RECIPIENT`

transfer applications to another user or team

```
USAGE
  $ heroku apps:transfer RECIPIENT [-l] [--bulk] [-a <value>] [-r <value>]

ARGUMENTS
  RECIPIENT  user or team to transfer applications to

FLAGS
  -a, --app=<value>     app to run command against
  -l, --locked          lock the app upon transfer
  -r, --remote=<value>  git remote of app to use
  --bulk                transfer applications in bulk

DESCRIPTION
  transfer applications to another user or team


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
  $ heroku apps:unlock -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  unlock an app so any team member can join
```

## `heroku join`

add yourself to a team app

```
USAGE
  $ heroku join -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  add yourself to a team app
```

## `heroku leave`

remove yourself from a team app

```
USAGE
  $ heroku leave -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove yourself from a team app
```

## `heroku lock`

prevent team members from joining an app

```
USAGE
  $ heroku lock -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  prevent team members from joining an app
```

## `heroku members`

list members of a team

```
USAGE
  $ heroku members [-r <value>] [--pending] [--json] [-t <value>]

FLAGS
  -r, --role=<value>  filter by role
  -t, --team=<value>  team to use
  --json              output in json format
  --pending           filter by pending team invitations

DESCRIPTION
  list members of a team
```

## `heroku members:add EMAIL`

adds a user to a team

```
USAGE
  $ heroku members:add EMAIL -r <value> [-t <value>]

FLAGS
  -r, --role=<value>  (required) member role (admin, collaborator, member, owner)
  -t, --team=<value>  team to use

DESCRIPTION
  adds a user to a team
```

## `heroku members:remove EMAIL`

removes a user from a team

```
USAGE
  $ heroku members:remove EMAIL [-t <value>]

FLAGS
  -t, --team=<value>  team to use

DESCRIPTION
  removes a user from a team
```

## `heroku members:set EMAIL`

sets a members role in a team

```
USAGE
  $ heroku members:set EMAIL -r <value> [-t <value>]

FLAGS
  -r, --role=<value>  (required) member role (admin, collaborator, member, owner)
  -t, --team=<value>  team to use

DESCRIPTION
  sets a members role in a team
```

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

## `heroku orgs:open`

open the team interface in a browser window

```
USAGE
  $ heroku orgs:open [-t <value>]

FLAGS
  -t, --team=<value>  team to use

DESCRIPTION
  open the team interface in a browser window
```

## `heroku teams`

list the teams that you are a member of

```
USAGE
  $ heroku teams [--json]

FLAGS
  --json  output in json format

DESCRIPTION
  list the teams that you are a member of

  Use heroku members:* to manage team members.
```

## `heroku unlock`

unlock an app so any team member can join

```
USAGE
  $ heroku unlock -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  unlock an app so any team member can join
```
<!-- commandsstop -->
