heroku access
=============

manage user access to apps
# Commands

* [heroku access [OPTIONS]](#access)
* [heroku access:add EMAIL [OPTIONS]](#accessadd)
* [heroku access:remove EMAIL [OPTIONS]](#accessremove)
* [heroku access:update EMAIL [OPTIONS]](#accessupdate)
## access

list who has access to an app

```
USAGE
  $ heroku access [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

### access:add

Add new users to your app

```
USAGE
  $ heroku access:add EMAIL [OPTIONS]

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

### access:remove

Remove users from your app

```
USAGE
  $ heroku access:remove EMAIL [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       heroku access:remove user@email.com --app APP
```

### access:update

Update existing collaborators in an org app

```
USAGE
  $ heroku access:update EMAIL [OPTIONS]

OPTIONS
  -a, --app=app              (required) app to run command against
  -r, --remote=remote        git remote of app to use
  --permissions=permissions  comma-delimited list of permissions to update (deploy,manage,operate)

DESCRIPTION
  Example:

       heroku access:update user@email.com --app APP --privileges deploy,manage,operate
```
