heroku buildpacks
=================

add new app buildpack, inserting into list of buildpacks if necessary
Example:

     $ heroku buildpacks:add -i 1 https://github.com/heroku/heroku-buildpack-ruby

* [heroku buildpacks](#heroku-buildpacks)
* [heroku buildpacks:add URL](#heroku-buildpacksadd-url)
* [heroku buildpacks:clear](#heroku-buildpacksclear)
* [heroku buildpacks:remove [URL]](#heroku-buildpacksremove-url)
* [heroku buildpacks:set URL](#heroku-buildpacksset-url)

## heroku buildpacks

display the buildpack_url(s) for an app

```
USAGE
  $ heroku buildpacks

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Examples:
       $ heroku buildpacks
```

### heroku buildpacks:add URL

add new app buildpack, inserting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:add URL

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

        $ heroku buildpacks:add -i 1 https://github.com/heroku/heroku-buildpack-ruby
```

### heroku buildpacks:clear

clear all buildpacks set on the app

```
USAGE
  $ heroku buildpacks:clear

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### heroku buildpacks:remove [URL]

remove a buildpack set on the app

```
USAGE
  $ heroku buildpacks:remove [URL]

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL to remove from the list of URLs
  -r, --remote=remote  git remote of app to use
```

### heroku buildpacks:set URL

set new app buildpack, overwriting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:set URL

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

        $ heroku buildpacks:set -i 1 heroku/ruby
```

## heroku buildpacks:add URL

add new app buildpack, inserting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:add URL

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

        $ heroku buildpacks:add -i 1 https://github.com/heroku/heroku-buildpack-ruby
```

## heroku buildpacks:clear

clear all buildpacks set on the app

```
USAGE
  $ heroku buildpacks:clear

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## heroku buildpacks:remove [URL]

remove a buildpack set on the app

```
USAGE
  $ heroku buildpacks:remove [URL]

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL to remove from the list of URLs
  -r, --remote=remote  git remote of app to use
```

## heroku buildpacks:set URL

set new app buildpack, overwriting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:set URL

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

        $ heroku buildpacks:set -i 1 heroku/ruby
```
