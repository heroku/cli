FROM ubuntu:14.04

RUN apt-get update && \
  apt-get -y install build-essential nsis cowsay jq git && \
  rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/heroku/cli

ENTRYPOINT ["make"]
CMD ["all"]
