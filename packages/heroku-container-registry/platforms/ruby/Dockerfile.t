FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV PATH /app/heroku/ruby/bin:$PATH
ENV RUBY_ENGINE <%= ruby_engine %>
ENV PORT 3000

RUN mkdir -p /app/heroku/ruby
RUN mkdir -p /app/src
RUN mkdir -p /app/.profile.d
RUN curl -s https://s3-external-1.amazonaws.com/heroku-buildpack-ruby/cedar-14/ruby-$RUBY_ENGINE.tgz | tar xvz -C /app/heroku/ruby
RUN echo "export PATH=\"/app/heroku/ruby/bin:/app/bin" > /app/.profile.d/ruby.sh
RUN echo "cd /app/src" >> /app/.profile.d/ruby.sh

WORKDIR /app/src

ONBUILD COPY . /app/src
ONBUILD RUN gem install bundler
ONBUILD RUN bundle install
ONBUILD EXPOSE 3000
ONBUILD CMD rackup -p $PORT -o 0.0.0.0
