`heroku members`
================

manage organization members

* [`heroku members`](#heroku-members)
* [`heroku members:add EMAIL`](#heroku-membersadd-email)
* [`heroku members:remove`](#heroku-membersremove)
* [`heroku members:set`](#heroku-membersset)

## `heroku members`

list members of a team

```
USAGE
  $ heroku members -t <value> [-r <value>] [--pending] [--json]

FLAGS
  -r, --role=<value>  filter by role
  -t, --team=<value>  (required) team to use
      --json          output in json format
      --pending       filter by pending team invitations

DESCRIPTION
  list members of a team
```

_See code: [src/commands/members/index.ts](https://github.com/heroku/cli/blob/v10.4.2-alpha.0/packages/cli/src/commands/members/index.ts)_

## `heroku members:add EMAIL`

adds a user to a team

```
USAGE
  $ heroku members:add EMAIL -r <value> -t <value>

ARGUMENTS
  EMAIL  email address of the team member

FLAGS
  -r, --role=<value>  (required) member role (admin, collaborator, member, owner)
  -t, --team=<value>  (required) team to use

DESCRIPTION
  adds a user to a team
```

_See code: [src/commands/members/add.ts](https://github.com/heroku/cli/blob/v10.4.2-alpha.0/packages/cli/src/commands/members/add.ts)_

## `heroku members:remove`

removes a user from a team

```
USAGE
  $ heroku members:remove -t <value>

FLAGS
  -t, --team=<value>  (required) team to use

DESCRIPTION
  removes a user from a team
```

_See code: [src/commands/members/remove.ts](https://github.com/heroku/cli/blob/v10.4.2-alpha.0/packages/cli/src/commands/members/remove.ts)_

## `heroku members:set`

sets a members role in a team

```
USAGE
  $ heroku members:set -r <value> -t <value>

FLAGS
  -r, --role=<value>  (required) member role (admin, collaborator, member, owner)
  -t, --team=<value>  (required) team to use

DESCRIPTION
  sets a members role in a team
```

_See code: [src/commands/members/set.ts](https://github.com/heroku/cli/blob/v10.4.2-alpha.0/packages/cli/src/commands/members/set.ts)_
