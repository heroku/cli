`heroku access`
===============

manage user access to apps

* [`heroku access`](#heroku-access)
* [`heroku access:add EMAIL`](#heroku-accessadd-email)
* [`heroku access:remove`](#heroku-accessremove)
* [`heroku access:update EMAIL`](#heroku-accessupdate-email)

## `heroku access`

list who has access to an app

```
USAGE
  $ heroku access -a <value> [--prompt] [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            output in json format

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  list who has access to an app
```

_See code: [src/commands/access/index.ts](https://github.com/heroku/cli/blob/v11.2.0/src/commands/access/index.ts)_

## `heroku access:add EMAIL`

add new users to your app

```
USAGE
  $ heroku access:add EMAIL -a <value> [--prompt] [-p <value>] [-r <value>]

ARGUMENTS
  EMAIL  email address of the team member

FLAGS
  -a, --app=<value>          (required) app to run command against
  -p, --permissions=<value>  list of permissions comma separated
  -r, --remote=<value>       git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  add new users to your app

EXAMPLES
   $ heroku access:add user@email.com --app APP  # add a collaborator to your app

   $ heroku access:add user@email.com --app APP --permissions deploy,manage,operate  # permissions must be comma separated
```

_See code: [src/commands/access/add.ts](https://github.com/heroku/cli/blob/v11.2.0/src/commands/access/add.ts)_

## `heroku access:remove`

remove users from a team app

```
USAGE
  $ heroku access:remove -a <value> [--prompt] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  remove users from a team app

EXAMPLES
   $ heroku access:remove user@email.com --app APP
```

_See code: [src/commands/access/remove.ts](https://github.com/heroku/cli/blob/v11.2.0/src/commands/access/remove.ts)_

## `heroku access:update EMAIL`

update existing collaborators on an team app

```
USAGE
  $ heroku access:update EMAIL -a <value> -p <value> [--prompt] [-r <value>]

ARGUMENTS
  EMAIL  email address of the team member

FLAGS
  -a, --app=<value>          (required) app to run command against
  -p, --permissions=<value>  (required) comma-delimited list of permissions to update (deploy,manage,operate)
  -r, --remote=<value>       git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  update existing collaborators on an team app
```

_See code: [src/commands/access/update.ts](https://github.com/heroku/cli/blob/v11.2.0/src/commands/access/update.ts)_
