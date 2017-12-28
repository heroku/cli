FROM node:9

MAINTAINER Jeff Dickey

RUN curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

CMD heroku
