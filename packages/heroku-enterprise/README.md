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
* [`heroku enterprise`](#heroku-enterprise)
* [`heroku enterprise:audits`](#heroku-enterpriseaudits)
* [`heroku enterprise:audits:export [LOG]`](#heroku-enterpriseauditsexport-log)
* [`heroku enterprise:members`](#heroku-enterprisemembers)
* [`heroku enterprise:members:add EMAIL`](#heroku-enterprisemembersadd-email)
* [`heroku enterprise:members:permissions:add EMAIL`](#heroku-enterprisememberspermissionsadd-email)
* [`heroku enterprise:members:permissions:remove EMAIL`](#heroku-enterprisememberspermissionsremove-email)
* [`heroku enterprise:members:remove EMAIL`](#heroku-enterprisemembersremove-email)
* [`heroku enterprise:rename NEWACCOUNTNAME`](#heroku-enterpriserename-newaccountname)
* [`heroku enterprise:teams`](#heroku-enterpriseteams)
* [`heroku enterprise:teams:create [TEAM]`](#heroku-enterpriseteamscreate-team)
* [`heroku enterprise:teams:remove TEAM`](#heroku-enterpriseteamsremove-team)
* [`heroku enterprise:usage:daily`](#heroku-enterpriseusagedaily)
* [`heroku enterprise:usage:monthly`](#heroku-enterpriseusagemonthly)

## `heroku enterprise`

list your enterprise accounts

```
USAGE
  $ heroku enterprise

EXAMPLE
  $ heroku enterprise
```

_See code: [src/commands/enterprise/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/index.ts)_

## `heroku enterprise:audits`

list available audit logs for an enterprise account

```
USAGE
  $ heroku enterprise:audits

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -x, --extended                               show extra columns
  --json                                       display as json

EXAMPLE
  $ heroku enterprise:audits --enterprise-account=account-name
```

_See code: [src/commands/enterprise/audits/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/audits/index.ts)_

## `heroku enterprise:audits:export [LOG]`

export an audit log for an enterprise account

```
USAGE
  $ heroku enterprise:audits:export [LOG]

ARGUMENTS
  LOG  audit log date (YYYY-MM)

OPTIONS
  -d, --dest=dest                              download destination for the exported audit log
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -f, --force                                  overwrite existing file during download

EXAMPLES
  $ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name
  $ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp
  $ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp/audit_report.json.gz
  $ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp/audit_report.json.gz --force
```

_See code: [src/commands/enterprise/audits/export.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/audits/export.ts)_

## `heroku enterprise:members`

list members of the enterprise account and their permissions

```
USAGE
  $ heroku enterprise:members

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  --columns=columns                            only show provided columns (comma-separated)
  --csv                                        output is csv format
  --filter=filter                              filter property by partial string matching, ex: name=foo
  --no-header                                  hide table header from output
  --no-truncate                                do not truncate output to fit screen
  --sort=sort                                  property to sort by (prepend '-' for descending)

EXAMPLE
  $ heroku enterprise:members --enterprise-account=account-name
```

_See code: [src/commands/enterprise/members/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/members/index.ts)_

## `heroku enterprise:members:add EMAIL`

add a member to an enterprise account

```
USAGE
  $ heroku enterprise:members:add EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -p, --permissions=permissions                (required) permissions to grant the member (comma-separated)

ALIASES
  $ heroku enterprise:members-add

EXAMPLE
  $ heroku enterprise:members:add member-email --enterprise-account=account-name 
  --permissions=billing,create,manage,view
```

_See code: [src/commands/enterprise/members/add.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/members/add.ts)_

## `heroku enterprise:members:permissions:add EMAIL`

adds permissions to the member of an enterprise account

```
USAGE
  $ heroku enterprise:members:permissions:add EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -p, --permissions=permissions                (required) permissions to grant the member (comma-separated)

EXAMPLE
  $ heroku enterprise:members:permissions:add member-email --enterprise-account=account-name 
  --permissions=billing,create,manage,view
```

_See code: [src/commands/enterprise/members/permissions/add.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/members/permissions/add.ts)_

## `heroku enterprise:members:permissions:remove EMAIL`

removes permissions from the member of an enterprise account

```
USAGE
  $ heroku enterprise:members:permissions:remove EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  -p, --permissions=permissions                (required) permissions to remove from the member (comma-separated)

EXAMPLE
  $ heroku enterprise:members:permissions:remove member-name --enterprise-account=account-name 
  --permissions=billing,create,manage,view
```

_See code: [src/commands/enterprise/members/permissions/remove.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/members/permissions/remove.ts)_

## `heroku enterprise:members:remove EMAIL`

remove a member from an enterprise account

```
USAGE
  $ heroku enterprise:members:remove EMAIL

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name

ALIASES
  $ heroku enterprise:members-remove

EXAMPLE
  $ heroku enterprise:members:remove member-name --enterprise-account=account-name
```

_See code: [src/commands/enterprise/members/remove.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/members/remove.ts)_

## `heroku enterprise:rename NEWACCOUNTNAME`

rename the enterprise account

```
USAGE
  $ heroku enterprise:rename NEWACCOUNTNAME

ARGUMENTS
  NEWACCOUNTNAME  new enterprise account name

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name

EXAMPLE
  $ heroku enterprise:rename new-account-name --enterprise-account=account-name
```

_See code: [src/commands/enterprise/rename.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/rename.ts)_

## `heroku enterprise:teams`

list teams within an enterprise account

```
USAGE
  $ heroku enterprise:teams

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name
  --columns=columns                            only show provided columns (comma-separated)
  --csv                                        output is csv format
  --filter=filter                              filter property by partial string matching, ex: name=foo
  --no-header                                  hide table header from output
  --no-truncate                                do not truncate output to fit screen
  --sort=sort                                  property to sort by (prepend '-' for descending)

EXAMPLE
  $ heroku enterprise:teams --enterprise-account=account-name
```

_See code: [src/commands/enterprise/teams/index.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/teams/index.ts)_

## `heroku enterprise:teams:create [TEAM]`

create a team in an enterprise account

```
USAGE
  $ heroku enterprise:teams:create [TEAM]

ARGUMENTS
  TEAM  name of the team to create

OPTIONS
  -e, --enterprise-account=enterprise-account  (required) enterprise account name

EXAMPLE
  $ heroku enterprise:teams:create team-name --enterprise-account=account-name
```

_See code: [src/commands/enterprise/teams/create.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/teams/create.ts)_

## `heroku enterprise:teams:remove TEAM`

remove a team from an enterprise account

```
USAGE
  $ heroku enterprise:teams:remove TEAM

EXAMPLE
  $ heroku enterprise:teams:remove team-name
```

_See code: [src/commands/enterprise/teams/remove.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/teams/remove.ts)_

## `heroku enterprise:usage:daily`

list the daily usage for an enterprise account or team

```
USAGE
  $ heroku enterprise:usage:daily

OPTIONS
  -e, --enterprise-account=enterprise-account  enterprise account name
  -t, --team=team                              team name
  --columns=columns                            only show provided columns (comma-separated)
  --csv                                        output is csv format

  --end-date=end-date                          (required) end date of the usage period, inclusive, cannot be more than
                                               31 days after the start date (YYYY-MM-DD)

  --filter=filter                              filter property by partial string matching, ex: name=foo

  --no-header                                  hide table header from output

  --no-truncate                                do not truncate output to fit screen

  --sort=sort                                  property to sort by (prepend '-' for descending)

  --start-date=start-date                      (required) start date of the usage period, cannot be more than 6 months
                                               prior to today (YYYY-MM-DD)

DESCRIPTION
  Displays the daily usage data for an enterprise account or team.

  NOTE: While we strive to provide the most accurate usage information, the data
  presented here may not reflect license usage or billing for your account.

EXAMPLES
  $ heroku enterprise:usage:daily --enterprise-account=account-name --start-date=2019-01-01 --end-date=2019-01-15
  $ heroku enterprise:usage:daily --enterprise-account=account-name --start-date=2019-01-01 --end-date=2019-01-15 
  --columns='team,app,dyno,data'
  $ heroku enterprise:usage:daily --enterprise-account=account-name --start-date=2019-01-01 --end-date=2019-01-15 
  --columns='team,app,dyno,data' --sort='-data,app'
  $ heroku enterprise:usage:daily --enterprise-account=account-name --start-date=2019-01-01 --end-date=2019-01-15 
  --columns='team,app,dyno,data' --filter='app=myapp'
  $ heroku enterprise:usage:daily --enterprise-account=account-name --start-date=2019-01-01 --end-date=2019-01-15 --csv
  $ heroku enterprise:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15
  $ heroku enterprise:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 
  --columns='app,dyno,data' --sort='-data,app'
  $ heroku enterprise:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 --csv
```

_See code: [src/commands/enterprise/usage/daily.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/usage/daily.ts)_

## `heroku enterprise:usage:monthly`

list the monthly usage for an enterprise account or team

```
USAGE
  $ heroku enterprise:usage:monthly

OPTIONS
  -e, --enterprise-account=enterprise-account  enterprise account name
  -t, --team=team                              team name
  --columns=columns                            only show provided columns (comma-separated)
  --csv                                        output is csv format
  --end-date=end-date                          end date of the usage period, inclusive (YYYY-MM)
  --filter=filter                              filter property by partial string matching, ex: name=foo
  --no-header                                  hide table header from output
  --no-truncate                                do not truncate output to fit screen
  --sort=sort                                  property to sort by (prepend '-' for descending)

  --start-date=start-date                      start date of the usage period, defaults to current month if not provided
                                               (YYYY-MM)

DESCRIPTION
  Displays the monthly usage data for an enterprise account or team.

  NOTE: While we strive to provide the most accurate usage information, the data
  presented here may not reflect license usage or billing for your account.

EXAMPLES
  $ heroku enterprise:usage:monthly --enterprise-account=account-name
  $ heroku enterprise:usage:monthly --enterprise-account=account-name --columns='team,app,dyno,data'
  $ heroku enterprise:usage:monthly --enterprise-account=account-name --columns='team,app,dyno,data' --sort='-data,app'
  $ heroku enterprise:usage:monthly --enterprise-account=account-name --columns='team,app,dyno,data' 
  --filter='app=myapp'
  $ heroku enterprise:usage:monthly --enterprise-account=account-name --csv
  $ heroku enterprise:usage:monthly --team=team-name --start-date 2019-01
  $ heroku enterprise:usage:monthly --team=team-name --start-date 2019-01 --end-date 2019-03
  $ heroku enterprise:usage:monthly --team=team-name --columns='app,dyno,data' --sort='-data,app'
  $ heroku enterprise:usage:monthly --team=team-name --csv
```

_See code: [src/commands/enterprise/usage/monthly.ts](https://github.com/heroku/heroku-enterprise/blob/v2.5.0/src/commands/enterprise/usage/monthly.ts)_
<!-- commandsstop -->
