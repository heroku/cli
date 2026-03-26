`heroku usage`
==============

list usage for metered add-ons attached to an app or apps within a team

* [`heroku usage:addons`](#heroku-usageaddons)

## `heroku usage:addons`

list usage for metered add-ons attached to an app or apps within a team

```
USAGE
  $ heroku usage:addons [--prompt] [-a <value>] [-t <value>]

FLAGS
  -a, --app=<value>   app to list metered add-ons usage for
  -t, --team=<value>  team to list metered add-ons usage for

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  list usage for metered add-ons attached to an app or apps within a team
```

_See code: [src/commands/usage/addons.ts](https://github.com/heroku/cli/blob/v11.0.1-beta.1/src/commands/usage/addons.ts)_
