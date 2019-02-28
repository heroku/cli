@heroku-cli/plugin-enterprise
==========

CLI to manage Heroku Enterprise Accounts

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/plugin-enterprise.svg)](https://npmjs.org/package/@heroku-cli/plugin-enterprise)
[![CircleCI](https://circleci.com/gh/heroku/heroku-enterprise/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-enterprise/tree/master)
<!-- [![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-enterprise?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-enterprise/branch/master) -->
[![Codecov](https://codecov.io/gh/heroku/heroku-enterprise/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-enterprise)
[![Downloads/week](https://img.shields.io/npm/dw/plugin-enterprise.svg)](https://npmjs.org/package/@heroku-cli/plugin-enterprise)
[![License](https://img.shields.io/npm/l/plugin-enterprise.svg)](https://github.com/heroku/heroku-enterprise/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
```sh-session
$ heroku plugins:install @heroku-cli/plugin-enterprise
$ heroku COMMAND
running command...
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
# Commands
<!-- commands -->
* [`heroku enterprises`](#heroku-enterprises)
* [`heroku enterprises:audits`](#heroku-enterprisesaudits)
* [`heroku enterprises:audits:export [LOG]`](#heroku-enterprisesauditsexport-log)
* [`heroku enterprises:members`](#heroku-enterprisesmembers)
* [`heroku enterprises:members:add EMAIL`](#heroku-enterprisesmembersadd-email)
* [`heroku enterprises:members:permissions:add EMAIL`](#heroku-enterprisesmemberspermissionsadd-email)
* [`heroku enterprises:members:permissions:remove EMAIL`](#heroku-enterprisesmemberspermissionsremove-email)
* [`heroku enterprises:members:remove EMAIL`](#heroku-enterprisesmembersremove-email)
* [`heroku enterprises:teams`](#heroku-enterprisesteams)
* [`heroku enterprises:teams:create [TEAM]`](#heroku-enterprisesteamscreate-team)
* [`heroku enterprises:teams:remove TEAM`](#heroku-enterprisesteamsremove-team)
* [`heroku enterprises:usage:daily`](#heroku-enterprisesusagedaily)
* [`heroku enterprises:usage:monthly`](#heroku-enterprisesusagemonthly)

## `heroku enterprises`

list your enterprise accounts

```
USAGE
  $ heroku enterprises

EXAMPLE
  $ heroku enterprises
```

_See code: [src/commands/enterprises/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/index.ts)_

## `heroku enterprises:audits`

list available audit logs for an enterprise account

```
USAGE
  $ heroku enterprises:audits

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -x, --extended                               show extra columns
  --json                                       display as json

EXAMPLE
  $ heroku enterprises:audits --enterprise-account=account-name
```

_See code: [src/commands/enterprises/audits/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/audits/index.ts)_

## `heroku enterprises:audits:export [LOG]`

export an audit log for an enterprise account

```
USAGE
  $ heroku enterprises:audits:export [LOG]

ARGUMENTS
  LOG  audit log date (YYYY-MM)

OPTIONS
  -d, --dest=dest                              download destination for the exported audit log
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -f, --force                                  overwrite existing file during download

EXAMPLES
  $ heroku enterprises:audits:export 2018-11 --enterprise-account=account-name
  $ heroku enterprises:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp
  $ heroku enterprises:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp/audit_report.json.gz
  $ heroku enterprises:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp/audit_report.json.gz --force
```

_See code: [src/commands/enterprises/audits/export.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/audits/export.ts)_

## `heroku enterprises:members`

list members of the enterprise account and their permissions

```
USAGE
  $ heroku enterprises:members

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  --columns=columns                            only show provided columns (comma-separated)
  --csv                                        output is csv format
  --filter=filter                              filter property by partial string matching, ex: name=foo
  --no-header                                  hide table header from output
  --no-truncate                                do not truncate output to fit screen
  --sort=sort                                  property to sort by (prepend '-' for descending)

EXAMPLE
  $ heroku enterprises:members --enterprise-account=account-name
```

_See code: [src/commands/enterprises/members/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/members/index.ts)_

## `heroku enterprises:members:add EMAIL`

add a member to an enterprise account

```
USAGE
  $ heroku enterprises:members:add EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -p, --permissions=permissions                (required) permissions to grant the member (comma-separated)

ALIASES
  $ heroku enterprises:members-add

EXAMPLE
  $ heroku enterprises:members:add member-name --enterprise-account=account-name 
  --permissions=billing,create,manage,view
```

_See code: [src/commands/enterprises/members/add.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/members/add.ts)_

## `heroku enterprises:members:permissions:add EMAIL`

adds permissions to the member of an enterprise account

```
USAGE
  $ heroku enterprises:members:permissions:add EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -p, --permissions=permissions                (required) permissions to grant the member (comma-separated)

EXAMPLE
  $ heroku enterprises:members:permissions:add member-name --enterprise-account=account-name 
  --permissions=billing,create,manage,view
```

_See code: [src/commands/enterprises/members/permissions/add.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/members/permissions/add.ts)_

## `heroku enterprises:members:permissions:remove EMAIL`

removes permissions from the member of an enterprise account

```
USAGE
  $ heroku enterprises:members:permissions:remove EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -p, --permissions=permissions                (required) permissions to remove from the member (comma-separated)

EXAMPLE
  $ heroku enterprises:members:permissions:remove member-name --enterprise-account=account-name 
  --permissions=billing,create,manage,view
```

_See code: [src/commands/enterprises/members/permissions/remove.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/members/permissions/remove.ts)_

## `heroku enterprises:members:remove EMAIL`

remove a member from an enterprise account

```
USAGE
  $ heroku enterprises:members:remove EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name

ALIASES
  $ heroku enterprises:members-remove

EXAMPLE
  $ heroku enterprises:members:remove member-name --enterprise-account=account-name
```

_See code: [src/commands/enterprises/members/remove.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/members/remove.ts)_

## `heroku enterprises:teams`

list teams within an enterprise account

```
USAGE
  $ heroku enterprises:teams

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  --columns=columns                            only show provided columns (comma-separated)
  --csv                                        output is csv format
  --filter=filter                              filter property by partial string matching, ex: name=foo
  --no-header                                  hide table header from output
  --no-truncate                                do not truncate output to fit screen
  --sort=sort                                  property to sort by (prepend '-' for descending)

EXAMPLE
  $ heroku enterprises:teams --enterprise-account=account-name
```

_See code: [src/commands/enterprises/teams/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/teams/index.ts)_

## `heroku enterprises:teams:create [TEAM]`

create a team in an enterprise account

```
USAGE
  $ heroku enterprises:teams:create [TEAM]

ARGUMENTS
  TEAM  name of the team to create

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name

EXAMPLE
  $ heroku enterprise:teams:create team-name --enterprise-account=account-name
```

_See code: [src/commands/enterprises/teams/create.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/teams/create.ts)_

## `heroku enterprises:teams:remove TEAM`

remove a team from an enterprise account

```
USAGE
  $ heroku enterprises:teams:remove TEAM

EXAMPLE
  $ heroku enterprises:teams:remove team-name
```

_See code: [src/commands/enterprises/teams/remove.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/teams/remove.ts)_

## `heroku enterprises:usage:daily`

list the daily usage for an enterprise account or team

```
USAGE
  $ heroku enterprises:usage:daily

OPTIONS
  -e, --enterprise-account=enterprise-account  enterprise account name
  -t, --team=team                              team name
  --csv                                        (required) output is csv format

  --end-date=end-date                          (required) end date of the usage period, cannot be more than 31 days
                                               after the start date

  --start-date=start-date                      (required) start date of the usage period, cannot be more than 3 months
                                               prior to today (starting 2019-01-01)

DESCRIPTION
  Displays the daily usage data for an enterprise account or team.

  NOTE: While we strive to provide the most accurate usage information, the data
  presented here may not reflect license usage or billing for your account.

EXAMPLES
  $ heroku enterprises:usage:daily --enterprise-account=account-name --start-date=2019-01-01 --end-date=2019-01-15 --csv
  $ heroku enterprises:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 --csv
  $ heroku enterprises:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 --csv | less
  $ heroku enterprises:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 --csv > /tmp/usage.csv
```

_See code: [src/commands/enterprises/usage/daily.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/usage/daily.ts)_

## `heroku enterprises:usage:monthly`

list the monthly usage for an enterprise account or team

```
USAGE
  $ heroku enterprises:usage:monthly

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -t, --team=team                              team name
  --columns=columns                            only show provided columns (comma-separated)
  --csv                                        output is csv format
  --end-date=end-date                          end date of the usage period
  --filter=filter                              filter property by partial string matching, ex: name=foo
  --no-header                                  hide table header from output
  --no-truncate                                do not truncate output to fit screen
  --sort=sort                                  property to sort by (prepend '-' for descending)
  --start-date=start-date                      start date of the usage period

DESCRIPTION
  Displays the monthly usage data for an enterprise account or team.

  NOTE: While we strive to provide the most accurate usage information, the data
  presented here may not reflect license usage or billing for your account.

EXAMPLES
  $ heroku enterprises:usage:monthly --enterprise-account=account-name
  $ heroku enterprises:usage:monthly --enterprise-account=account-name --team=team-name
  $ heroku enterprises:usage:monthly --enterprise-account=account-name --columns='account,team,app,dyno'
  $ heroku enterprises:usage:monthly --enterprise-account=account-name --columns='account,team,app,dyno' --csv
  $ heroku enterprises:usage:monthly --enterprise-account=account-name --columns='account,team,app,addon' 
  --sort='-addon'
  $ heroku enterprises:usage:monthly --enterprise-account=account-name --columns='account,team,app,addon' 
  --filter='app=myapp'
  $ heroku enterprises:usage:monthly --enterprise-account=account-name --columns='account,team,app,data' 
  --sort='-data,app'
```

_See code: [src/commands/enterprises/usage/monthly.ts](https://github.com/heroku/heroku-enterprise/blob/v2.1.1/src/commands/enterprises/usage/monthly.ts)_
<!-- commandsstop -->
