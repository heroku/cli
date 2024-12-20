`heroku domains`
================

custom domains for apps

* [`heroku domains`](#heroku-domains)
* [`heroku domains:add HOSTNAME`](#heroku-domainsadd-hostname)
* [`heroku domains:clear`](#heroku-domainsclear)
* [`heroku domains:info HOSTNAME`](#heroku-domainsinfo-hostname)
* [`heroku domains:remove HOSTNAME`](#heroku-domainsremove-hostname)
* [`heroku domains:update HOSTNAME`](#heroku-domainsupdate-hostname)
* [`heroku domains:wait [HOSTNAME]`](#heroku-domainswait-hostname)

## `heroku domains`

list domains for an app

```
USAGE
  $ heroku domains -a <value> [-h] [-r <value>] [-j] [--columns <value> | -x] [--sort <value>] [--filter
    <value>] [--output csv|json|yaml |  | [--csv | ]] [--no-header | ]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -h, --help             Show CLI help.
  -j, --json             output in json format
  -r, --remote=<value>   git remote of app to use
  -x, --extended         show extra columns
      --columns=<value>  only show provided columns (comma-separated)
      --csv              output is csv format [alias: --output=csv]
      --filter=<value>   filter property by partial string matching, ex: name=foo
      --no-header        hide table header from output
      --output=<option>  output in a more machine friendly format
                         <options: csv|json|yaml>
      --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  list domains for an app

EXAMPLES
  $ heroku domains
  === example Heroku Domain
  example-xxxxxxxxxxxx.herokuapp.com
  === example Custom Domains
  Domain Name      DNS Record Type  DNS Target
  www.example.com  CNAME            www.example.herokudns.com

  $ heroku domains --filter 'Domain Name=www.example.com'
```

_See code: [src/commands/domains/index.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/domains/index.ts)_

## `heroku domains:add HOSTNAME`

add a domain to an app

```
USAGE
  $ heroku domains:add HOSTNAME -a <value> [-h] [-c <value>] [-j] [--wait] [-r <value>]

ARGUMENTS
  HOSTNAME  unique identifier of the domain or full hostname

FLAGS
  -a, --app=<value>     (required) app to run command against
  -c, --cert=<value>    the name of the SSL cert you want to use for this domain
  -h, --help            Show CLI help.
  -j, --json            output in json format
  -r, --remote=<value>  git remote of app to use
  --wait

DESCRIPTION
  add a domain to an app

EXAMPLES
  $ heroku domains:add www.example.com
```

_See code: [src/commands/domains/add.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/domains/add.ts)_

## `heroku domains:clear`

remove all domains from an app

```
USAGE
  $ heroku domains:clear -a <value> [-h] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -h, --help            Show CLI help.
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove all domains from an app

EXAMPLES
  $ heroku domains:clear
```

_See code: [src/commands/domains/clear.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/domains/clear.ts)_

## `heroku domains:info HOSTNAME`

show detailed information for a domain on an app

```
USAGE
  $ heroku domains:info HOSTNAME -a <value> [-h] [-r <value>]

ARGUMENTS
  HOSTNAME  unique identifier of the domain or full hostname

FLAGS
  -a, --app=<value>     (required) app to run command against
  -h, --help            Show CLI help.
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show detailed information for a domain on an app

EXAMPLES
  $ heroku domains:info www.example.com
```

_See code: [src/commands/domains/info.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/domains/info.ts)_

## `heroku domains:remove HOSTNAME`

remove a domain from an app

```
USAGE
  $ heroku domains:remove HOSTNAME -a <value> [-h] [-r <value>]

ARGUMENTS
  HOSTNAME  unique identifier of the domain or full hostname

FLAGS
  -a, --app=<value>     (required) app to run command against
  -h, --help            Show CLI help.
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove a domain from an app

EXAMPLES
  $ heroku domains:remove www.example.com
```

_See code: [src/commands/domains/remove.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/domains/remove.ts)_

## `heroku domains:update HOSTNAME`

update a domain to use a different SSL certificate on an app

```
USAGE
  $ heroku domains:update HOSTNAME -a <value> --cert <value> [-h] [-r <value>]

ARGUMENTS
  HOSTNAME  unique identifier of the domain or full hostname

FLAGS
  -a, --app=<value>     (required) app to run command against
  -h, --help            Show CLI help.
  -r, --remote=<value>  git remote of app to use
      --cert=<value>    (required) the name or id of the certificate you want to use for this domain

DESCRIPTION
  update a domain to use a different SSL certificate on an app

EXAMPLES
  $ heroku domains:update www.example.com --cert mycert
```

_See code: [src/commands/domains/update.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/domains/update.ts)_

## `heroku domains:wait [HOSTNAME]`

wait for domain to be active for an app

```
USAGE
  $ heroku domains:wait [HOSTNAME] -a <value> [-h] [-r <value>]

ARGUMENTS
  HOSTNAME  unique identifier of the domain or full hostname

FLAGS
  -a, --app=<value>     (required) app to run command against
  -h, --help            Show CLI help.
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  wait for domain to be active for an app
```

_See code: [src/commands/domains/wait.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/domains/wait.ts)_
