# Pipelines Plugin for Heroku Toolbelt [![Circle CI](https://circleci.com/gh/heroku/heroku-pipelines/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-pipelines/tree/master)

[![npm version](https://badge.fury.io/js/heroku-pipelines.svg)](http://badge.fury.io/js/heroku-pipelines)

An experimental Heroku CLI plugin for [continuous delivery](http://en.wikipedia.org/wiki/Continuous_delivery) on Heroku.

This plugin is used to set up a collection of apps sharing a common codebase where the latest slug of one app can be promoted to the app(s) in the following stage. The promotion only copies the upstream build artifact and leaves the downstream app's config vars, add-ons, and Git repo untouched.

Note: This is a second iteration on pipelines which is completely independent of the previous implementation. This plugin can be installed along side with the [previous one](https://github.com/heroku/heroku-pipeline). They will not conflict, nor interact at all. You will have to manually migrate your pipelines from the old experiment to the new one.

## How to install this plugin

```
$ heroku plugins:install heroku-pipelines
```

### [Using Pipelines](https://devcenter.heroku.com/articles/pipelines)

#### Create a pipeline

```bash
$ heroku pipelines:create -a example # NAME and -s STAGE are optional and implied from app name
? Pipeline name: example
? Stage of example: production
Creating example pipeline... done
Adding example to example pipeline as production... done
```

#### Fork production into new admin and staging apps

```bash
$ heroku fork --from example --to example-admin --skip-pg
$ git remote rename heroku admin
...
$ heroku fork --from example --to example-staging --skip-pg
$ git remote rename heroku staging
...
```

#### Add apps to a pipeline

```bash
$ heroku pipelines:add example -a example-admin -s production
Adding example-admin to example pipeline as production... done

$ h pipelines:add -a example-staging example
? Stage of example-staging: staging
Adding example-staging to example pipeline as staging... done
```

#### List pipelines

```bash
$ heroku pipelines:list # Repo isn't yet returned
example github:heroku/example
sushi   github:heroku/sushi
```

#### Show pipeline detail

```bash
$ heroku pipelines:info example # Source and Flow aren't returned yet
=== example
Source type: github
Source repo: heroku/example
Staging:     example-staging
Production:  example
             example-admin
Flow:        example-staging --> example, example-admin
```

#### Show status

```bash
$ git commit -m "A super important fix"
$ git push staging
$ heroku pipelines:status -r production # Not implemented yet
Comparing example to master... done
example-staging behind by 1 commit:
  73ab415  2012-01-01  A super important fix  (Joe Developer)
```

#### Show diff

```bash
$ git commit -m "A super important fix"
$ git push staging
$ heroku pipelines:diff -r staging # Not implemented yet
Comparing example-staging to example... done
example-staging ahead by 1 commit:
  73ab415  2012-01-01  A super important fix  (Joe Developer)
Comparing example-staging to example-admin... done
example-staging ahead by 1 commit:
  73ab415  2012-01-01  A super important fix  (Joe Developer)
```

#### Promote an app in a pipeline

```bash
$ heroku pipelines:promote -r staging
Promoting example-staging to example (production)... done, v23
Promoting example-staging to example-admin (production)... done, v54
```

#### Rename pipeline

```bash
$ heroku pipelines:rename example www # Not working yet
Renaming example pipeline to www... done
```

#### Destroy pipeline

```bash
$ heroku pipelines:destroy www # Not working yet
Destroying www pipeline... done
```

#### Update apps in a pipeline

```bash
$ heroku pipelines:update -s staging -a example-admin
Changing example-admin to staging... done
```

#### Remove app from a pipeline

```bash
$ heroku pipelines:remove -a example-admin
Removing example-admin... done
```
#### Open a pipeline in Dashboard

```bash
$ heroku pipelines:open example
Opening dashboard... done
```

### TODO

* `heroku pipelines:destroy PIPELINE`
* `heroku pipelines:rename PIPELINE NAME`
* `heroku pipelines:diff [-a APP | -r REMOTE]`
* `heorku pipelines:status [-a APP | -r REMOTE]`
* `heroku pipelines:list` with repo
* `heroku pipelines:info` with full information
