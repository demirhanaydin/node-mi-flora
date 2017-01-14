const MiFlora = require('../index');

let flora = new MiFlora();

flora.startScanning();

flora.on('data', function (data) {
  console.log('data', data);
});

flora.on('firmware', function (data) {
  console.log('firmware', data);
});

setInterval(function () {
  console.log('every 15 seconds, rescan devices');
  flora.startScanning();
}, 15000);
