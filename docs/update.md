`heroku update`
===============

update the Heroku CLI

* [`heroku update [CHANNEL]`](#heroku-update-channel)

## `heroku update [CHANNEL]`

update the heroku CLI

```
USAGE
  $ heroku update [CHANNEL] [--force |  | [-a | -v <value> | -i]] [-b ]

FLAGS
  -a, --available        See available versions.
  -b, --verbose          Show more details about the available versions.
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

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v4.6.42/src/commands/update.ts)_
