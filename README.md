**Deprecated**

Please refer to https://github.com/appium/appium/tree/master/packages/doctor

appium-doctor
===================
Attempts to diagnose and fix common Node, iOS and Android configuration issues before starting Appium.

[![Build Status](https://travis-ci.org/appium/appium-doctor.svg?branch=master)](https://travis-ci.org/appium/appium-doctor)

### Install

```
npm install appium-doctor -g
```

### Usage

```
➜  appium-doctor -h

Usage: appium-doctor.js [options, defaults: --ios --android]

Options:
  --ios       Check iOS setup                             [boolean]
  --android   Check Android setup                         [boolean]
  --dev       Check dev setup                             [boolean]
  --debug     Show debug messages                         [boolean]
  --yes       Always respond yes                          [boolean]
  --no        Always respond no                           [boolean]
  --demo      Run appium-doctor demo (for dev).           [boolean]
  -h, --help  Show help                                   [boolean]
```

## Dev

## Watch

```
npm run watch
```

## Test

```
npm test
```

## Hack Cli

Use the `--demo` option to simulate the fix process.

```
appium-doctor --demo
```
