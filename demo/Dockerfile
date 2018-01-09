FROM tomcat:8.5

ENV APP /tmp/geoladris-app

COPY . ${APP}

RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-8-jdk-headless maven \
  && mvn clean package -f ${APP}/pom.xml \
  && rm -rf /usr/local/tomcat/webapps/ROOT \
  && cp ${APP}/target/*.war /usr/local/tomcat/webapps/ROOT.war \
  && apt-get purge -y openjdk-8-jdk-headless maven \
  && apt-get autoremove -y \
  && apt-get autoclean -y \
  && rm -rf ${APP} ~/.m2 /var/lib/apt/lists/*

