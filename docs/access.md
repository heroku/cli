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
  $ heroku access

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

## `heroku access:add EMAIL`

add new users to your app

```
USAGE
  $ heroku access:add EMAIL

OPTIONS
  -a, --app=app                  (required) app to run command against
  -p, --permissions=permissions  list of permissions comma separated
  -r, --remote=remote            git remote of app to use

EXAMPLES
  $ heroku access:add user@email.com --app APP # add a collaborator to your app
  $ heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma separated
```

## `heroku access:remove EMAIL`

remove users from a team app

```
USAGE
  $ heroku access:remove EMAIL

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku access:remove user@email.com --app APP
```

## `heroku access:update EMAIL`

update existing collaborators on an team app

```
USAGE
  $ heroku access:update EMAIL

OPTIONS
  -a, --app=app                  (required) app to run command against
  -p, --permissions=permissions  comma-delimited list of permissions to update (deploy,manage,operate)
  -r, --remote=remote            git remote of app to use

EXAMPLES
  $ heroku access:update user@email.com --app APP --permissions deploy,manage,operate
```
