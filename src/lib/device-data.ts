export class DeviceData {

    constructor(private readonly deviceId: string,
                private readonly temperature: number,
                private readonly lux: number,
                private readonly moisture: number,
                private readonly fertility: number) {
    }

    toString() {
        return JSON.stringify(this.getJSON());
    }

    getJSON() {
        return {
            deviceId: this.deviceId,
            temperature: this.temperature,
            lux: this.lux,
            moisture: this.moisture,
            fertility: this.fertility
        }
    }

    equal(deviceData) {
        return this.toString() === deviceData.toString();
    }
}
