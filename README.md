# Yaml Editor
Yaml Editor based on [electron-vue](https://github.com/SimulatedGREG/electron-vue).  
Currently only usefull for editing yml based language files used within [SilverStripe](https://github.com/silverstripe) projects. 

## Features
- Edit language yml files with [js-yaml](https://github.com/SimulatedGREG/electron-vue)
- Each value can be edited within it's own textarea, optional "side-by-side" for multiple languages
- Ensures valid yml syntax on write
- Sort files by their keys
- Search files by namespaces, keys and values

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