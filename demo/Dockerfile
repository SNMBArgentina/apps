FROM tomcat:8.5

ARG MAVEN_VERSION=3.5.0
ARG GEOLADRIS_APP=demo

COPY . /tmp/${GEOLADRIS_APP}

RUN curl -fsSL -o /tmp/maven.tar.gz https://apache.osuosl.org/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
  && mkdir /tmp/maven \
  && tar -xzf /tmp/maven.tar.gz -C /tmp/maven --strip-components=1 \
  && rm /tmp/maven.tar.gz \
  && /tmp/maven/bin/mvn package -f /tmp/${GEOLADRIS_APP}/pom.xml \
  && rm -rf /tmp/maven \
  && cp /tmp/${GEOLADRIS_APP}/target/${GEOLADRIS_APP}.war /usr/local/tomcat/webapps/${GEOLADRIS_APP}.war

