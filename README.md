# node-mi-flora

Node package for Xiaomi Mi Flora Plant Sensor

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

> This package is under development. Use it on your own risk until the stable version is out.

## Installation
```sh
npm install node-mi-flora
```
## Basic Usage
```js
const MiFlora = require('node-mi-flora');

let flora = new MiFlora(); // initialize flora

// start scanning
flora.startScanning();

// set an interval to rescan & get fresh data
setInterval(function () {
  console.log('every 15 seconds, rescan devices');
  flora.startScanning();
}, 15000);

// stop scanning
flora.stopScanning();
```

## Events
### Data
When data available, it publishes DeviceData object which contains temperature, lux, moisture, and fertility.
```js
flora.on('data', function (data) {
  console.log('data', data);
  // print DeviceData { deviceId: '1111', temperature: 25.2, lux: 5142, moisture: 46, fertility: 0 }
});
```
### Firmware & Battery
When data available, it publishes plain object which contains firmware and battery values.
```js
flora.on('firmware', function (data) {
  console.log('firmware', data);
  // print { deviceId: '1111', batteryLevel: 82, firmwareVersion: '2.6.2' }
});
```

## Notes
- debug mode
```DEBUG=miflora node examples/basic.js```

- if you having trouble running the script on raspberry pi,
run ```sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)```. This grants the ```node``` binary ```cap_net_raw privileges```, so it can start/stop BLE advertising without sudo. [source](https://github.com/sandeepmistry/noble#running-without-rootsudo)

- use it with strict mode
```node --use_strict examples/basic.js```
