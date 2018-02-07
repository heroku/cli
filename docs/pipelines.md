heroku pipelines
================


# Commands

* [heroku pipelines [OPTIONS]](#pipelines)
* [heroku pipelines:add PIPELINE [OPTIONS]](#pipelinesadd)
* [heroku pipelines:create [NAME] [OPTIONS]](#pipelinescreate)
* [heroku pipelines:destroy PIPELINE](#pipelinesdestroy)
* [heroku pipelines:diff [OPTIONS]](#pipelinesdiff)
* [heroku pipelines:info PIPELINE [OPTIONS]](#pipelinesinfo)
* [heroku pipelines:list [OPTIONS]](#pipelineslist)
* [heroku pipelines:open PIPELINE](#pipelinesopen)
* [heroku pipelines:promote [OPTIONS]](#pipelinespromote)
* [heroku pipelines:remove [OPTIONS]](#pipelinesremove)
* [heroku pipelines:rename PIPELINE NAME](#pipelinesrename)
* [heroku pipelines:setup [NAME] [REPO] [OPTIONS]](#pipelinessetup)
* [heroku pipelines:transfer OWNER [OPTIONS]](#pipelinestransfer)
* [heroku pipelines:update [OPTIONS]](#pipelinesupdate)
## pipelines

list pipelines you have access to

```
USAGE
  $ heroku pipelines [OPTIONS]

OPTIONS
  --json  output in json format

DESCRIPTION
  Example:

       $ heroku pipelines
       === My Pipelines
       example
       sushi
```

### pipelines:add

add this app to a pipeline

```
USAGE
  $ heroku pipelines:add PIPELINE [OPTIONS]

ARGUMENTS
  PIPELINE  name of pipeline

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --stage=stage    stage of first app in pipeline

DESCRIPTION
  The app and pipeline names must be specified.
  The stage of the app will be guessed based on its name if not specified.

  Example:

       $ heroku pipelines:add example -a example-admin -s production
       Adding example-admin to example pipeline as production... done
```

### pipelines:create

create a new pipeline

```
USAGE
  $ heroku pipelines:create [NAME] [OPTIONS]

ARGUMENTS
  NAME  name of pipeline, defaults to basename of app

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --stage=stage    stage of first app in pipeline
  -t, --team=team      team to use

DESCRIPTION
  An existing app must be specified as the first app in the pipeline.
  The pipeline name will be inferred from the app name if not specified.
  The stage of the app will be guessed based on its name if not specified.
  The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.

  Example:

       $ heroku pipelines:create -a example-staging
       ? Pipeline name: example
       ? Stage of example-staging: staging
       Creating example pipeline... done
       Adding example-staging to example pipeline as staging... done
```

### pipelines:destroy

destroy a pipeline

```
USAGE
  $ heroku pipelines:destroy PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

DESCRIPTION
  Example:

       $ heroku pipelines:destroy example
       Destroying example pipeline... done
```

### pipelines:diff

compares the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:diff [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       $ heroku pipelines:diff --app murmuring-headland-14719
```

### pipelines:info

show list of apps in a pipeline

```
USAGE
  $ heroku pipelines:info PIPELINE [OPTIONS]

ARGUMENTS
  PIPELINE  pipeline to show

OPTIONS
  --json  output in json format

DESCRIPTION
  Example:

     $ heroku pipelines:info example
     === example
     owner: my-team (team)

     app name                     stage
     ───────────────────────────  ──────────
     ⬢ example-pr-16              review
     ⬢ example-pr-19              review
     ⬢ example-pr-23              review
     ⬢ example-staging            staging
     ⬢ example-staging-2          staging
     ⬢ example-production         production
```

### pipelines:list

list pipelines you have access to

```
USAGE
  $ heroku pipelines:list [OPTIONS]

OPTIONS
  --json  output in json format

DESCRIPTION
  Example:

       $ heroku pipelines
       === My Pipelines
       example
       sushi
```

### pipelines:open

open a pipeline in dashboard

```
USAGE
  $ heroku pipelines:open PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

DESCRIPTION
  Example:

       $ heroku pipelines:open example
```

### pipelines:promote

promote the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:promote [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -t, --to=to          comma separated list of apps to promote to

DESCRIPTION
  Example:

       $ heroku pipelines:promote -a example-staging
       Promoting example-staging to example (production)... done, v23
       Promoting example-staging to example-admin (production)... done, v54

  Example:

       $ heroku pipelines:promote -a example-staging --to my-production-app1,my-production-app2
       Starting promotion to apps: my-production-app1,my-production-app2... done
       Waiting for promotion to complete... done
       Promotion successful
       my-production-app1: succeeded
       my-production-app2: succeeded
```

### pipelines:remove

remove this app from its pipeline

```
USAGE
  $ heroku pipelines:remove [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       $ heroku pipelines:remove -a example-admin
       Removing example-admin... done
```

### pipelines:rename

rename a pipeline

```
USAGE
  $ heroku pipelines:rename PIPELINE NAME

ARGUMENTS
  PIPELINE  current name of pipeline
  NAME      new name of pipeline

DESCRIPTION
  Example:

       $ heroku pipelines:rename example www
       Renaming example pipeline to www... done
```

### pipelines:setup

bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)

```
USAGE
  $ heroku pipelines:setup [NAME] [REPO] [OPTIONS]

ARGUMENTS
  NAME  name of pipeline
  REPO  a GitHub repository to connect the pipeline to

OPTIONS
  -t, --team=team  team to use
  -y, --yes        accept all default settings without prompting

DESCRIPTION
  Example:

       $ heroku pipelines:setup example githuborg/reponame -o example-org
       ? Automatically deploy the master branch to staging? Yes
       ? Wait for CI to pass before deploying the master branch to staging? Yes
       ? Enable review apps? Yes
       ? Automatically create review apps for every PR? Yes
       ? Automatically destroy idle review apps after 5 days? Yes
       Creating pipeline... done
       Linking to repo... done
       Creating production and staging apps (⬢ example and ⬢ example-staging)
       Configuring pipeline... done
       View your new pipeline by running `heroku pipelines:open e5a55ffa-de3f-11e6-a245-3c15c2e6bc1e`
```

### pipelines:transfer

transfer ownership of a pipeline

```
USAGE
  $ heroku pipelines:transfer OWNER [OPTIONS]

ARGUMENTS
  OWNER  the owner to transfer the pipeline to

OPTIONS
  -c, --confirm=confirm
  -p, --pipeline=pipeline  (required) name of pipeline

DESCRIPTION
  Example:

       $ heroku pipelines:transfer me@example.com -p example
       === example

       app name              stage
       ────────────────────  ───────────
       ⬢ example-dev         development
       ⬢ example-staging     staging
       ⬢ example-prod        production

        ▸    This will transfer example and all of the listed apps to the me@example.com account
        ▸    to proceed, type edamame or re-run this command with --confirm example
       > example
       Transferring example pipeline to the me@example.com account... done

       $ heroku pipelines:transfer acme-widgets -p example
       === example

       app name              stage
       ────────────────────  ───────────
       ⬢ example-dev         development
       ⬢ example-staging     staging
       ⬢ example-prod        production

        ▸    This will transfer example and all of the listed apps to the acme-widgets team
        ▸    to proceed, type edamame or re-run this command with --confirm example
       > example

       Transferring example pipeline to the acme-widgets team... done
```

### pipelines:update

update this app's stage in a pipeline

```
USAGE
  $ heroku pipelines:update [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --stage=stage    new stage of app

DESCRIPTION
  Example:

       $ heroku pipelines:update -s staging -a example-admin
       Changing example-admin to staging... done
```
