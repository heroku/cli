FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV PATH /app/heroku/node/bin:$PATH
ENV NODE_ENGINE <%= node_engine %>
ENV PORT 3000

RUN mkdir -p /app/heroku
RUN mkdir -p /app/src
RUN mkdir -p /app/.profile.d
RUN curl -s http://s3pository.heroku.com/node/v$NODE_ENGINE/node-v$NODE_ENGINE-linux-x64.tar.gz | tar xvz -C /tmp
RUN mv /tmp/node-v$NODE_ENGINE-linux-x64 /app/heroku/node
RUN echo "export PATH=\"/app/heroku/node/bin:/app/bin:/app/node_modules/.bin:\$PATH\"" > /app/.profile.d/nodejs.sh
RUN echo "cd /app/src" >> /app/.profile.d/nodejs.sh

WORKDIR /app/src

ONBUILD COPY . /app/src
ONBUILD RUN npm install
ONBUILD EXPOSE 3000
ONBUILD CMD [ "npm", "start" ]
