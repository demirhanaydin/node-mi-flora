# node-mi-flora

Node package for Xiaomi Mi Flora Plant Sensor

> This package is under development. Use it on your own risk until the stable version is out.

## Installation
```sh
npm install ts-mi-flora
```
## Basic Usage
```typescript
import {MiFlora} from 'ts-mi-flora';
import { NodeMiFloraEvents, MiFloraDataEvent, MiFloraFirmwareEvent } from 'ts-mi-flora/dist/types';

const flora = new MiFlora();

flora.startScanning();

flora.on(NodeMiFloraEvents.DATA, (data: MiFloraDataEvent) => {
    console.log('data', data);
});

flora.on(NodeMiFloraEvents.FIRMWARE, (data: MiFloraFirmwareEvent) => {
    console.log('firmware', data);
});

setInterval(() => {
    console.log('every 15 seconds, rescan devices');
    flora.startScanning();
}, 15000);
```

## Events
### Data
When data available, it publishes DeviceData object which contains temperature, lux, moisture, and fertility.
```typescript
flora.on(NodeMiFloraEvents.DATA, (data: MiFloraDataEvent) => {
  console.log('data', data);
  // print DeviceData { deviceId: '1111', temperature: 25.2, lux: 5142, moisture: 46, fertility: 0 }
});
```
### Firmware & Battery
When data available, it publishes plain object which contains firmware and battery values.
```typescript
flora.on(NodeMiFloraEvents.FIRMWARE, (data: MiFloraFirmwareEvent) => {
  console.log('firmware', data);
  // print { deviceId: '1111', batteryLevel: 82, firmwareVersion: '2.6.2' }
});
```

## Notes
- debug mode
```DEBUG=miflora ts-node examples/basic.ts```

- if you having trouble running the script on raspberry pi,
run ```sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)```. This grants the ```node``` binary ```cap_net_raw privileges```, so it can start/stop BLE advertising without sudo. [source](https://github.com/sandeepmistry/noble#running-without-rootsudo)

- use it with strict mode
```ts-node --use_strict examples/basic.ts```

- if your flora's firmware version is older than 2.8.6, please install [v0.1.0](https://github.com/demirhanaydin/node-mi-flora/tree/v0.1.0)
