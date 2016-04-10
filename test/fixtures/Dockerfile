FROM ubuntu:14.04

RUN apt-get update; apt-get upgrade -y; apt-get clean
RUN apt-get update && apt-get install -y --fix-missing curl ruby
ARG CACHEBUST=1
RUN curl -s https://s3.amazonaws.com/assets.heroku.com/heroku-client/heroku-client.tgz | tar xz
RUN ./heroku-client/bin/heroku version
