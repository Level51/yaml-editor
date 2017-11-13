# Yaml Editor
Yaml Editor based on [electron-vue](https://github.com/SimulatedGREG/electron-vue).

## Development

#### Build Setup
``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:9080
yarn run dev
```

## Build
[electron-builder](https://www.electron.build/) is used for building.

``` bash
# build (only current environment)
yarn run build

# build for all environments -l(inux) -w(indows) -m(ac) if supported
node .electron-vue/build.js && electron-builder -mwl
```