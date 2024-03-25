`heroku certs`
==============

a topic for the ssl plugin

* [`heroku certs`](#heroku-certs)
* [`heroku certs:add CRT KEY`](#heroku-certsadd-crt-key)
* [`heroku certs:auto`](#heroku-certsauto)
* [`heroku certs:auto:disable`](#heroku-certsautodisable)
* [`heroku certs:auto:enable`](#heroku-certsautoenable)
* [`heroku certs:auto:refresh`](#heroku-certsautorefresh)
* [`heroku certs:chain`](#heroku-certschain)
* [`heroku certs:generate DOMAIN`](#heroku-certsgenerate-domain)
* [`heroku certs:info`](#heroku-certsinfo)
* [`heroku certs:key`](#heroku-certskey)
* [`heroku certs:remove`](#heroku-certsremove)
* [`heroku certs:update CRT KEY`](#heroku-certsupdate-crt-key)

## `heroku certs`

list SSL certificates for an app

```
USAGE
  $ heroku certs -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  list SSL certificates for an app
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/index.js)_

## `heroku certs:add CRT KEY`

add an SSL certificate to an app

```
USAGE
  $ heroku certs:add CRT KEY -a <value> [--bypass] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --bypass              bypass the trust chain completion step

DESCRIPTION
  add an SSL certificate to an app
  Note: certificates with PEM encoding are also valid

EXAMPLES
  $ heroku certs:add example.com.crt example.com.key
      If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
      https://help.salesforce.com/s/articleView?id=000333504&type=1
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/add.js)_

## `heroku certs:auto`

show ACM status for an app

```
USAGE
  $ heroku certs:auto -a <value> [--wait] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --wait                watch ACM status and display the status when complete

DESCRIPTION
  show ACM status for an app
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/auto/index.js)_

## `heroku certs:auto:disable`

disable ACM for an app

```
USAGE
  $ heroku certs:auto:disable -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  disable ACM for an app
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/auto/disable.js)_

## `heroku certs:auto:enable`

enable ACM status for an app

```
USAGE
  $ heroku certs:auto:enable -a <value> [--wait] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --wait                watch ACM status and exit when complete

DESCRIPTION
  enable ACM status for an app
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/auto/enable.js)_

## `heroku certs:auto:refresh`

refresh ACM for an app

```
USAGE
  $ heroku certs:auto:refresh -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  refresh ACM for an app
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/auto/refresh.js)_

## `heroku certs:chain`

print an ordered & complete chain for a certificate

```
USAGE
  $ heroku certs:chain -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  print an ordered & complete chain for a certificate
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/chain.js)_

## `heroku certs:generate DOMAIN`

generate a key and a CSR or self-signed certificate

```
USAGE
  $ heroku certs:generate DOMAIN -a <value> [--selfsigned] [--keysize <value>] [--owner <value>] [--country <value>]
    [--area <value>] [--city <value>] [--subject <value>] [--now] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --area=<value>        sub-country area (state, province, etc.) of owner
  --city=<value>        city of owner
  --country=<value>     country of owner, as a two-letter ISO country code
  --keysize=<value>     RSA key size in bits (default: 2048)
  --now                 do not prompt for any owner information
  --owner=<value>       name of organization certificate belongs to
  --selfsigned          generate a self-signed certificate instead of a CSR
  --subject=<value>     specify entire certificate subject

DESCRIPTION
  generate a key and a CSR or self-signed certificate
  Generate a key and certificate signing request (or self-signed certificate)
  for an app. Prompts for information to put in the certificate unless --now
  is used, or at least one of the --subject, --owner, --country, --area, or
  --city options is specified.

EXAMPLES
  $ heroku certs:generate example.com
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/generate.js)_

## `heroku certs:info`

show certificate information for an SSL certificate

```
USAGE
  $ heroku certs:info -a <value> [--name <value>] [--endpoint <value>] [--show-domains] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --endpoint=<value>    endpoint to check info on
  --name=<value>        name to check info on
  --show-domains        show associated domains

DESCRIPTION
  show certificate information for an SSL certificate
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/info.js)_

## `heroku certs:key`

print the correct key for the given certificate

```
USAGE
  $ heroku certs:key -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  print the correct key for the given certificate
  You must pass one single certificate, and one or more keys.
  The first key that signs the certificate will be printed back.

EXAMPLES
  $ heroku certs:key example.com.crt example.com.key
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/key.js)_

## `heroku certs:remove`

remove an SSL certificate from an app

```
USAGE
  $ heroku certs:remove -a <value> [--name <value>] [--endpoint <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --endpoint=<value>    endpoint to remove
  --name=<value>        name to remove

DESCRIPTION
  remove an SSL certificate from an app
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/remove.js)_

## `heroku certs:update CRT KEY`

update an SSL certificate on an app

```
USAGE
  $ heroku certs:update CRT KEY -a <value> [--bypass] [--name <value>] [--endpoint <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --bypass              bypass the trust chain completion step
  --endpoint=<value>    endpoint to update
  --name=<value>        name to update

DESCRIPTION
  update an SSL certificate on an app
  Note: certificates with PEM encoding are also valid

EXAMPLES
  $ heroku certs:update example.com.crt example.com.key
      If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
      https://help.salesforce.com/s/articleView?id=000333504&type=1
```

_See code: [@heroku-cli/plugin-certs-v5](https://github.com/heroku/cli/blob/v8.11.1/packages/certs-v5/commands/certs/update.js)_
