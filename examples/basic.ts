import {MiFlora} from "../src";
import {MiFloraDataEvent, MiFloraFirmwareEvent, NodeMiFloraEvents} from "../src/types";

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
