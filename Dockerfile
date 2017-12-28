FROM ubuntu:16.04

MAINTAINER Jeff Dickey

RUN apt-get -y update && apt-get install -y --no-install-recommends \
  wget \
  curl \
  ca-certificates \
  && \
  curl https://cli-assets.heroku.com/install-ubuntu.sh | sh && \
  apt-get -y remove curl wget && apt-get clean && apt-get -y autoremove && \
  rm -rf /var/lib/apt/lists/*

CMD heroku
