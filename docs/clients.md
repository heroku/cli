heroku clients
==============

OAuth clients on the platform
# Commands

* [heroku clients [OPTIONS]](#clients)
* [heroku clients:create NAME REDIRECT_URI [OPTIONS]](#clientscreate)
* [heroku clients:destroy ID](#clientsdestroy)
* [heroku clients:info ID [OPTIONS]](#clientsinfo)
* [heroku clients:rotate ID [OPTIONS]](#clientsrotate)
* [heroku clients:update ID [OPTIONS]](#clientsupdate)
## clients

list your OAuth clients

```
USAGE
  $ heroku clients [OPTIONS]

OPTIONS
  --json  output in json format
```

### clients:create

create a new OAuth client

```
USAGE
  $ heroku clients:create NAME REDIRECT_URI [OPTIONS]

OPTIONS
  -s, --shell  output in shell format
  --json       output in json format
```

### clients:destroy

delete client by ID

```
USAGE
  $ heroku clients:destroy ID
```

### clients:info

show details of an oauth client

```
USAGE
  $ heroku clients:info ID [OPTIONS]

OPTIONS
  -s, --shell  output in shell format
  --json       output in json format
```

### clients:rotate

(sudo) rotate OAuth client secret

```
USAGE
  $ heroku clients:rotate ID [OPTIONS]

OPTIONS
  -s, --shell  output in shell format
  --json       output in json format
```

### clients:update

(sudo) update OAuth client

```
USAGE
  $ heroku clients:update ID [OPTIONS]

OPTIONS
  -n, --name=name  change the client name
  --url=url        change the client redirect URL
```
