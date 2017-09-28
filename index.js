const EventEmitter = require('events');
const noble = require('noble');
const debug = require('debug')('miflora');
const DeviceData = require('./lib/device-data');

const DATA_SERVICE_UUID = '0000120400001000800000805f9b34fb';
const DATA_CHARACTERISTIC_UUID = '00001a0100001000800000805f9b34fb';
const FIRMWARE_CHARACTERISTIC_UUID = '00001a0200001000800000805f9b34fb';
const REALTIME_CHARACTERISTIC_UUID = '00001a0000001000800000805f9b34fb';

const defaultOpts = {
  DEFAULT_DEVICE_NAME: 'Flower mate',
  DATA_SERVICE_UUID: DATA_SERVICE_UUID,
  DATA_CHARACTERISTIC_UUID: DATA_CHARACTERISTIC_UUID,
  FIRMWARE_CHARACTERISTIC_UUID: FIRMWARE_CHARACTERISTIC_UUID,
  REALTIME_CHARACTERISTIC_UUID: REALTIME_CHARACTERISTIC_UUID,
  REALTIME_META_VALUE: Buffer.from([0xA0, 0x1F]),
  SERVICE_UUIDS: [DATA_SERVICE_UUID],
  CHARACTERISTIC_UUIDS: [DATA_CHARACTERISTIC_UUID, FIRMWARE_CHARACTERISTIC_UUID, REALTIME_CHARACTERISTIC_UUID],
};

class MiFlora extends EventEmitter {
  constructor(macAddress, opts) {
    super();
    this.noble = noble;
    this.options = Object.assign(defaultOpts, opts);
    this._macAddress = macAddress;
    noble.on('discover', (per) => this.discover(per));
  }

  discover(peripheral) {
    debug('device discovered: ', peripheral.advertisement.localName);
    if (this._macAddress) {
      if (this._macAddress.toLowerCase() === peripheral.address.toLowerCase()) {
        debug('trying to connect mi flora, living at %s', this._macAddress);
        // start listening the specific device
        this.connectDevice(peripheral);
      }
    } else if (peripheral.advertisement.localName === this.options.DEFAULT_DEVICE_NAME) {
      debug('no mac address specified, trying to connect available mi flora...');
      // start listening found device
      this.connectDevice(peripheral);
    }
  }

  connectDevice(peripheral) {
    // prevent simultanious connection to the same device
    if (peripheral.state === 'disconnected') {
      peripheral.connect();
      peripheral.once('connect', () => {
        this.listenDevice(peripheral, this);
      });
    }
  }

  listenDevice(peripheral, context) {
    peripheral.discoverSomeServicesAndCharacteristics(this.options.SERVICE_UUIDS, this.options.CHARACTERISTIC_UUIDS, (error, services, characteristics) => {
      characteristics.forEach((characteristic) => {
        switch (characteristic.uuid) {
          case this.options.DATA_CHARACTERISTIC_UUID:
            characteristic.read((error, data) => {
              context.parseData(peripheral, data);
            });
            break;
          case this.options.FIRMWARE_CHARACTERISTIC_UUID:
            characteristic.read((error, data) => {
              context.parseFirmwareData(peripheral, data);
            });
            break;
          case this.options.REALTIME_CHARACTERISTIC_UUID:
            debug('enabling realtime');
            characteristic.write(this.options.REALTIME_META_VALUE, true);
            break;
          default:
            debug('found characteristic uuid %s but not matched the criteria', characteristic.uuid);
        }
      });
    });
  }

  parseData(peripheral, data) {
    debug('data:', data);
    let temperature = data.readUInt16LE(0) / 10;
    let lux = data.readUInt32LE(3);
    let moisture = data.readUInt16BE(6);
    let fertility = data.readUInt16LE(8);
    let deviceData = new DeviceData(peripheral.id,
      temperature,
      lux,
      moisture,
      fertility);

    debug('temperature: %s °C', temperature);
    debug('Light: %s lux', lux);
    debug('moisture: %s %', moisture);
    debug('fertility: %s µS/cm', fertility);

    this.emit('data', deviceData);
  }

  parseFirmwareData(peripheral, data) {
    debug('firmware data:', data);
    let firmware = {
      deviceId: peripheral.id,
      batteryLevel: parseInt(data.toString('hex', 0, 1), 16),
      firmwareVersion: data.toString('ascii', 2, data.length)
    };
    this.emit('firmware', firmware);
  }

  startScanning() {
    debug('BT state', noble.state);
    if (noble.state === 'poweredOn') {
      noble.startScanning([], true);
    } else {
      // bind event to start scanning
      noble.on('BT stateChange', (state) => {
        debug('noble state change', state);
        if (state === 'poweredOn') {
          noble.startScanning([], true);
        }
      });
    }
  }

  stopScanning() {
    noble.stopScanning();
  }
}

module.exports = MiFlora;
