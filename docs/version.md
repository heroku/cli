`heroku version`
================

display changelog information for a specific CLI version

* [`heroku version`](#heroku-version)
* [`heroku version:info [VERSION]`](#heroku-versioninfo-version)

## `heroku version`

```
USAGE
  $ heroku version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/2.2.37/src/commands/version.ts)_

## `heroku version:info [VERSION]`

display changelog information for a specific CLI version

```
USAGE
  $ heroku version:info [VERSION]

ARGUMENTS
  [VERSION]  version number to look up (e.g., 11.0.0, 10.17.0)

DESCRIPTION
  display changelog information for a specific CLI version

EXAMPLES
   $ heroku version:info 

   $ heroku version:info 11.0.0
```

_See code: [src/commands/version/info.ts](https://github.com/heroku/cli/blob/v11.0.2-alpha.0/src/commands/version/info.ts)_
