FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV PATH /app/heroku/jdk/bin:$PATH
ENV APP_NAME <%= app_name %>
ENV PORT 3000

RUN mkdir -p /app/heroku/jdk
RUN mkdir -p /app/.profile.d
RUN curl -s http://lang-jvm.s3.amazonaws.com/jdk/openjdk1.8.0_40-cedar14.tar.gz | tar xz -C /app/heroku/jdk
RUN echo "export JAVA_HOME=\"/app/heroku/jdk" > /app/.profile.d/jdk.sh
RUN echo "export PATH=\"/app/heroku/jdk/bin:\$PATH" >> /app/.profile.d/jdk.sh

ONBUILD COPY target /app/target

ONBUILD USER root
ONBUILD RUN chown -R app /app/target
ONBUILD USER app

ONBUILD EXPOSE 3000
