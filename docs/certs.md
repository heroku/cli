heroku certs
============

a topic for the ssl plugin
# Commands

* [heroku certs [OPTIONS]](#certs)
* [heroku certs:add CRT KEY [OPTIONS]](#certsadd)
* [heroku certs:auto [OPTIONS]](#certsauto)
* [heroku certs:auto:disable [OPTIONS]](#certsautodisable)
* [heroku certs:auto:enable [OPTIONS]](#certsautoenable)
* [heroku certs:auto:refresh [OPTIONS]](#certsautorefresh)
* [heroku certs:chain [OPTIONS]](#certschain)
* [heroku certs:generate DOMAIN [OPTIONS]](#certsgenerate)
* [heroku certs:info [OPTIONS]](#certsinfo)
* [heroku certs:key [OPTIONS]](#certskey)
* [heroku certs:remove [OPTIONS]](#certsremove)
* [heroku certs:rollback [OPTIONS]](#certsrollback)
* [heroku certs:update CRT KEY [OPTIONS]](#certsupdate)
## certs

List SSL certificates for an app.

```
USAGE
  $ heroku certs [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### certs:add

add an SSL certificate to an app

```
USAGE
  $ heroku certs:add CRT KEY [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --bypass             bypass the trust chain completion step
  --domains=domains    domains to create after certificate upload
  --type=type          type to create, either 'sni' or 'endpoint'

DESCRIPTION
  Note: certificates with PEM encoding are also valid

  Example:

       $ heroku certs:add example.com.crt example.com.key

  Example (Certificate Intermediary):

        $ heroku certs:add intermediary.crt example.com.crt example.com.key
```

### certs:auto

Show ACM status for an app.

```
USAGE
  $ heroku certs:auto [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### certs:auto:disable

Disable Automatic Certificate Management for an app.

```
USAGE
  $ heroku certs:auto:disable [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### certs:auto:enable

Enable ACM status for an app.

```
USAGE
  $ heroku certs:auto:enable [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### certs:auto:refresh

Refresh ACM for an app.

```
USAGE
  $ heroku certs:auto:refresh [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### certs:auto:disable

Disable Automatic Certificate Management for an app.

```
USAGE
  $ heroku certs:auto:disable [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### certs:auto:enable

Enable ACM status for an app.

```
USAGE
  $ heroku certs:auto:enable [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### certs:auto:refresh

Refresh ACM for an app.

```
USAGE
  $ heroku certs:auto:refresh [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### certs:chain

print an ordered & complete chain for a certificate

```
USAGE
  $ heroku certs:chain [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### certs:generate

generate a key and a CSR or self-signed certificate

```
USAGE
  $ heroku certs:generate DOMAIN [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --area=area          sub-country area (state, province, etc.) of owner
  --city=city          city of owner
  --country=country    country of owner, as a two-letter ISO country code
  --keysize=keysize    RSA key size in bits (default: 2048)
  --now                do not prompt for any owner information
  --owner=owner        name of organization certificate belongs to
  --selfsigned         generate a self-signed certificate instead of a CSR
  --subject=subject    specify entire certificate subject

DESCRIPTION
  Generate a key and certificate signing request (or self-signed certificate)
  for an app. Prompts for information to put in the certificate unless --now
  is used, or at least one of the --subject, --owner, --country, --area, or
  --city options is specified.

  Example:

       $ heroku certs:generate example.com
```

### certs:info

show certificate information for an SSL certificate

```
USAGE
  $ heroku certs:info [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --endpoint=endpoint  endpoint to check info on
  --name=name          name to check info on
```

### certs:key

print the correct key for the given certificate

```
USAGE
  $ heroku certs:key [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  You must pass one single certificate, and one or more keys.
  The first key that signs the certificate will be printed back.

  Example:

       $ heroku certs:key example.com.crt example.com.key
```

### certs:remove

remove an SSL certificate from an app

```
USAGE
  $ heroku certs:remove [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --endpoint=endpoint  endpoint to remove
  --name=name          name to remove
```

### certs:rollback

rollback an SSL certificate from an app

```
USAGE
  $ heroku certs:rollback [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --endpoint=endpoint  endpoint to rollback
  --name=name          name to rollback
```

### certs:update

update an SSL certificate on an app

```
USAGE
  $ heroku certs:update CRT KEY [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --bypass             bypass the trust chain completion step
  --endpoint=endpoint  endpoint to update
  --name=name          name to update

DESCRIPTION
  Note: certificates with PEM encoding are also valid

  Example:

       $ heroku certs:update example.com.crt example.com.key

  Example (Certificate Intermediary) :

       $ heroku certs:update intermediary.crt example.com.crt example.com.key
```
