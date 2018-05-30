FROM node:latest

MAINTAINER Jeff Dickey

RUN curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

CMD heroku
