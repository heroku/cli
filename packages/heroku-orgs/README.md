Heroku Orgs CLI
===========
[![npm version](https://badge.fury.io/js/heroku-orgs.svg)](http://badge.fury.io/js/heroku-orgs)
[![Build Status](https://travis-ci.org/heroku/heroku-orgs.svg?branch=master)](https://travis-ci.org/heroku/heroku-orgs)


### Usage

```bash
$ heroku orgs
Usage: heroku orgs

list the organizations that you are a member of

 --json              # output in json format
```

```bash
$ heroku orgs:open -o ORG
Usage: heroku orgs:open

open the organization interface in a browser window

 -o, --org ORG       # organization to use
```

```bash
$ heroku apps:join [--app APP]
Usage: heroku apps:join

add yourself to an organization app

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 ```

```bash
$ heroku apps:leave [--app APP]
Usage: heroku apps:leave

remove yourself from an organization app

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 ```

 ```bash
$ heroku apps:lock [--app APP]
Usage: heroku apps:lock

prevent organization members from joining an app

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 ```

```bash
$ heroku apps:unlock [--app APP]
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
 $ heroku members:add EMAIL -o ORG
Usage: heroku members:add EMAIL

adds a user to an organization

 -r, --role ROLE     # member role (admin, collaborator, member, owner)
 -o, --org ORG       # organization to use
 ```

 ```bash
 $ heroku members:set EMAIL -r ROLE -o ORG
Usage: heroku members:set EMAIL

sets a members role in an organization

 -r, --role ROLE     # member role (admin, collaborator, member, owner)
 -o, --org ORG       # organization to use
 ```

 ```bash
$ heroku members:remove EMAIL -o ORG
 Usage: heroku members:remove EMAIL

removes a user from an organization

 -o, --org ORG       # organization to use
```

```bash
$ heroku apps:transfer RECIPIENT [--app APP]
Usage: heroku apps:transfer RECIPIENT

transfer an app to another user or organization

 -l, --locked        # lock the app upon transfer
 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
 --bulk              # transfer applications in bulk
Examples:

  $ heroku apps:transfer collaborator@example.com
  Transferring example to collaborator@example.com... done

  $ heroku apps:transfer acme-widgets
  Transferring example to acme-widgets... done
```

```bash
$ heroku access [--app APP]
Usage: heroku access

list who has access to an application

 --json              # output in json format
 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against
```


```bash
$ heroku access:update EMAIL [--app APP]

Usage: heroku access:update EMAIL
Update existing collaborators in an org app

 --privileges PRIVILEGES # comma-delimited list of privileges to update (deploy,manage,operate,view)
 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against

heroku access:update user@email.com --app APP --privileges deploy,manage,operate,view
```

```bash
$ heroku access:add EMAIL [--app APP] [--privileges view,deploy,manage,operate]
Usage: heroku access:add EMAIL

Add new users to your app

 --privileges PRIVILEGES # list of privileges comma separated
 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against

heroku access:add user@email.com --app APP # Add a collaborator to your app

heroku access:add user@email.com --app APP --privileges view,deploy,manage,operate # privileges must be comma separated
```

```bash
$ heroku access:remove EMAIL [--app APP]
Usage: heroku access:remove EMAIL

Remove users from your app

 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against

heroku access:remove user@email.com --app APP
```

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

2. Open a new pr in https://github.com/heroku/cli/blob/master/package.json, updating to the appropiate heroku-orgs version.
