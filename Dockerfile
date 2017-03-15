FROM node:7
MAINTAINER Jeff Dickey <dickeyxxx@gmail.com>

RUN apt-get -y update && \
    apt-get install -y --no-install-recommends \
    ocaml libelf-dev \
    python-pip python-dev build-essential \
    p7zip-full \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && \
    pip install --upgrade virtualenv && \
    pip install --upgrade awscli

RUN cd && \
    curl -fL http://cli-assets.heroku.com/heroku-cli/channels/beta/heroku-cli-linux-x64.tar.xz | tar Jx && \
    mv heroku* /usr/local/lib/heroku && \
    ln -s /usr/local/lib/heroku/bin/heroku /usr/local/bin/heroku

CMD bash
