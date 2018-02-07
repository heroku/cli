heroku authorizations
=====================

OAuth authorizations
# Commands

* [heroku authorizations [OPTIONS]](#authorizations)
* [heroku authorizations:create [OPTIONS]](#authorizationscreate)
* [heroku authorizations:info ID [OPTIONS]](#authorizationsinfo)
* [heroku authorizations:revoke ID](#authorizationsrevoke)
* [heroku authorizations:update ID [OPTIONS]](#authorizationsupdate)
## authorizations

list OAuth authorizations

```
USAGE
  $ heroku authorizations [OPTIONS]

OPTIONS
  --json  output in json format
```

### authorizations:create

create a new OAuth authorization

```
USAGE
  $ heroku authorizations:create [OPTIONS]

OPTIONS
  -d, --description=description  set a custom authorization description
  -e, --expires-in=expires-in    set expiration in seconds
  -s, --scope=scope              set custom OAuth scopes
  --json                         output in json format
  --short                        only output token

DESCRIPTION
  This creates an authorization with access to your Heroku account.
```

### authorizations:info

show an existing OAuth authorization

```
USAGE
  $ heroku authorizations:info ID [OPTIONS]

OPTIONS
  --json  output in json format
```

### authorizations:revoke

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:revoke ID
```

### authorizations:update

updates an OAuth authorization

```
USAGE
  $ heroku authorizations:update ID [OPTIONS]

OPTIONS
  -d, --description=description  set a custom authorization description
  --client-id=client-id          identifier of OAuth client to set
  --client-secret=client-secret  secret of OAuth client to set
```
