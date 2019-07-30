oauth
=====

Command line plugin for managing OAuth clients, authorizations and tokens.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oauth.svg)](https://npmjs.org/package/oauth)
[![Downloads/week](https://img.shields.io/npm/dw/oauth.svg)](https://npmjs.org/package/oauth)
[![License](https://img.shields.io/npm/l/oauth.svg)](https://github.com/heroku/cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g oauth
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
oauth/8.0.0 darwin-x64 node-v10.16.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku hello [FILE]`](#heroku-hello-file)
* [`heroku help [COMMAND]`](#heroku-help-command)

## `heroku hello [FILE]`

describe the command here

```
USAGE
  $ heroku hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ heroku hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/heroku/cli/blob/v8.0.0/src/commands/hello.ts)_

## `heroku help [COMMAND]`

display help for heroku

```
USAGE
  $ heroku help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_
<!-- commandsstop -->
