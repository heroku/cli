`heroku access`
===============

manage user access to apps

* [`heroku access`](#heroku-access)
* [`heroku access:add EMAIL`](#heroku-accessadd-email)
* [`heroku access:remove EMAIL`](#heroku-accessremove-email)
* [`heroku access:update EMAIL`](#heroku-accessupdate-email)

## `heroku access`

list who has access to an app

```
USAGE
  $ heroku access -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  list who has access to an app
```

## `heroku access:add EMAIL`

add new users to your app

```
USAGE
  $ heroku access:add EMAIL -a <value> [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>          (required) app to run command against
  -p, --permissions=<value>  list of permissions comma separated
  -r, --remote=<value>       git remote of app to use

DESCRIPTION
  add new users to your app


EXAMPLES
  $ heroku access:add user@email.com --app APP # add a collaborator to your app

  $ heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma separated
```

## `heroku access:remove EMAIL`

remove users from a team app

```
USAGE
  $ heroku access:remove EMAIL -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove users from a team app


EXAMPLES
  $ heroku access:remove user@email.com --app APP
```

## `heroku access:update EMAIL`

update existing collaborators on an team app

```
USAGE
  $ heroku access:update EMAIL -a <value> [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>          (required) app to run command against
  -p, --permissions=<value>  comma-delimited list of permissions to update (deploy,manage,operate)
  -r, --remote=<value>       git remote of app to use

DESCRIPTION
  update existing collaborators on an team app


EXAMPLES
  $ heroku access:update user@email.com --app APP --permissions deploy,manage,operate
```
