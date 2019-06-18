=======
pipelines
=========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/pipelines.svg)](https://npmjs.org/package/pipelines)
[![Downloads/week](https://img.shields.io/npm/dw/pipelines.svg)](https://npmjs.org/package/pipelines)
[![License](https://img.shields.io/npm/l/pipelines.svg)](https://github.com/chadian/pipelines/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g pipelines
$ oclif-example COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-pipelines/7.28.0 darwin-x64 node-v10.2.1
$ heroku --help [COMMAND]
USAGE
  $ oclif-example COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)
* [`heroku reviewapps:enable`](#heroku-reviewappsenable)

## `heroku reviewapps:disable`

disable review apps or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of app to use
  --autodeploy             disable autodeployments
  --autodestroy            disable automatically destroying review apps

EXAMPLE
  $ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy
```

_See code: [src/commands/reviewapps/disable.ts](https://github.com/heroku/heroku-cli-plugin-pipelines/blob/v7.28.0/src/commands/reviewapps/disable.ts)_

## `heroku reviewapps:enable`

describe the command here

```
USAGE
  $ oclif-example hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ oclif-example hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/reviewapps/enable.ts](https://github.com/heroku/heroku-cli-plugin-pipelines/blob/v7.28.0/src/commands/reviewapps/enable.ts)_
<!-- commandsstop -->
