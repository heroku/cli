FROM node:8.0.0
MAINTAINER Jeff Dickey <jeff@heroku.com>

RUN apt-get -y update && \
  apt-get install -y --no-install-recommends \
  apt-utils \
  ocaml libelf-dev \
  python-pip python-dev build-essential \
  p7zip-full \
  && apt-get clean && \
  rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && \
      pip install --upgrade virtualenv && \
      pip install --upgrade awscli

ENV PATH="${PATH}:./node_modules/.bin"

CMD bash
