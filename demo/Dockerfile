FROM tomcat:8.5

ARG REPO=snapshots
ARG APP_NAME=demo
ARG APP_VERSION=7.0.0-SNAPSHOT

ENV GEOLADRIS_CONFIG_DIR /var/geoladris

RUN wget http://nullisland.geomati.co:8082/repository/snapshots/org/geoladris/apps/${APP_NAME}/${APP_VERSION}/${APP_NAME}-${APP_VERSION}.war -O /usr/local/tomcat/webapps/${APP_NAME}.war

