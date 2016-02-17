Heroku Orgs Plugin for Heroku Toolbelt 4.0
===========
[![npm version](https://badge.fury.io/js/heroku-orgs.svg)](http://badge.fury.io/js/heroku-orgs)
[![Build Status](https://travis-ci.org/heroku/heroku-orgs.svg?branch=master)](https://travis-ci.org/heroku/heroku-orgs)

[Dev Center: Developing CLI Plugins](https://devcenter.heroku.com/articles/developing-toolbelt-plug-ins)


How to install this plugin
-------------------

**Note: These Node.js plugins are available in the current Ruby CLI. No need to download a separate Toolbelt 4.0 CLI.**

```
$ heroku plugins:install heroku-orgs
```

### Commands

```bash
$ heroku orgs
Usage: heroku orgs

list the organizations that you are a member of

 --json              # output in json format
```

```bash
$ heroku orgs:open
Usage: heroku orgs:open

open the organization interface in a browser window

 -o, --org ORG       # organization to use
```

```bash
$ heroku apps:join
Usage: heroku apps:join

add yourself to an organization app

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 ```

```
$ heroku apps:leave
Usage: heroku apps:leave

remove yourself from an organization app

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 ```

 ```bash
$ heroku apps:lock
Usage: heroku apps:lock

prevent organization members from joining an app

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 ```

```bash
$ heroku apps:unlock
Usage: heroku apps:unlock

unlock an app so any organization member can join

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 ```

 ```bash
$ heroku members
list members of an organization

 -r, --role ROLE     # filter by role
 --json              # output in json format
 -o, --org ORG       # organization to use

Additional commands, type "heroku help COMMAND" for more details:

  members:add EMAIL [--org ORG] [--role ROLE]  #  adds a new member to an org
  members:remove EMAIL [--org ORG]             #  removes a member from an org
  members:set NAME [--org ORG] [--role ROLE]   #  change role of member in org
 ```

 ```bash
 $ heroku members:add
Usage: heroku members:add EMAIL

adds a user to an organization

 -r, --role ROLE     # member role (admin, collaborator, member, owner)
 -o, --org ORG       # organization to use
 ```

 ```bash
 $ heroku members:set
Usage: heroku members:set EMAIL

sets a members role in an organization

 -r, --role ROLE     # member role (admin, collaborator, member, owner)
 -o, --org ORG       # organization to use
 ```

 ```bash
 $ heroku members:remove
 Usage: heroku members:remove EMAIL

removes a user from an organization

 -o, --org ORG       # organization to use
```

```bash
$ heroku apps:transfer
Usage: heroku apps:transfer RECIPIENT

transfer an app to another user or organization

 -l, --locked        # lock the app upon transfer
 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against

Examples:

  $ heroku apps:transfer collaborator@example.com
  Transferring example to collaborator@example.com... done

  $ heroku apps:transfer acme-widgets
  Transferring example to acme-widgets... done
```

```bash
$ heroku access
Usage: heroku access

list who has access to an application

 --json              # output in json format
 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
```
