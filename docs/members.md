heroku members
==============

manage organization members
# Commands

* [heroku members [OPTIONS]](#members)
* [heroku members:add EMAIL [OPTIONS]](#membersadd)
* [heroku members:remove EMAIL [OPTIONS]](#membersremove)
* [heroku members:set EMAIL [OPTIONS]](#membersset)
## members

list members of an organization or a team

```
USAGE
  $ heroku members [OPTIONS]

OPTIONS
  -r, --role=role  filter by role
  -t, --team=team  team to use
  --json           output in json format
  --pending        filter by pending team invitations
```

### members:add

adds a user to an organization or a team

```
USAGE
  $ heroku members:add EMAIL [OPTIONS]

OPTIONS
  -r, --role=role  (required) member role (admin, collaborator, member, owner)
  -t, --team=team  team to use
```

### members:remove

removes a user from an organization or a team

```
USAGE
  $ heroku members:remove EMAIL [OPTIONS]

OPTIONS
  -t, --team=team  team to use
```

### members:set

sets a members role in an organization or a team

```
USAGE
  $ heroku members:set EMAIL [OPTIONS]

OPTIONS
  -r, --role=role  (required) member role (admin, collaborator, member, owner)
  -t, --team=team  team to use
```
