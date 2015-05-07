FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV RUBY_ENGINE <%= ruby_engine %>
ENV BUNDLER_VERSION 1.7.12
ENV NODE_ENGINE 0.10.38
ENV PORT 3000

RUN mkdir -p /app/heroku/ruby
RUN curl -s https://s3-external-1.amazonaws.com/heroku-buildpack-ruby/cedar-14/ruby-$RUBY_ENGINE.tgz | tar xz -C /app/heroku/ruby
ENV PATH /app/heroku/ruby/bin:$PATH

RUN mkdir -p /app/heroku/bundler
RUN mkdir -p /app/src/vendor/bundle
RUN curl -s https://s3-external-1.amazonaws.com/heroku-buildpack-ruby/bundler-$BUNDLER_VERSION.tgz | tar xz -C /app/heroku/bundler
ENV PATH /app/heroku/bundler/bin:$PATH
ENV GEM_PATH=/app/heroku/bundler:$GEM_PATH
ENV GEM_HOME=/app/src/vendor/bundle

RUN mkdir -p /app/heroku/node
RUN curl -s https://s3pository.heroku.com/node/v$NODE_ENGINE/node-v$NODE_ENGINE-linux-x64.tar.gz | tar --strip-components=1 -xz -C /app/heroku/node
ENV PATH /app/heroku/node/bin:$PATH
WORKDIR /app/src

ONBUILD COPY Gemfile /app/src/
ONBUILD COPY Gemfile.lock /app/src/

ONBUILD USER root
ONBUILD RUN chown app /app/src/Gemfile* # ensure user can modify the Gemfile.lock
ONBUILD USER app

ONBUILD RUN bundle install # TODO: desirable if --path parameter were passed

ONBUILD COPY . /app/src

ONBUILD USER root
ONBUILD RUN chown -R app /app
ONBUILD USER app

ONBUILD RUN mkdir -p /app/.profile.d
ONBUILD RUN echo "export PATH=\"/app/heroku/ruby/bin:/app/heroku/bundler/bin:/app/heroku/node/bin:\$PATH\"" > /app/.profile.d/ruby.sh
ONBUILD RUN echo "export GEM_PATH=\"/app/heroku/bundler:/app/heroku/src/vendor/bundle:\$GEM_PATH\"" >> /app/.profile.d/ruby.sh
ONBUILD RUN echo "export GEM_HOME=\"/app/src/vendor/bundle\"" >> /app/.profile.d/ruby.sh

ONBUILD RUN echo "cd /app/src" >> /app/.profile.d/ruby.sh

ONBUILD EXPOSE 3000
