Heroku Orgs CLI [![CircleCI](https://circleci.com/gh/heroku/heroku-orgs/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-orgs/tree/master)
===========
[![Code Climate](https://codeclimate.com/github/heroku/heroku-orgs/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-orgs)
[![codecov](https://codecov.io/gh/heroku/heroku-orgs/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-orgs)
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
  $ heroku access

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

## `heroku access:add EMAIL`

add new users to your app

```
USAGE
  $ heroku access:add EMAIL

OPTIONS
  -a, --app=app                  (required) app to run command against
  -p, --permissions=permissions  list of permissions comma separated
  -r, --remote=remote            git remote of app to use

EXAMPLES
  $ heroku access:add user@email.com --app APP # add a collaborator to your app
  $ heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma separated
```

## `heroku access:remove EMAIL`

remove users from a team app

```
USAGE
  $ heroku access:remove EMAIL

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku access:remove user@email.com --app APP
```

## `heroku access:update EMAIL`

update existing collaborators on an team app

```
USAGE
  $ heroku access:update EMAIL

OPTIONS
  -a, --app=app                  (required) app to run command against
  -p, --permissions=permissions  comma-delimited list of permissions to update (deploy,manage,operate)
  -r, --remote=remote            git remote of app to use

EXAMPLES
  $ heroku access:update user@email.com --app APP --permissions deploy,manage,operate
```

## `heroku apps:join`

add yourself to an organization app

```
USAGE
  $ heroku apps:join

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:leave`

remove yourself from an organization app

```
USAGE
  $ heroku apps:leave

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:lock`

prevent organization members from joining an app

```
USAGE
  $ heroku apps:lock

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:transfer RECIPIENT`

transfer applications to another user or team

```
USAGE
  $ heroku apps:transfer RECIPIENT

ARGUMENTS
  RECIPIENT  user or team to transfer applications to

OPTIONS
  -a, --app=app        app to run command against
  -l, --locked         lock the app upon transfer
  -r, --remote=remote  git remote of app to use
  --bulk               transfer applications in bulk

EXAMPLES
  $ heroku apps:transfer collaborator@example.com
  Transferring example to collaborator@example.com... done

  $ heroku apps:transfer acme-widgets
  Transferring example to acme-widgets... done

  $ heroku apps:transfer --bulk acme-widgets
  ...
```

## `heroku apps:unlock`

unlock an app so any organization member can join

```
USAGE
  $ heroku apps:unlock

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku join`

add yourself to an organization app

```
USAGE
  $ heroku join

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku leave`

remove yourself from an organization app

```
USAGE
  $ heroku leave

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku lock`

prevent organization members from joining an app

```
USAGE
  $ heroku lock

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku members`

list members of an organization or a team

```
USAGE
  $ heroku members

OPTIONS
  -r, --role=role  filter by role
  -t, --team=team  team to use
  --json           output in json format
  --pending        filter by pending team invitations
```

## `heroku members:add EMAIL`

adds a user to an organization or a team

```
USAGE
  $ heroku members:add EMAIL

OPTIONS
  -r, --role=role  (required) member role (admin, collaborator, member, owner)
  -t, --team=team  team to use
```

## `heroku members:remove EMAIL`

removes a user from an organization or a team

```
USAGE
  $ heroku members:remove EMAIL

OPTIONS
  -t, --team=team  team to use
```

## `heroku members:set EMAIL`

sets a members role in an organization or a team

```
USAGE
  $ heroku members:set EMAIL

OPTIONS
  -r, --role=role  (required) member role (admin, collaborator, member, owner)
  -t, --team=team  team to use
```

## `heroku orgs`

list the organizations that you are a member of

```
USAGE
  $ heroku orgs

OPTIONS
  --enterprise  filter by enterprise orgs
  --json        output in json format
```

## `heroku orgs:open`

open the organization interface in a browser window

```
USAGE
  $ heroku orgs:open

OPTIONS
  -t, --team=team  team to use
```

## `heroku teams`

list the teams that you are a member of

```
USAGE
  $ heroku teams

OPTIONS
  --json  output in json format

DESCRIPTION
  Use heroku members:* to manage team members.
```

## `heroku unlock`

unlock an app so any organization member can join

```
USAGE
  $ heroku unlock

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```
<!-- commandsstop -->
