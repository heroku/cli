heroku-certs
===========

[![Build Status](https://travis-ci.org/heroku/heroku-certs.svg?branch=master)](https://travis-ci.org/heroku/heroku-certs)

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
* [`heroku certs:update [CRT] [KEY]`](#heroku-certsupdate-crt-key)

## `heroku certs`

list SSL certificates for an app

```
USAGE
  $ heroku certs

DESCRIPTION
  list SSL certificates for an app
```

_See code: [commands/certs/index.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/index.js)_

## `heroku certs:add [CRT] [KEY]`

add an SSL certificate to an app

```
USAGE
  $ heroku certs:add [CRT] [KEY] [--0]

FLAGS
  --0  bypass the trust chain completion step

DESCRIPTION
  add an SSL certificate to an app

EXAMPLES
  $ heroku certs:add example.com.crt example.com.key
      If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
      https://help.salesforce.com/s/articleView?id=000333504&type=1
```

_See code: [commands/certs/add.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/add.js)_

## `heroku certs:auto`

show ACM status for an app

```
USAGE
  $ heroku certs:auto [--0]

FLAGS
  --0  watch ACM status and display the status when complete

DESCRIPTION
  show ACM status for an app
```

_See code: [commands/certs/auto/index.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/auto/index.js)_

## `heroku certs:auto:disable`

disable ACM for an app

```
USAGE
  $ heroku certs:auto:disable

DESCRIPTION
  disable ACM for an app
```

_See code: [commands/certs/auto/disable.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/auto/disable.js)_

## `heroku certs:auto:enable`

enable ACM status for an app

```
USAGE
  $ heroku certs:auto:enable [--0]

FLAGS
  --0  watch ACM status and exit when complete

DESCRIPTION
  enable ACM status for an app
```

_See code: [commands/certs/auto/enable.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/auto/enable.js)_

## `heroku certs:auto:refresh`

refresh ACM for an app

```
USAGE
  $ heroku certs:auto:refresh

DESCRIPTION
  refresh ACM for an app
```

_See code: [commands/certs/auto/refresh.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/auto/refresh.js)_

## `heroku certs:chain`

print an ordered & complete chain for a certificate

```
USAGE
  $ heroku certs:chain

DESCRIPTION
  print an ordered & complete chain for a certificate
```

_See code: [commands/certs/chain.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/chain.js)_

## `heroku certs:generate [DOMAIN]`

generate a key and a CSR or self-signed certificate

```
USAGE
  $ heroku certs:generate [DOMAIN] [--0] [--1] [--2] [--3] [--4] [--5] [--6] [--7]

FLAGS
  --0  generate a self-signed certificate instead of a CSR
  --1  RSA key size in bits (default: 2048)
  --2  name of organization certificate belongs to
  --3  country of owner, as a two-letter ISO country code
  --4  sub-country area (state, province, etc.) of owner
  --5  city of owner
  --6  specify entire certificate subject
  --7  do not prompt for any owner information

DESCRIPTION
  generate a key and a CSR or self-signed certificate

EXAMPLES
  $ heroku certs:generate example.com
```

_See code: [commands/certs/generate.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/generate.js)_

## `heroku certs:info`

show certificate information for an SSL certificate

```
USAGE
  $ heroku certs:info [--0] [--1] [--2]

FLAGS
  --0  name to check info on
  --1  endpoint to check info on
  --2  show associated domains

DESCRIPTION
  show certificate information for an SSL certificate
```

_See code: [commands/certs/info.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/info.js)_

## `heroku certs:key`

print the correct key for the given certificate

```
USAGE
  $ heroku certs:key

DESCRIPTION
  print the correct key for the given certificate

EXAMPLES
  $ heroku certs:key example.com.crt example.com.key
```

_See code: [commands/certs/key.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/key.js)_

## `heroku certs:remove`

remove an SSL certificate from an app

```
USAGE
  $ heroku certs:remove [--1] [--2]

FLAGS
  --1  name to remove
  --2  endpoint to remove

DESCRIPTION
  remove an SSL certificate from an app
```

_See code: [commands/certs/remove.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/remove.js)_

## `heroku certs:update [CRT] [KEY]`

update an SSL certificate on an app

```
USAGE
  $ heroku certs:update [CRT] [KEY] [--0] [--2] [--3]

FLAGS
  --0  bypass the trust chain completion step
  --2  name to update
  --3  endpoint to update

DESCRIPTION
  update an SSL certificate on an app

EXAMPLES
  $ heroku certs:update example.com.crt example.com.key
      If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
      https://help.salesforce.com/s/articleView?id=000333504&type=1
```

_See code: [commands/certs/update.js](https://github.com/heroku/cli/blob/v8.11.1-beta.0/packages/certs-v5/commands/certs/update.js)_
<!-- commandsstop -->
