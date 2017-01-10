const EventEmitter = require('events');
const noble = require('noble');
const debug = require('debug')('miflora');
const DeviceData = require('./lib/device-data');

const DEFAULT_DEVICE_NAME          = 'Flower mate';
const DATA_SERVICE_UUID            = '0000120400001000800000805f9b34fb';
const DATA_CHARACTERISTIC_UUID     = '00001a0100001000800000805f9b34fb';
const FIRMWARE_CHARACTERISTIC_UUID = '00001a0200001000800000805f9b34fb';
const REALTIME_CHARACTERISTIC_UUID = '00001a0000001000800000805f9b34fb';
const REALTIME_META_VALUE          = Buffer.from([0xA0, 0x1F]);

const SERVICE_UUIDS        = [DATA_SERVICE_UUID];
const CHARACTERISTIC_UUIDS = [DATA_CHARACTERISTIC_UUID, FIRMWARE_CHARACTERISTIC_UUID, REALTIME_CHARACTERISTIC_UUID];

class MiFlora extends EventEmitter {
  constructor(macAddress) {
    super();
    this._macAddress = macAddress;
    this._deviceData = new Array();
    noble.on('discover', this.discover.bind(this));
  }

  discover(peripheral) {
    debug("device discovered: ", peripheral.advertisement.localName);
    if(this._macAddress != undefined) {
      if (this._macAddress.toLowerCase() == peripheral.address.toLowerCase()) {
        debug("trying to connect mi flora, living at %s", this._macAddress);
        // start listening the specific device
        this.connectDevice(peripheral);
      }
    } else if (peripheral.advertisement.localName == DEFAULT_DEVICE_NAME) {
      debug('no mac address specified, trying to connect available mi flora...');
      // start listening found device
      this.connectDevice(peripheral);
    }
  }

  connectDevice(peripheral) {
    // prevent simultanious connection to the same device
    if(peripheral.state === 'disconnected') {
      peripheral.connect();
      peripheral.once('connect', function() {
        this.listenDevice(peripheral, this);
      }.bind(this));
    }
  }

  listenDevice(peripheral, context) {
    peripheral.discoverSomeServicesAndCharacteristics(SERVICE_UUIDS, CHARACTERISTIC_UUIDS, function(error, services, characteristics) {
      characteristics.forEach(function(characteristic) {
        // data
        if (characteristic.uuid == DATA_CHARACTERISTIC_UUID) {
          debug('found characteristics uuid: %s', characteristics.uuid);
          characteristic.read(function(error, data) {
            debug("uuid:", characteristic.uuid, "data:", data);
            context.parseData(peripheral, data);
          });
        }
        // firmware & battery
        if (characteristic.uuid == FIRMWARE_CHARACTERISTIC_UUID) {
          characteristic.read(function(error, data) {
            debug("firmware data uuid:", characteristic.uuid, "data:", data);
            let firmware = {
              batteryLevel: parseInt(data.toString('hex', 0, 1), 16),
              firmwareVersion: data.toString('ascii', 2, data.length)
            }
            context.emit('firmware', firmware);
          });
        }
        // realtime
        if (characteristic.uuid == REALTIME_CHARACTERISTIC_UUID) {
          debug('enabling realtime');
          characteristic.write(REALTIME_META_VALUE, true);
        }
      });
    });
  }

  parseData(peripheral, data) {
    let temperature = data.readUInt16LE(0) / 10,
        lux         = data.readUInt32LE(3),
        moisture    = data.readUInt16BE(6),
        fertility   = data.readUInt16LE(8),
        deviceData  = new DeviceData(peripheral.id,
                                     temperature,
                                     lux,
                                     moisture,
                                     fertility);

    debug("temperature: %s °C", temperature);
    debug("Light: %s lux", lux);
    debug("moisture: %s %", moisture);
    debug("fertility: %s µS/cm", fertility);

    if(this._deviceData[peripheral.id] && this._deviceData[peripheral.id].equal(deviceData)) {
      debug("same content with the previous one", deviceData);
    } else {
      this._deviceData[peripheral.id] = deviceData
      this.emit('data', deviceData);
    }
  }

  startScanning() {
    noble.on('stateChange', function(state) {
      if (state === 'poweredOn') {
        noble.startScanning([], true);
      }
    });
  }

  stopScanning() {
    noble.stopScanning();
  }
}

module.exports = MiFlora;