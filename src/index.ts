import {EventEmitter} from 'events';
import * as noble from '@abandonware/noble';
import {Peripheral} from '@abandonware/noble';
import {
    DEFAULT_DEVICE_NAME,
    MAC_ADDRESS, MiFloraFirmwareEvent,
    MiFloraUUIDs,
    NobleEvents,
    NoblePeripheralEvents, NodeMiFloraEvents,
    PeripheralStates
} from "./types";
import {DeviceData} from "./lib/device-data";
import {debug, Debugger} from 'debug';

const REALTIME_META_VALUE: Buffer = Buffer.from([0xA0, 0x1F]);
const SERVICE_UUIDS: MiFloraUUIDs[] = [MiFloraUUIDs.DATA_SERVICE_UUID];
const CHARACTERISTIC_UUIDS: MiFloraUUIDs[] = [MiFloraUUIDs.DATA_CHARACTERISTIC_UUID,
    MiFloraUUIDs.FIRMWARE_CHARACTERISTIC_UUID,
    MiFloraUUIDs.REALTIME_CHARACTERISTIC_UUID];
const NAMESPACE = 'miflora';

export class MiFlora extends EventEmitter {

    private readonly noble: typeof noble;

    private readonly debugger: Debugger;

    constructor(private readonly macAddress?: MAC_ADDRESS) {
        super();
        this.noble = noble;
        this.debugger = debug(NAMESPACE);
        noble.on(NobleEvents.DISCOVER, this.discover.bind(this));
    }

    discover(peripheral: Peripheral) {
        this.debugger.log('device discovered: ', peripheral.advertisement.localName);
        if (this.macAddress !== undefined) {
            if (this.macAddress.toLowerCase() === peripheral.address.toLowerCase()) {
                this.debugger('trying to connect mi flora, living at %s', this.macAddress);
                // start listening the specific device
                this.connectDevice(peripheral);
            }
        } else if (peripheral.advertisement.localName === DEFAULT_DEVICE_NAME) {
            this.debugger.log('no mac address specified, trying to connect available mi flora...');
            // start listening found device
            this.connectDevice(peripheral);
        }
    }

    private connectDevice(peripheral: Peripheral) {
        // prevent simultaneous connection to the same device
        if (peripheral.state === PeripheralStates.DISCONNECTED) {
            peripheral.connect();
            peripheral.once(NoblePeripheralEvents.CONNECT, () => {
                this.listenDevice(peripheral);
            });
        }
    }

    private listenDevice(peripheral: Peripheral) {
        peripheral.discoverSomeServicesAndCharacteristics(SERVICE_UUIDS, CHARACTERISTIC_UUIDS,
            (error, services, characteristics) => {
                characteristics.forEach((characteristic) => {
                    switch (characteristic.uuid) {
                        case MiFloraUUIDs.DATA_CHARACTERISTIC_UUID:
                            characteristic.read((error, data) => {
                                this.parseData(peripheral, data);
                            });
                            break;
                        case MiFloraUUIDs.FIRMWARE_CHARACTERISTIC_UUID:
                            characteristic.read((error, data) => {
                                this.parseFirmwareData(peripheral, data);
                            });
                            break;
                        case MiFloraUUIDs.REALTIME_CHARACTERISTIC_UUID:
                            this.debugger.log('enabling realtime');
                            characteristic.write(REALTIME_META_VALUE, false);
                            break;
                        default:
                            this.debugger('found characteristic uuid %s but not matched the criteria',
                                characteristic.uuid);
                    }
                });
            }
        );
    }

    private parseData(peripheral: Peripheral, data: Buffer) {
        this.debugger.log('data:', data);
        const temperature = data.readUInt16LE(0) / 10;
        const lux = data.readUInt32LE(3);
        const moisture = data.readUInt16BE(6);
        const fertility = data.readUInt16LE(8);
        const deviceData = new DeviceData(peripheral.id,
            temperature,
            lux,
            moisture,
            fertility);

        this.debugger('temperature: %s °C', temperature);
        this.debugger('Light: %s lux', lux);
        this.debugger('moisture: %s %', moisture);
        this.debugger('fertility: %s µS/cm', fertility);

        this.emit(NodeMiFloraEvents.DATA, deviceData);
    }

    private parseFirmwareData(peripheral: Peripheral, data: Buffer) {
        this.debugger.log('firmware data:', data);
        let firmware: MiFloraFirmwareEvent = {
            deviceId: peripheral.id,
            batteryLevel: parseInt(data.toString('hex', 0, 1), 16),
            firmwareVersion: data.toString('ascii', 2, data.length)
        };
        this.emit(NodeMiFloraEvents.FIRMWARE, firmware);
    }

    startScanning() {
        if (noble.state === 'poweredOn') {
            noble.startScanning([], true);
        } else {
            // bind event to start scanning
            noble.on(NobleEvents.STATE_CHANGE, (state) => {
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
