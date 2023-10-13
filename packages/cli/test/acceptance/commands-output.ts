/* eslint-disable no-useless-escape */
export default `\u001B[1m Command                                        Summary                                                                                                                                                 \u001B[22m
\u001B[1m ────────────────────────────────────────────── ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── \u001B[22m
 2fa                                            check 2fa status
 2fa:disable                                    disables 2fa on account
 access                                         list who has access to an app
 access:add                                     add new users to your app
 access:remove                                  remove users from a team app
 access:update                                  update existing collaborators on an team app
 addons                                         lists your add-ons and attachments
 addons:attach                                  attach an existing add-on resource to an app
 addons:create                                  create a new add-on resource
 addons:destroy                                 permanently destroy an add-on resource
 addons:detach                                  detach an existing add-on resource from an app
 addons:docs                                    open an add-on\'s Dev Center documentation in your browser
 addons:downgrade                               change add-on plan
 addons:info                                    show detailed add-on resource and attachment information
 addons:open                                    open an add-on\'s dashboard in your browser
 addons:plans                                   list all available plans for an add-on services
 addons:rename                                  rename an add-on
 addons:services                                list all available add-on services
 addons:upgrade                                 change add-on plan
 addons:wait                                    show provisioning status of the add-ons on the app
 apps                                           list your apps
 apps:create                                    creates a new app
 apps:destroy                                   permanently destroy an app
 apps:errors                                    view app errors
 apps:favorites                                 list favorited apps
 apps:favorites:add                             favorites an app
 apps:favorites:remove                          unfavorites an app
 apps:info                                      show detailed app information
 apps:join                                      add yourself to a team app
 apps:leave                                     remove yourself from a team app
 apps:lock                                      prevent team members from joining an app
 apps:open                                      open the app in a web browser
 apps:rename                                    rename an app
 apps:stacks                                    show the list of available stacks
 apps:stacks:set                                set the stack of an app
 apps:transfer                                  transfer applications to another user or team
 apps:unlock                                    unlock an app so any team member can join
 auth:2fa                                       check 2fa status
 auth:2fa:disable                               disables 2fa on account
 auth:login                                     login with your Heroku credentials
 auth:logout                                    clears local login credentials and invalidates API session
 auth:token                                     outputs current CLI authentication token.
 auth:whoami                                    display the current logged in user
 authorizations                                 list OAuth authorizations
 authorizations:create                          create a new OAuth authorization
 authorizations:destroy                         revoke OAuth authorization
 authorizations:info                            show an existing OAuth authorization
 authorizations:revoke                          revoke OAuth authorization
 authorizations:rotate                          updates an OAuth authorization token
 authorizations:update                          updates an OAuth authorization
 autocomplete                                   display autocomplete installation instructions
 buildpacks                                     display the buildpacks for an app
 buildpacks:add                                 add new app buildpack, inserting into list of buildpacks if necessary
 buildpacks:clear                               clear all buildpacks set on the app
 buildpacks:info                                fetch info about a buildpack
 buildpacks:remove                              remove a buildpack set on the app
 buildpacks:search                              search for buildpacks
 buildpacks:set
 buildpacks:versions                            list versions of a buildpack
 certs                                          list SSL certificates for an app
 certs:add                                      add an SSL certificate to an app
 certs:auto                                     show ACM status for an app
 certs:auto:disable                             disable ACM for an app
 certs:auto:enable                              enable ACM status for an app
 certs:auto:refresh                             refresh ACM for an app
 certs:chain                                    print an ordered & complete chain for a certificate
 certs:generate                                 generate a key and a CSR or self-signed certificate
 certs:info                                     show certificate information for an SSL certificate
 certs:key                                      print the correct key for the given certificate
 certs:remove                                   remove an SSL certificate from an app
 certs:update                                   update an SSL certificate on an app
 ci                                             display the most recent CI runs for the given pipeline
 ci:config                                      display CI config vars
 ci:config:get                                  get a CI config var
 ci:config:set                                  set CI config vars
 ci:config:unset                                unset CI config vars
 ci:debug                                       opens an interactive test debugging session with the contents of the current directory
 ci:info                                        show the status of a specific test run
 ci:last                                        looks for the most recent run and returns the output of that run
 ci:migrate-manifest                            app-ci.json is deprecated. Run this command to migrate to app.json with an environments key.
 ci:open                                        open the Dashboard version of Heroku CI
 ci:rerun                                       rerun tests against current directory
 ci:run                                         run tests against current directory
 clients                                        list your OAuth clients
 clients:create                                 create a new OAuth client
 clients:destroy                                delete client by ID
 clients:info                                   show details of an oauth client
 clients:rotate                                 rotate OAuth client secret
 clients:update                                 update OAuth client
 commands                                       list all the commands
 config                                         display the config vars for an app
 config:edit                                    interactively edit config vars
 config:get                                     display a single config value for an app
 config:remove                                  unset one or more config vars
 config:set                                     set one or more config vars
 config:unset                                   unset one or more config vars
 container                                      Use containers to build and deploy Heroku apps
 container:login                                log in to Heroku Container Registry
 container:logout                               log out from Heroku Container Registry
 container:pull                                 pulls an image from an app\'s process type
 container:push                                 builds, then pushes Docker images to deploy your Heroku app
 container:release                              Releases previously pushed Docker images to your Heroku app
 container:rm                                   remove the process type from your app
 container:run                                  builds, then runs the docker image locally
 domains                                        list domains for an app
 domains:add                                    add a domain to an app
 domains:clear                                  remove all domains from an app
 domains:info                                   show detailed information for a domain on an app
 domains:remove                                 remove a domain from an app
 domains:update                                 update a domain to use a different SSL certificate on an app
 domains:wait                                   wait for domain to be active for an app
 drains                                         display the log drains of an app
 drains:add                                     adds a log drain to an app
 drains:remove                                  removes a log drain from an app
 dyno:kill                                      stop app dyno
 dyno:resize                                    manage dyno sizes
 dyno:restart                                   restart app dynos
 dyno:scale                                     scale dyno quantity up or down
 dyno:stop                                      stop app dyno
 features                                       list available app features
 features:disable                               disables an app feature
 features:enable                                enables an app feature
 features:info                                  display information about a feature
 git:clone                                      clones a heroku app to your local machine at DIRECTORY (defaults to app name)
 git:remote                                     adds a git remote to an app repo
 help                                           Display help for heroku.
 join                                           add yourself to a team app
 keys                                           display your SSH keys
 keys:add                                       add an SSH key for a user
 keys:clear                                     remove all SSH keys for current user
 keys:remove                                    remove an SSH key from the user
 labs                                           list experimental features
 labs:disable                                   disables an experimental feature
 labs:enable                                    enables an experimental feature
 labs:info                                      show feature info
 leave                                          remove yourself from a team app
 local                                          run heroku app locally
 local:run                                      run a one-off command
 local:start                                    run heroku app locally
 local:version                                  display node-foreman version
 lock                                           prevent team members from joining an app
 login                                          login with your Heroku credentials
 logout                                         clears local login credentials and invalidates API session
 logs                                           display recent log output
 maintenance                                    display the current maintenance status of app
 maintenance:off                                take the app out of maintenance mode
 maintenance:on                                 put the app into maintenance mode
 members                                        list members of a team
 members:add                                    adds a user to a team
 members:remove                                 removes a user from a team
 members:set                                    sets a members role in a team
 notifications                                  display notifications
 orgs                                           list the teams that you are a member of
 orgs:open                                      open the team interface in a browser window
 pg                                             show database information
 pg:backups                                     list database backups
 pg:backups:cancel                              cancel an in-progress backup or restore (default newest)
 pg:backups:capture                             capture a new backup
 pg:backups:delete                              delete a backup
 pg:backups:download                            downloads database backup
 pg:backups:info                                get information about a specific backup
 pg:backups:restore                             restore a backup (default latest) to a database
 pg:backups:schedule                            schedule daily backups for given database
 pg:backups:schedules                           list backup schedule
 pg:backups:unschedule                          stop daily backups
 pg:backups:url                                 get secret but publicly accessible URL of a backup
 pg:bloat                                       show table and index bloat in your database ordered by most wasteful
 pg:blocking                                    display queries holding locks other queries are waiting to be released
 pg:connection-pooling:attach                   add an attachment to a database using connection pooling
 pg:copy                                        copy all data from source db to target
 pg:credentials                                 show information on credentials in the database
 pg:credentials:create                          create credential within database
 pg:credentials:destroy                         destroy credential within database
 pg:credentials:repair-default                  repair the permissions of the default credential within database
 pg:credentials:rotate                          rotate the database credentials
 pg:credentials:url                             show information on a database credential
 pg:diagnose                                    run or view diagnostics report
 pg:info                                        show database information
 pg:kill                                        kill a query
 pg:killall                                     terminates all connections for all credentials
 pg:links                                       lists all databases and information on link
 pg:links:create                                create a link between data stores
 pg:links:destroy                               destroys a link between data stores
 pg:locks                                       display queries with active locks
 pg:maintenance                                 show current maintenance information
 pg:maintenance:run                             start maintenance
 pg:maintenance:window                          set weekly maintenance window
 pg:outliers                                    show 10 queries that have longest execution time in aggregate
 pg:promote                                     sets DATABASE as your DATABASE_URL
 pg:ps                                          view active queries with execution time
 pg:psql                                        open a psql shell to the database
 pg:pull                                        pull Heroku database into local or remote database
 pg:push                                        push local or remote into Heroku database
 pg:reset                                       delete all data in DATABASE
 pg:settings                                    show your current database settings
 pg:settings:auto-explain                       Automatically log execution plans of queries without running EXPLAIN by hand.
 pg:settings:auto-explain:log-analyze           Shows actual run times on the execution plan.
 pg:settings:auto-explain:log-buffers           Includes buffer usage statistics when execution plans are logged.
 pg:settings:auto-explain:log-min-duration      Sets the minimum execution time in milliseconds for a statement\'s plan to be logged.
 pg:settings:auto-explain:log-nested-statements Nested statements are included in the execution plan\'s log.
 pg:settings:auto-explain:log-triggers          Includes trigger execution statistics in execution plan logs.
 pg:settings:auto-explain:log-verbose           Include verbose details in execution plans.
 pg:settings:log-lock-waits                     Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second
 pg:settings:log-min-duration-statement         The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.
 pg:settings:log-statement                      log_statement controls which SQL statements are logged.
 pg:settings:track-functions                    track_functions controls tracking of function call counts and time used. Default is none.
 pg:unfollow                                    stop a replica from following and make it a writeable database
 pg:upgrade                                     unfollow a database and upgrade it to the latest stable PostgreSQL version
 pg:vacuum-stats                                show dead rows and whether an automatic vacuum is expected to be triggered
 pg:wait                                        blocks until database is available
 pipelines                                      list pipelines you have access to
 pipelines:add                                  add this app to a pipeline
 pipelines:connect                              connect a github repo to an existing pipeline
 pipelines:create                               create a new pipeline
 pipelines:destroy                              destroy a pipeline
 pipelines:diff                                 compares the latest release of this app to its downstream app(s)
 pipelines:info                                 show list of apps in a pipeline
 pipelines:open                                 open a pipeline in dashboard
 pipelines:promote                              promote the latest release of this app to its downstream app(s)
 pipelines:remove                               remove this app from its pipeline
 pipelines:rename                               rename a pipeline
 pipelines:setup                                bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)
 pipelines:transfer                             transfer ownership of a pipeline
 pipelines:update                               update the app\'s stage in a pipeline
 plugins                                        List installed plugins.
 plugins:add                                    Installs a plugin into the CLI.
 plugins:inspect                                Displays installation properties of a plugin.
 plugins:install                                Installs a plugin into the CLI.
 plugins:link                                   Links a plugin into the CLI for development.
 plugins:remove                                 Removes a plugin from the CLI.
 plugins:uninstall                              Removes a plugin from the CLI.
 plugins:unlink                                 Removes a plugin from the CLI.
 plugins:update                                 Update installed plugins.
 ps                                             list dynos for an app
 ps:autoscale:disable                           disable web dyno autoscaling
 ps:autoscale:enable                            enable web dyno autoscaling
 ps:copy                                        Copy a file from a dyno to the local filesystem
 ps:exec                                        Create an SSH session to a dyno
 ps:forward                                     Forward traffic on a local port to a dyno
 ps:kill                                        stop app dyno
 ps:resize                                      manage dyno sizes
 ps:restart                                     restart app dynos
 ps:scale                                       scale dyno quantity up or down
 ps:socks                                       Launch a SOCKS proxy into a dyno
 ps:stop                                        stop app dyno
 ps:type                                        manage dyno sizes
 ps:wait                                        wait for all dynos to be running latest version after a release
 psql                                           open a psql shell to the database
 redis                                          gets information about redis
 redis:cli                                      opens a redis prompt
 redis:credentials                              display credentials information
 redis:info                                     gets information about redis
 redis:keyspace-notifications                   set the keyspace notifications configuration
 redis:maintenance                              manage maintenance windows
 redis:maxmemory                                set the key eviction policy
 redis:promote                                  sets DATABASE as your REDIS_URL
 redis:stats-reset                              reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)
 redis:timeout                                  set the number of seconds to wait before killing idle connections
 redis:upgrade                                  perform in-place version upgrade
 redis:wait                                     wait for Redis instance to be available
 regions                                        list available regions for deployment
 releases                                       display the releases for an app
 releases:info                                  view detailed information for a release
 releases:output                                View the release command output
 releases:rollback                              rollback to a previous release
 reviewapps:disable                             disable review apps and/or settings on an existing pipeline
 reviewapps:enable                              enable review apps and/or settings on an existing pipeline
 run                                            run a one-off process inside a heroku dyno
 run:detached                                   run a detached dyno, where output is sent to your logs
 sessions                                       list your OAuth sessions
 sessions:destroy                               delete (logout) OAuth session by ID
 spaces                                         list available spaces
 spaces:create                                  create a new space
 spaces:destroy                                 destroy a space
 spaces:info                                    show info about a space
 spaces:peering:info                            display the information necessary to initiate a peering connection
 spaces:peerings                                list peering connections for a space
 spaces:peerings:accept                         accepts a pending peering request for a private space
 spaces:peerings:destroy                        destroys an active peering connection in a private space
 spaces:ps                                      list dynos for a space
 spaces:rename                                  renames a space
 spaces:topology                                show space topology
 spaces:transfer                                transfer a space to another team
 spaces:vpn:config                              display the configuration information for VPN
 spaces:vpn:connect                             create VPN
 spaces:vpn:connections                         list the VPN Connections for a space
 spaces:vpn:destroy                             destroys VPN in a private space
 spaces:vpn:info                                display the information for VPN
 spaces:vpn:update                              update VPN
 spaces:vpn:wait                                wait for VPN Connection to be created
 spaces:wait                                    wait for a space to be created
 stack                                          show the list of available stacks
 stack:set                                      set the stack of an app
 status                                         display current status of the Heroku platform
 teams                                          list the teams that you are a member of
 trusted-ips                                    list trusted IP ranges for a space
 trusted-ips:add                                Add one range to the list of trusted IP ranges
 trusted-ips:remove                             Remove a range from the list of trusted IP ranges
 twofactor                                      check 2fa status
 twofactor:disable                              disables 2fa on account
 unlock                                         unlock an app so any team member can join
 update                                         update the heroku CLI
 version
 webhooks                                       list webhooks on an app
 webhooks:add                                   add a webhook to an app
 webhooks:deliveries                            list webhook deliveries on an app
 webhooks:deliveries:info                       info for a webhook event on an app
 webhooks:events                                list webhook events on an app
 webhooks:events:info                           info for a webhook event on an app
 webhooks:info                                  info for a webhook on an app
 webhooks:remove                                removes a webhook from an app
 webhooks:update                                updates a webhook in an app
 which                                          Show which plugin a command is in.
 whoami                                         display the current logged in user                                                                                                                      `
