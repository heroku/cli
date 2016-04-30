FROM ubuntu:14.04

RUN apt-get update && apt-get upgrade -y && \
  apt-get -y install \
  autoconf \
  automake \
  build-essential \
  cowsay \
  curl \
  git \
  jq \
  libcurl4-openssl-dev \
  libssl-dev \
  nsis \
  openssl \
  python-pip \
  python-dev \
  && rm -rf /var/lib/apt/lists/*

# install go
ENV HOME=/root \
    GOLANG_VERSION=1.6.2 \
    GOLANG_DOWNLOAD_URL=https://golang.org/dl/go1.6.2.linux-amd64.tar.gz \
    GOLANG_DOWNLOAD_SHA256=e40c36ae71756198478624ed1bb4ce17597b3c19d243f3f0899bb5740d56212a
RUN curl -fsSL "$GOLANG_DOWNLOAD_URL" -o golang.tar.gz \
  && echo "$GOLANG_DOWNLOAD_SHA256  golang.tar.gz" | sha256sum -c - \
  && tar -C /usr/local -xzf golang.tar.gz \
  && rm golang.tar.gz

# osslsigncode
RUN curl -fsSLo osslsigncode-1.7.1.tar.gz https://cli-assets.heroku.com/osslsigncode-1.7.1.tar.gz && \
    tar -xvzf osslsigncode-1.7.1.tar.gz && cd osslsigncode-1.7.1 && \
    ./configure && make && make install && cd .. rm -rf osslsigncode-1.7.1

# python/aws
RUN pip install --upgrade pip && \
    pip install awscli

# setup repo
RUN mkdir -p $HOME/src/github.com/heroku && git clone https://github.com/heroku/cli $HOME/src/github.com/heroku/cli
WORKDIR $HOME/src/github.com/heroku/cli

ENV GOPATH=$HOME \
  PATH=$HOME/src/github.com/heroku/cli/tmp/dev/heroku/lib:$GOPATH/bin:/usr/local/go/bin:$PATH

RUN git checkout dev
RUN make deps build test -j4

COPY run run
ENTRYPOINT ["./run"]
