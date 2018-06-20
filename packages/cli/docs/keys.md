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
  $ heroku keys

OPTIONS
  -l, --long  display full SSH keys
  --json      output in json format
```

## `heroku keys:add [KEY]`

add an SSH key for a user

```
USAGE
  $ heroku keys:add [KEY]

OPTIONS
  -y, --yes  automatically answer yes for all prompts

DESCRIPTION
  if no KEY is specified, will try to find ~/.ssh/id_rsa.pub

EXAMPLES
  $ heroku keys:add
  Could not find an existing public key.
  Would you like to generate one? [Yn] y
  Generating new SSH public key.
  Uploading SSH public key /.ssh/id_rsa.pub... done

  $ heroku keys:add /my/key.pub
  Uploading SSH public key /my/key.pub... done
```

## `heroku keys:clear`

remove all SSH keys for current user

```
USAGE
  $ heroku keys:clear
```

## `heroku keys:remove KEY`

remove an SSH key from the user

```
USAGE
  $ heroku keys:remove KEY

EXAMPLES
  $ heroku keys:remove email@example.com
  Removing email@example.com SSH key... done
```
