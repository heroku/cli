`heroku autocomplete`
=====================

display autocomplete installation instructions

* [`heroku autocomplete [SHELL]`](#heroku-autocomplete-shell)

## `heroku autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ heroku autocomplete [SHELL] [--prompt] [-r]

ARGUMENTS
  [SHELL]  shell type

FLAGS
  -r, --refresh-cache  refresh cache only (ignores displaying instructions)

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
   $ heroku autocomplete 

   $ heroku autocomplete bash 

   $ heroku autocomplete zsh 

   $ heroku autocomplete --refresh-cache
```

_See code: [src/commands/autocomplete/index.ts](https://github.com/heroku/cli/blob/v11.0.3-beta.0/src/commands/autocomplete/index.ts)_
