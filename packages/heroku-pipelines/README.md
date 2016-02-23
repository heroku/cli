# Pipelines Plugin for Heroku Toolbelt

[![npm
version](https://img.shields.io/npm/v/heroku-pipelines.svg)](https://www.npmjs.com/package/heroku-pipelines)
[![build status](https://img.shields.io/circleci/project/heroku/heroku-pipelines.svg)](https://circleci.com/gh/heroku/heroku-pipelines)

A Heroku CLI plugin for [continuous delivery](https://www.heroku.com/continuous-delivery) on Heroku.

This plugin is used to set up a collection of apps sharing a common codebase where the latest slug of one app can be promoted to the app(s) in the following stage. The promotion only copies the upstream build artifact and leaves the downstream app's config vars, add-ons, and Git repo untouched.

## How to install this plugin

This plugin is installed by default with the 
[Heroku Toolbelt](https://toolbelt.heroku.com/). You do not need to install it 
yourself. Just update your Toolbelt and plugins:

```
$ heroku update
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

#### Add apps to a pipeline

```bash
$ heroku pipelines:add example -a example-admin -s production
Adding example-admin to example pipeline as production... done

$ heroku pipelines:add -a example-staging example
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

#### Diff an app in a pipeline

```bash
$ heroku pipelines:diff -a my-app-staging
Fetching apps from pipeline... done
Fetching release info for all apps... done

my-app-staging is up to date with my-app
```

#### Promote an app in a pipeline

```bash
$ heroku pipelines:promote -r staging
Fetching app info... done
Fetching apps from my-pipeline... done
Starting promotion to production... done
Waiting for promotion to complete... done

Promotion successful
My-App:    succeeded
My-App-Eu: succeeded
```

#### Promote to specified apps in a pipeline
```bash
$ heroku pipelines:promote -a example-staging --to my-production-app1,my-production-app2
Starting promotion to apps: my-production-app1,my-production-app2... done
Waiting for promotion to complete... done
Promotion successful
my-production-app1: succeeded
my-production-app2: succeeded
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

#### Open a pipeline in Dashboard

```bash
$ heroku pipelines:open example
Opening dashboard... done
```

### TODO

* `heroku pipelines:status [-a APP | -r REMOTE]`
* `heroku pipelines:list` with repo
* `heroku pipelines:info` with full information
