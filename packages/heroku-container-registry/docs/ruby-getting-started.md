# Ruby Getting Started

## Set up your environment

Get the project:

```
git clone https://github.com/heroku/ruby-getting-started
cd https://github.com/heroku/ruby-getting-started
```

Ensure that you can connect to Docker in this shell:

```
docker ps
```

## Create a Dockerfile

```
heroku docker:init
```

Heroku-Docker will automatically detect that this project is a Ruby app.

## Work locally with Docker

At this point, you have several available commands.

For example,
you could immediately build the project in Docker and release it to Heroku:

```
heroku create
heroku addons:add heroku-postgresql
heroku docker:release
heroku run bundle exec rake db:migrate
heroku open
```

You can also run the server locally in a Dockerized version of Heroku's
Cedar-14 stack:

```
heroku docker:start
heroku docker:open
```

Finally, you could open a shell in Docker to manipulate the project with
commands like `bundle install`:

```
heroku docker:exec bash
```

...or run such commands directly:

```
heroku docker:exec bundle install
```
