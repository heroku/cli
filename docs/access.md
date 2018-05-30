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

Add new users to your app

```
USAGE
  $ heroku access:add EMAIL

OPTIONS
  -a, --app=app              (required) app to run command against
  -r, --remote=remote        git remote of app to use
  --permissions=permissions  list of permissions comma separated

DESCRIPTION
  Examples:

       heroku access:add user@email.com --app APP # Add a collaborator to your app
       heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma 
  separated
```

## `heroku access:remove EMAIL`

Remove users from your app

```
USAGE
  $ heroku access:remove EMAIL

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       heroku access:remove user@email.com --app APP
```

## `heroku access:update EMAIL`

Update existing collaborators in an org app

```
USAGE
  $ heroku access:update EMAIL

OPTIONS
  -a, --app=app              (required) app to run command against
  -r, --remote=remote        git remote of app to use
  --permissions=permissions  comma-delimited list of permissions to update (deploy,manage,operate)

DESCRIPTION
  Example:

       heroku access:update user@email.com --app APP --permissions deploy,manage,operate
```
