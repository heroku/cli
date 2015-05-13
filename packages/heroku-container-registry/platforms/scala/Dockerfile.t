FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app/src

ENV HOME /app
ENV PATH /app/bin:/app/.jdk/bin:$PATH
ENV JAVA_HOME /app/.jdk:$PATH
ENV PORT 3000

RUN mkdir -p /app/.jdk
RUN mkdir -p /app/.profile.d
RUN curl -s -L <%= jdk_url %> | tar xz -C /app/.jdk

RUN mkdir -p /app/bin
RUN curl -s -L https://raw.githubusercontent.com/paulp/sbt-extras/master/sbt -o /app/bin/sbt
RUN chmod +x /app/bin/sbt

ONBUILD COPY target /app/src/target

ONBUILD USER root
ONBUILD RUN chown -R app /app/src/target
ONBUILD USER app

ONBUILD EXPOSE 3000
