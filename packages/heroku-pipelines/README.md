# Heroku Pipelines Plugin for Heroku Toolbelt [![Circle CI](https://circleci.com/gh/heroku/heroku-pipelines/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-pipelines/tree/master)

[![npm version](https://badge.fury.io/js/heroku-pipelines.svg)](http://badge.fury.io/js/heroku-pipelines)

Read more about Toolbelt 4.0 plugins [here](https://github.com/heroku/heroku-hello-world#heroku-hello-world).

## How to install this plugin

**Note: These Node.js plugins are available in the current Ruby CLI. No need to download a separate Toolbelt 4.0 CLI.**

```
$ heroku plugins:install heroku-pipelines
```

### [Using Pipelines](https://devcenter.heroku.com/articles/pipelines)

#### Create a pipelines

```bash
$ heroku pipelines:create -a example # -n name and -s stage are optional and implied from app name
Creating example pipeline... done
```

#### Fork production into a new staging app

```bash
$ heroku fork -a example example-admin —remote admin
...
$ heroku fork -a example example-staging —remote staging
...
```

#### Add apps to a pipeline

```bash
$ heroku pipelines:add example -a example-admin -s production
Adding example-admin to example pipeline as production... done

$ heroku pipelines:add example -a example-staging
Adding example-staging to example pipeline as staging... done
```

#### List pipelines

```bash
$ heroku pipelines:list
example github:heroku/example
sushi   github:heroku/sushi
```

#### Show pipeline detail

```bash
$ heroku pipelines:show example
=== example
Source type: github
Source repo: heroku/example
Staging:     example-staging
Production:  example
             example-admin
Flow:        example-staging —> example, example-admin
```

#### Show diff

```bash
$ git commit -m "A super important fix"
$ git push staging
$ heroku pipelines:diff -r staging
Comparing example-staging to example... done
example-staging ahead by 1 commit:
  73ab415  2012-01-01  A super important fix  (Joe Developer)
```

#### Promote an app in a pipeline

```bash
$ heroku pipelines:promote -r staging
Promoting example-staging to example (production)... done
```

#### Rename pipeline

```bash
$ heroku pipelines:rename example www
Renaming example pipeline to www... done
```

#### Destroy pipeline

```bash
$ heroku pipelines:destroy www
Destroying www pipeline... done
```
