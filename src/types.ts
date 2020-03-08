export type MAC_ADDRESS = string;

export enum PeripheralStates {
    ERROR = 'error',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTING = 'disconnecting',
    DISCONNECTED = 'disconnected'
}

export enum NobleEvents {
    STATE_CHANGE = "stateChange",
    SCAN_START = "scanStart",
    SCAN_STOP = "scanStop",
    DISCOVER = "discover"
}

export enum NoblePeripheralEvents {
    CONNECT = 'connect'
}

export enum MiFloraUUIDs {
    DATA_SERVICE_UUID = '0000120400001000800000805f9b34fb',
    DATA_CHARACTERISTIC_UUID = '00001a0100001000800000805f9b34fb',
    FIRMWARE_CHARACTERISTIC_UUID = '00001a0200001000800000805f9b34fb',
    REALTIME_CHARACTERISTIC_UUID = '00001a0000001000800000805f9b34fb'
}

export const DEFAULT_DEVICE_NAME: string = 'Flower care';

export enum NodeMiFloraEvents {
    DATA = 'data',
    FIRMWARE = 'firmware'
}
