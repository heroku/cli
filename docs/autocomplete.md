`heroku autocomplete`
=====================

Display autocomplete installation instructions.

* [`heroku autocomplete [SHELL]`](#heroku-autocomplete-shell)

## `heroku autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ heroku autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ heroku autocomplete

  $ heroku autocomplete bash

  $ heroku autocomplete zsh

  $ heroku autocomplete powershell

  $ heroku autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v4.0.5/src/commands/autocomplete/index.ts)_
