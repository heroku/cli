heroku domains
==============

manage the domains for an app
# Commands

* [heroku domains [OPTIONS]](#domains)
* [heroku domains:add HOSTNAME [OPTIONS]](#domainsadd)
* [heroku domains:clear [OPTIONS]](#domainsclear)
* [heroku domains:remove HOSTNAME [OPTIONS]](#domainsremove)
* [heroku domains:wait [HOSTNAME] [OPTIONS]](#domainswait)
## domains

list domains for an app

```
USAGE
  $ heroku domains [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format

DESCRIPTION

  Example:

       $ heroku domains
       === example Heroku Domain
       example.herokuapp.com
    
       === example Custom Domains
       Domain Name      DNS Record Type  DNS Target
       ───────────      ───────────────  ──────────
       www.example.com  CNAME            www.example.herokudns.com
```

### domains:add

add domain to an app

```
USAGE
  $ heroku domains:add HOSTNAME [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
  --wait
```

### domains:clear

remove all domains from an app

```
USAGE
  $ heroku domains:clear [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
```

### domains:remove

remove domain from an app

```
USAGE
  $ heroku domains:remove HOSTNAME [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
```

### domains:wait

wait for domain to be active for an app

```
USAGE
  $ heroku domains:wait [HOSTNAME] [OPTIONS]

OPTIONS
  -a, --app=app        (required) [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
```
