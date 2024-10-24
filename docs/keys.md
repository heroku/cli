`heroku keys`
=============

add/remove account ssh keys

* [`heroku keys`](#heroku-keys)
* [`heroku keys:add [KEY]`](#heroku-keysadd-key)
* [`heroku keys:clear`](#heroku-keysclear)
* [`heroku keys:remove KEY`](#heroku-keysremove-key)

## `heroku keys`

display your SSH keys

```
USAGE
  $ heroku keys [--json] [-l]

FLAGS
  -l, --long  display full SSH keys
      --json  output in json format

DESCRIPTION
  display your SSH keys
```

_See code: [src/commands/keys/index.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/keys/index.ts)_

## `heroku keys:add [KEY]`

add an SSH key for a user

```
USAGE
  $ heroku keys:add [KEY] [-y]

FLAGS
  -y, --yes  automatically answer yes for all prompts

DESCRIPTION
  add an SSH key for a user

EXAMPLES
  $ heroku keys:add
  Could not find an existing public key.
  Would you like to generate one? [Yn] y
  Generating new SSH public key.
  Uploading SSH public key /.ssh/id_rsa.pub... done
  $ heroku keys:add /my/key.pub
  Uploading SSH public key /my/key.pub... done
```

_See code: [src/commands/keys/add.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/keys/add.ts)_

## `heroku keys:clear`

remove all SSH keys for current user

```
USAGE
  $ heroku keys:clear

DESCRIPTION
  remove all SSH keys for current user
```

_See code: [src/commands/keys/clear.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/keys/clear.ts)_

## `heroku keys:remove KEY`

remove an SSH key from the user

```
USAGE
  $ heroku keys:remove KEY

DESCRIPTION
  remove an SSH key from the user

EXAMPLES
  $ heroku keys:remove email@example.com
  Removing email@example.com SSH key... done
```

_See code: [src/commands/keys/remove.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/keys/remove.ts)_
