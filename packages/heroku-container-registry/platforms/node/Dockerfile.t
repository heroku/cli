FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV NODE_ENGINE <%= node_engine %>
ENV PORT 3000

RUN mkdir -p /app/heroku/node
RUN curl -s https://s3pository.heroku.com/node/v$NODE_ENGINE/node-v$NODE_ENGINE-linux-x64.tar.gz | tar --strip-components=1 -xz -C /app/heroku/node
ENV PATH /app/heroku/node/bin:$PATH

ONBUILD RUN mkdir -p /app/src
ONBUILD WORKDIR /app/src
ONBUILD COPY . /app/src

ONBUILD RUN npm install

ONBUILD RUN mkdir -p /app/.profile.d
ONBUILD RUN echo "export PATH=\"/app/heroku/node/bin:/app/bin:/app/node_modules/.bin:\$PATH\"" > /app/.profile.d/nodejs.sh
ONBUILD RUN echo "cd /app/src" >> /app/.profile.d/nodejs.sh

ONBUILD EXPOSE 3000
