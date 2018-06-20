heroku-certs
===========

[![Build Status](https://travis-ci.org/heroku/heroku-certs.svg?branch=master)](https://travis-ci.org/heroku/heroku-certs)
[![codecov](https://codecov.io/gh/heroku/heroku-certs/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-certs)

## Commands

<!-- commands -->
* [`heroku certs`](#heroku-certs)
* [`heroku certs:add [CRT] [KEY]`](#heroku-certsadd-crt-key)
* [`heroku certs:auto`](#heroku-certsauto)
* [`heroku certs:auto:disable`](#heroku-certsautodisable)
* [`heroku certs:auto:enable`](#heroku-certsautoenable)
* [`heroku certs:auto:refresh`](#heroku-certsautorefresh)
* [`heroku certs:chain`](#heroku-certschain)
* [`heroku certs:generate [DOMAIN]`](#heroku-certsgenerate-domain)
* [`heroku certs:info`](#heroku-certsinfo)
* [`heroku certs:key`](#heroku-certskey)
* [`heroku certs:remove`](#heroku-certsremove)
* [`heroku certs:rollback`](#heroku-certsrollback)
* [`heroku certs:update [CRT] [KEY]`](#heroku-certsupdate-crt-key)

## `heroku certs`

list SSL certificates for an app

```
USAGE
  $ heroku certs
```

_See code: [commands/certs.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs.js)_

## `heroku certs:add [CRT] [KEY]`

add an SSL certificate to an app

```
USAGE
  $ heroku certs:add [CRT] [KEY]

OPTIONS
  --0  bypass the trust chain completion step
  --1  type to create, either 'sni' or 'endpoint'
  --2  domains to create after certificate upload

EXAMPLES
  $ heroku certs:add example.com.crt example.com.key

  Certificate Intermediary:
  $ heroku certs:add intermediary.crt example.com.crt example.com.key
```

_See code: [commands/certs/add.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/add.js)_

## `heroku certs:auto`

show ACM status for an app

```
USAGE
  $ heroku certs:auto
```

_See code: [commands/certs/auto.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/auto.js)_

## `heroku certs:auto:disable`

disable ACM for an app

```
USAGE
  $ heroku certs:auto:disable
```

_See code: [commands/certs/auto/disable.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/auto/disable.js)_

## `heroku certs:auto:enable`

enable ACM status for an app

```
USAGE
  $ heroku certs:auto:enable
```

_See code: [commands/certs/auto/enable.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/auto/enable.js)_

## `heroku certs:auto:refresh`

refresh ACM for an app

```
USAGE
  $ heroku certs:auto:refresh
```

_See code: [commands/certs/auto/refresh.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/auto/refresh.js)_

## `heroku certs:chain`

print an ordered & complete chain for a certificate

```
USAGE
  $ heroku certs:chain
```

_See code: [commands/certs/chain.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/chain.js)_

## `heroku certs:generate [DOMAIN]`

generate a key and a CSR or self-signed certificate

```
USAGE
  $ heroku certs:generate [DOMAIN]

OPTIONS
  --0  generate a self-signed certificate instead of a CSR
  --1  RSA key size in bits (default: 2048)
  --2  name of organization certificate belongs to
  --3  country of owner, as a two-letter ISO country code
  --4  sub-country area (state, province, etc.) of owner
  --5  city of owner
  --6  specify entire certificate subject
  --7  do not prompt for any owner information

EXAMPLES
  $ heroku certs:generate example.com
```

_See code: [commands/certs/generate.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/generate.js)_

## `heroku certs:info`

show certificate information for an SSL certificate

```
USAGE
  $ heroku certs:info

OPTIONS
  --0  name to check info on
  --1  endpoint to check info on
```

_See code: [commands/certs/info.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/info.js)_

## `heroku certs:key`

print the correct key for the given certificate

```
USAGE
  $ heroku certs:key

EXAMPLES
  $ heroku certs:key example.com.crt example.com.key
```

_See code: [commands/certs/key.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/key.js)_

## `heroku certs:remove`

remove an SSL certificate from an app

```
USAGE
  $ heroku certs:remove

OPTIONS
  --1  name to remove
  --2  endpoint to remove
```

_See code: [commands/certs/remove.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/remove.js)_

## `heroku certs:rollback`

rollback an SSL certificate from an app

```
USAGE
  $ heroku certs:rollback

OPTIONS
  --1  name to rollback
  --2  endpoint to rollback
```

_See code: [commands/certs/rollback.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/rollback.js)_

## `heroku certs:update [CRT] [KEY]`

update an SSL certificate on an app

```
USAGE
  $ heroku certs:update [CRT] [KEY]

OPTIONS
  --0  bypass the trust chain completion step
  --2  name to update
  --3  endpoint to update

EXAMPLES
  $ heroku certs:update example.com.crt example.com.key

  Certificate Intermediary:
  $ heroku certs:update intermediary.crt example.com.crt example.com.key
```

_See code: [commands/certs/update.js](https://github.com/heroku/cli/blob/v7.4.2/commands/certs/update.js)_
<!-- commandsstop -->
