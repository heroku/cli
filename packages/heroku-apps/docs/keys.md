heroku keys
===========

manage ssh keys
# Commands

* [heroku keys [OPTIONS]](#keys)
* [heroku keys:add [KEY] [OPTIONS]](#keysadd)
* [heroku keys:clear](#keysclear)
* [heroku keys:remove KEY](#keysremove)
## keys

display your SSH keys

```
USAGE
  $ heroku keys [OPTIONS]

OPTIONS
  -l, --long  display full SSH keys
  --json      output in json format
```

### keys:add

add an SSH key for a user

```
USAGE
  $ heroku keys:add [KEY] [OPTIONS]

OPTIONS
  -y, --yes  automatically answer yes for all prompts

DESCRIPTION
  if no KEY is specified, will try to find ~/.ssh/id_rsa.pub

  Examples:

       $ heroku keys:add
       Could not find an existing public key.
       Would you like to generate one? [Yn] y
       Generating new SSH public key.
       Uploading SSH public key /.ssh/id_rsa.pub... done

       $ heroku keys:add /my/key.pub
       Uploading SSH public key /my/key.pub... done
```

### keys:clear

remove all SSH keys for current user

```
USAGE
  $ heroku keys:clear
```

### keys:remove

remove an SSH key from the user

```
USAGE
  $ heroku keys:remove KEY

DESCRIPTION

  Example:

       $ heroku keys:remove email@example.com
       Removing email@example.com SSH key... done
```
