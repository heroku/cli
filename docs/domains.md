`heroku domains`
================

custom domains for apps

* [`heroku domains`](#heroku-domains)
* [`heroku domains:add HOSTNAME`](#heroku-domainsadd-hostname)
* [`heroku domains:clear`](#heroku-domainsclear)
* [`heroku domains:info HOSTNAME`](#heroku-domainsinfo-hostname)
* [`heroku domains:remove HOSTNAME`](#heroku-domainsremove-hostname)
* [`heroku domains:wait [HOSTNAME]`](#heroku-domainswait-hostname)

## `heroku domains`

list domains for an app

```
USAGE
  $ heroku domains

OPTIONS
  -a, --app=app        (required) app to run command against
  -h, --help           show CLI help
  -j, --json           output in json format
  -r, --remote=remote  git remote of app to use
  -x, --extended       show extra columns
  --columns=columns    only show provided columns (comma-separated)
  --csv                output is csv format
  --filter=filter      filter property by partial string matching, ex: name=foo
  --no-header          hide table header from output
  --sort=sort          property to sort by (prepend '-' for descending)

EXAMPLES
  $ heroku domains
  === example Heroku Domain
  example.herokuapp.com

  === example Custom Domains
  Domain Name      DNS Record Type  DNS Target
  www.example.com  CNAME            www.example.herokudns.com

  $ heroku domains --filter 'Domain Name=www.example.com'
```

_See code: [@heroku-cli/plugin-apps](https://github.com/heroku/heroku-cli-plugin-apps/blob/v7.42.0/src/commands/domains/index.ts)_

## `heroku domains:add HOSTNAME`

add a domain to an app

```
USAGE
  $ heroku domains:add HOSTNAME

OPTIONS
  -a, --app=app        (required) app to run command against
  -c, --cert=cert      the name of the SSL cert you want to use for this domain
  -h, --help           show CLI help
  -j, --json           output in json format
  -r, --remote=remote  git remote of app to use
  --wait

EXAMPLE
  heroku domains:add www.example.com
```

_See code: [@heroku-cli/plugin-apps](https://github.com/heroku/heroku-cli-plugin-apps/blob/v7.42.0/src/commands/domains/add.ts)_

## `heroku domains:clear`

remove all domains from an app

```
USAGE
  $ heroku domains:clear

OPTIONS
  -a, --app=app        (required) app to run command against
  -h, --help           show CLI help
  -r, --remote=remote  git remote of app to use

EXAMPLE
  heroku domains:clear
```

_See code: [@heroku-cli/plugin-apps](https://github.com/heroku/heroku-cli-plugin-apps/blob/v7.42.0/src/commands/domains/clear.ts)_

## `heroku domains:info HOSTNAME`

show detailed information for a domain on an app

```
USAGE
  $ heroku domains:info HOSTNAME

OPTIONS
  -a, --app=app        (required) app to run command against
  -h, --help           show CLI help
  -r, --remote=remote  git remote of app to use

EXAMPLE
  $ heroku domains:info www.example.com
```

_See code: [@heroku-cli/plugin-apps](https://github.com/heroku/heroku-cli-plugin-apps/blob/v7.42.0/src/commands/domains/info.ts)_

## `heroku domains:remove HOSTNAME`

remove a domain from an app

```
USAGE
  $ heroku domains:remove HOSTNAME

OPTIONS
  -a, --app=app        (required) app to run command against
  -h, --help           show CLI help
  -r, --remote=remote  git remote of app to use

EXAMPLE
  heroku domains:remove www.example.com
```

_See code: [@heroku-cli/plugin-apps](https://github.com/heroku/heroku-cli-plugin-apps/blob/v7.42.0/src/commands/domains/remove.ts)_

## `heroku domains:wait [HOSTNAME]`

wait for domain to be active for an app

```
USAGE
  $ heroku domains:wait [HOSTNAME]

OPTIONS
  -a, --app=app        (required) app to run command against
  -h, --help           show CLI help
  -r, --remote=remote  git remote of app to use
```

_See code: [@heroku-cli/plugin-apps](https://github.com/heroku/heroku-cli-plugin-apps/blob/v7.42.0/src/commands/domains/wait.ts)_
