## Geoladris Demo

This is an application showing most of the Geoladris functionality (from [core](https://github.com/geoladris/core) and [plugins](https://github.com/geoladris/core)). See [doc](https://geoladris.github.io/doc/) for more details about Geoladris.

You can either [download and install](https://geoladris.github.io/doc/user/quickstart/) the app or use a Docker image:

```
docker run -p 8080:8080 --name=geoladris-demo geoladris-demo
```

To use an external configuration directory, mount your [configuration directory](https://geoladris.github.io/doc/user/config/#directorio-de-configuracion) as a volume in `/var/geoladris`:

```
docker run -p 8080:8080 -v <geoladris_config_dir>:/var/geoladris --name=geoladris-demo geoladris-demo
```
