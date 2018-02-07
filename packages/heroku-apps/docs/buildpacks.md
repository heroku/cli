heroku buildpacks
=================

Heroku CLI plugin to manage apps.
# Commands

* [heroku buildpacks [OPTIONS]](#buildpacks)
* [heroku buildpacks:add URL [OPTIONS]](#buildpacksadd)
* [heroku buildpacks:clear [OPTIONS]](#buildpacksclear)
* [heroku buildpacks:remove [URL] [OPTIONS]](#buildpacksremove)
* [heroku buildpacks:set URL [OPTIONS]](#buildpacksset)
## buildpacks

display the buildpack_url(s) for an app

```
USAGE
  $ heroku buildpacks [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Examples:
       $ heroku buildpacks
```

### buildpacks:add

add new app buildpack, inserting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:add URL [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

        $ heroku buildpacks:add -i 1 https://github.com/heroku/heroku-buildpack-ruby
```

### buildpacks:clear

clear all buildpacks set on the app

```
USAGE
  $ heroku buildpacks:clear [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### buildpacks:remove

remove a buildpack set on the app

```
USAGE
  $ heroku buildpacks:remove [URL] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL to remove from the list of URLs
  -r, --remote=remote  git remote of app to use
```

### buildpacks:set

set new app buildpack, overwriting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:set URL [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

        $ heroku buildpacks:set -i 1 heroku/ruby
```
