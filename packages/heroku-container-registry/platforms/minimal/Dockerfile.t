FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV PORT 3000

RUN mkdir -p /app/heroku
RUN mkdir -p /app/src
RUN mkdir -p /app/.profile.d

WORKDIR /app/src

ONBUILD COPY . /app/src
ONBUILD EXPOSE 3000
