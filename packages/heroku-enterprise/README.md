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
* [`heroku-enterprise enterprises`](#heroku-enterprise-enterprises)
* [`heroku-enterprise enterprises:create NAME`](#heroku-enterprise-enterprisescreate-name)
* [`heroku-enterprise enterprises:members`](#heroku-enterprise-enterprisesmembers)
* [`heroku-enterprise enterprises:members-add EMAIL`](#heroku-enterprise-enterprisesmembers-add-email)
* [`heroku-enterprise enterprises:members-remove EMAIL`](#heroku-enterprise-enterprisesmembers-remove-email)
* [`heroku-enterprise enterprises:usage`](#heroku-enterprise-enterprisesusage)
* [`heroku-enterprise teams`](#heroku-enterprise-teams)
* [`heroku-enterprise teams:create TEAM`](#heroku-enterprise-teamscreate-team)
* [`heroku-enterprise teams:transfer TEAM`](#heroku-enterprise-teamstransfer-team)

## `heroku-enterprise enterprises`

list your enterprise accounts

```
USAGE
  $ heroku-enterprise enterprises
```

## `heroku-enterprise enterprises:create NAME`

(sudo) create an enterprise account

```
USAGE
  $ heroku-enterprise enterprises:create NAME

OPTIONS
  --domain=domain      (required)
  --managers=managers  (required)
```

## `heroku-enterprise enterprises:members`

list members of an enterprise account

```
USAGE
  $ heroku-enterprise enterprises:members

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
```

## `heroku-enterprise enterprises:members-add EMAIL`

add a member to an enterprise account

```
USAGE
  $ heroku-enterprise enterprises:members-add EMAIL

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
  --permissions=permissions                (required) permissions to grant the member
```

## `heroku-enterprise enterprises:members-remove EMAIL`

remove a member from an enterprise account

```
USAGE
  $ heroku-enterprise enterprises:members-remove EMAIL

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
```

## `heroku-enterprise enterprises:usage`

list the usage for an enterprise account

```
USAGE
  $ heroku-enterprise enterprises:usage

OPTIONS
  --end-date=end-date                      end date of the usage period
  --enterprise-account=enterprise-account  (required) enterprise account name
  --start-date=start-date                  start date of the usage period
```

## `heroku-enterprise teams`

list the teams that you are a member of

```
USAGE
  $ heroku-enterprise teams
```

## `heroku-enterprise teams:create TEAM`

Create a team in an enterprise account

```
USAGE
  $ heroku-enterprise teams:create TEAM

ARGUMENTS
  TEAM  name of the team to create

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
```

## `heroku-enterprise teams:transfer TEAM`

(sudo) transfer a team to an enterprise account

```
USAGE
  $ heroku-enterprise teams:transfer TEAM

ARGUMENTS
  TEAM  name of the team to transfer

OPTIONS
  --enterprise-account=enterprise-account  (required) enterprise account name
  --internal                               mark the billing for the team as internal
```
<!-- commandsstop -->
