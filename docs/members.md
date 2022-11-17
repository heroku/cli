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
  $ heroku members

OPTIONS
  -r, --role=role  filter by role
  -t, --team=team  team to use
  --json           output in json format
  --pending        filter by pending team invitations
```

## `heroku members:add EMAIL`

adds a user to a team

```
USAGE
  $ heroku members:add EMAIL

OPTIONS
  -r, --role=role  (required) member role (admin, collaborator, member, owner)
  -t, --team=team  team to use
```

## `heroku members:remove EMAIL`

removes a user from a team

```
USAGE
  $ heroku members:remove EMAIL

OPTIONS
  -t, --team=team  team to use
```

## `heroku members:set EMAIL`

sets a members role in a team

```
USAGE
  $ heroku members:set EMAIL

OPTIONS
  -r, --role=role  (required) member role (admin, collaborator, member, owner)
  -t, --team=team  team to use
```
