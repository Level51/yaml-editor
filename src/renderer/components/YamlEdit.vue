<template>
    <div>
      <header>
        <div class="actions">
          <button @click="loadFile">Datei öffnen</button>
          <button @click="save" v-if="mainFile">Speichern</button>
          <button @click="reset" v-if="mainFile">Reset</button>
        </div>
      </header>

      <main>
        <div class="container">
          <div v-if="mainFile">
              <div v-for="(values, namespace) in mainFile.values" :key="namespace">
                  <div class="namespace">
                    <h2>
                      {{ namespace | splitCamelCase }}
                    </h2>
                    <div class="field" v-for="(value, key) in values" :key="key">
                        <label>{{ key }}</label>
                        <div class="input">
                          <span>{{ mainFile.lang }}</span>
                          <input type="text" :value="value" v-model="mainFile['values'][namespace][key]">
                        </div>

                        <div v-if="hasOtherFiles">
                          <div v-for="otherFile in otherFiles" :key="otherFile.lang">
                            <div class="input">
                              <span>{{ otherFile.lang }}</span>
                              <input type="text" :value="otherFile.values[namespace][key]" v-model="otherFile.values[namespace][key]">
                            </div>
                          </div>
                        </div>
                    </div>
                  </div>
              </div>
            </div>
            <div v-else>
              keine Dateien geladen
            </div>
        </div>
      </main>
    </div>
</template>

<script>
import fs from 'fs'
import yaml from 'js-yaml'
import { remote } from 'electron'
import Vue from 'vue'
import _ from 'lodash'

export default {
  data () {
    return {
      mainFile: null,
      otherFiles: {}
    }
  },
  computed: {
    hasOtherFiles () {
      return Object.keys(this.otherFiles).length > 0
    }
  },
  filters: {
    splitCamelCase (value) {
      return value.replace(/([A-Z])/g, ' $1')
    }
  },
  methods: {
    reset () {
      this.mainFile = null
      this.otherFiles = {}
    },
    save () {
      fs.writeFileSync(this.mainFile.path, yaml.safeDump({
        [this.mainFile.lang]: this.mainFile.values
      }))

      if (this.hasOtherFiles) {
        _.forEach(this.otherFiles, file => {
          fs.writeFileSync(file.path, yaml.safeDump({
            [file.lang]: file.values
          }))
        })
      }
    },
    loadFile () {
      let path = remote.dialog.showOpenDialog()
      if (path) {
        try {
          let doc = yaml.safeLoad(fs.readFileSync(path[0], 'utf8'))
          let lang = Object.keys(doc)[0]

          if (!this.mainFile) {
            this.mainFile = Object.assign({}, this.mainFile, {
              lang,
              path: path[0],
              values: doc[lang]
            })
          } else {
            Vue.set(this.otherFiles, lang, {
              lang,
              path: path[0],
              values: doc[lang]
            })
          }
        } catch (e) {
          console.log(e)
        }
      }
    }
  }
}
</script>

<style lang="scss">
  body {
    background: #f5f5f5;
  }

  header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding: 10px;
    background: #ddd;
    border-bottom: 2px solid #999;
  }

  .actions {
    display: flex;
    justify-content: center;

    > button {
      margin-right: 10px;
      border: 0;
      background: $color-main;
      border-radius: 5px;
      padding: 10px 20px;
      color: #fff;
      transition: background-color 250ms ease-in-out;
      outline: 0;

      &:hover {
        background-color: lighten($color-main, 10);
      }
    }
  }

  main {
    padding-top: 75px;
  }

  .container {
    padding: 20px;
  }

  .namespace {
    margin-bottom: 30px;
    h2 {
      margin-bottom: 20px;
    }

    .field {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 10px;
      }

      div.input {
        margin-bottom: 10px;

        span {
          margin-right: 5px;
        }
      }

      input {
        width: 300px;
        height: 30px;
        border-radius: 3px;
        border: 1px solid #999;
        box-shadow: none;
        padding: 0 10px;
      }
    }
  }
</style>
