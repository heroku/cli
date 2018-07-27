# Heroku Enterprise
The enterprise plugin provides you with commands to interact with your Heroku
Enterprise account.

## Install

```sh
heroku plugins:install heroku-enterprise
```

## Develop
Please refer to [Developing CLI Plugins](https://devcenter.heroku.com/articles/developing-cli-plugins)

## Deploy

```sh
$ npm version patch/minor/major
$ npm publish
```

<!-- commands -->
* [`heroku enterprises`](#heroku-enterprises)
* [`heroku enterprises:create NAME`](#heroku-enterprisescreate-name)
* [`heroku enterprises:members`](#heroku-enterprisesmembers)
* [`heroku enterprises:members-add EMAIL`](#heroku-enterprisesmembers-add-email)
* [`heroku enterprises:members-remove EMAIL`](#heroku-enterprisesmembers-remove-email)
* [`heroku enterprises:teams`](#heroku-enterprisesteams)
* [`heroku enterprises:usage`](#heroku-enterprisesusage)
* [`heroku teams`](#heroku-teams)
* [`heroku teams:create TEAM`](#heroku-teamscreate-team)
* [`heroku teams:transfer TEAM`](#heroku-teamstransfer-team)

## `heroku enterprises`

list your enterprise accounts

```
USAGE
  $ heroku enterprises
```

## `heroku enterprises:create NAME`

(sudo) create an enterprise account

```
USAGE
  $ heroku enterprises:create NAME

OPTIONS
  --domain=domain      (required)
  --managers=managers  (required)
```

## `heroku enterprises:members`

list members of an enterprise account

```
USAGE
  $ heroku enterprises:members

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
```

## `heroku enterprises:members-add EMAIL`

add a member to an enterprise account

```
USAGE
  $ heroku enterprises:members-add EMAIL

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
  --permissions=permissions                (required) permissions to grant the member
```

## `heroku enterprises:members-remove EMAIL`

remove a member from an enterprise account

```
USAGE
  $ heroku enterprises:members-remove EMAIL

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
```

## `heroku enterprises:teams`

list teams within an enterprise account

```
USAGE
  $ heroku-enterprise enterprises:teams

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
```

## `heroku enterprises:usage`

list the usage for an enterprise account

```
USAGE
  $ heroku enterprises:usage

OPTIONS
  --end-date=end-date                      end date of the usage period
  --enterprise-account=enterprise-account  (required) enterprise account name
  --start-date=start-date                  start date of the usage period
```

## `heroku teams`

list the teams that you are a member of

```
USAGE
  $ heroku-enterprise teams
```

## `heroku teams:create TEAM`

Create a team in an enterprise account

```
USAGE
  $ heroku teams:create TEAM

ARGUMENTS
  TEAM  name of the team to create

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
```

## `heroku teams:transfer TEAM`

(sudo) transfer a team to an enterprise account

```
USAGE
  $ heroku teams:transfer TEAM

ARGUMENTS
  TEAM  name of the team to transfer

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
  --internal                               mark the billing for the team as internal
```
<!-- commandsstop -->
