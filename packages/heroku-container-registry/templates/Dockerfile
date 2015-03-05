FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV PATH /app/.heroku/node/bin:$PATH
ENV ENGINES_NODE <%= engines_node %>

RUN mkdir -p .heroku
RUN curl -s http://s3pository.heroku.com/node/v$NODE_ENGINE/node-v$NODE_ENGINE-linux-x64.tar.gz | tar xvz -C .heroku
RUN mv .heroku/node-v$NODE_ENGINE-linux-x64 .heroku/node
