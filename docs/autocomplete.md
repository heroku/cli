`heroku autocomplete`
=====================

display autocomplete installation instructions

* [`heroku autocomplete [SHELL]`](#heroku-autocomplete-shell)

## `heroku autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ heroku autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  refresh cache only (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ heroku autocomplete

  $ heroku autocomplete bash

  $ heroku autocomplete zsh

  $ heroku autocomplete --refresh-cache
```

_See code: [src/commands/autocomplete/index.ts](https://github.com/heroku/cli/blob/v10.1.1-beta.0/packages/cli/src/commands/autocomplete/index.ts)_
