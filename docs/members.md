`heroku members`
================

manage organization members

* [`heroku members`](#heroku-members)
* [`heroku members:add EMAIL`](#heroku-membersadd-email)
* [`heroku members:remove EMAIL`](#heroku-membersremove-email)
* [`heroku members:set EMAIL`](#heroku-membersset-email)

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
