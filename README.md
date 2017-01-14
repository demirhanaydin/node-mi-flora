# node-mi-flora

Node package for Xiaomi Mi Flora Plant Sensor

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

> This package is under development. Use it on your own risk until the stable version is out.

## Installation
## Basic Usage

## Notes
- debug mode
```DEBUG=miflora node examples/basic.js```

- if you having trouble running the script on raspberry pi

run ```sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)```. This grants the node binary cap_net_raw privileges, so it can start/stop BLE advertising without sudo. [source](https://github.com/sandeepmistry/noble#running-without-rootsudo)

