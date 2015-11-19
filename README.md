# Test App for WebBluetooth APIs of Firefox OS

## How to install

1. Clone the project and build it.

```sh
$> git clone https://github.com/fxos-bt-squad/webbluetooth-test-app path/to/webbluetooth-test-app
```

2. Build the app.

```sh
$> cd path/to/webbluetooth-test-app
$> npm install
$> ./node_modules/bower/bin/bower install
```

3. Symbolically link path/to/webbluetooth-test-app into
   path/to/gaia/outoftree\_apps folder.

```sh
$> cd path/to/gaia
$> mkdir outoftree_apps  # create outoftree_apps folder if you don't have one
$> cd outoftree_apps
$> ln -s path/to/webbluetooth-test-app webbluetooth-test-app
```

4. Build gaia in engineer build, you'll have this app installed in your
   runtime or device.

## Development

* Prerequisite
  - [Node.JS](https://nodejs.org/)
  - [npm](https://www.npmjs.com/)

* Install dependency node.js modules.

```sh
$> npm install
```

* Downloads dependency bower packages.

```sh
$> ./node_modules/bower/bin/bower install
```

* Lint source codes.

```sh
$> ./node_modules/gulp/bin/gulp lint
```

## Reference

[WebBluetooth-v2 wiki](https://wiki.mozilla.org/B2G/Bluetooth/WebBluetooth-v2)
