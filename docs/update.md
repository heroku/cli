`heroku update`
===============

update the Heroku CLI

* [`heroku update [CHANNEL]`](#heroku-update-channel)

## `heroku update [CHANNEL]`

update the heroku CLI

```
USAGE
  $ heroku update [CHANNEL] [-a] [-v <value> | -i] [--force]

FLAGS
  -a, --available        Install a specific version.
  -i, --interactive      Interactively select version to install. This is ignored if a channel is provided.
  -v, --version=<value>  Install a specific version.
      --force            Force a re-download of the requested version.

DESCRIPTION
  update the heroku CLI

EXAMPLES
  Update to the stable channel:

    $ heroku update stable

  Update to a specific version:

    $ heroku update --version 1.0.0

  Interactively select version:

    $ heroku update --interactive

  See available versions:

    $ heroku update --available
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v3.2.4/src/commands/update.ts)_
