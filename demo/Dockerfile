FROM tomcat:8.5

ARG GEOLADRIS_APP=demo

COPY . /tmp/${GEOLADRIS_APP}

RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-8-jdk-headless maven \
	&& rm -rf /var/lib/apt/lists/*

RUN mvn clean package -f /tmp/${GEOLADRIS_APP}/pom.xml \
  && cp /tmp/${GEOLADRIS_APP}/target/${GEOLADRIS_APP}.war /usr/local/tomcat/webapps/${GEOLADRIS_APP}.war
