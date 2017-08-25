# apps
[![Build Status](https://travis-ci.org/geoladris/apps.svg?branch=master)](https://travis-ci.org/geoladris/apps)

## Tests de integración

Para ejecutar los tests de integración es necesario utilizar de manera explícita el profile de Maven `integration-tests`:

```
mvn verify -Pintegration-tests
```

Además, para que los tests de integración puedan pasar correctamente es necesario:

* Establecer la variable de entorno `GEOLADRIS_EMAIL_PASSWORD`. La contraseña es privada y sólo la conocen los principales desarrolladores de Geoladris.
* Configurar una base de datos PostGIS en local con puerto 5432 y credenciales `docker:docker`. Para ello se puede utilizar el siguiente comando:

```
docker run -d -p 5432:5432 --name=postgis kartoza/postgis
```
