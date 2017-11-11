<template>
    <div class="container">

        <div class="actions">
          <button @click="loadFile">Datei öffnen</button>
          <button @click="save" v-if="mainFile">Speichern</button>
          <button @click="reset" v-if="mainFile">Reset</button>
        </div>

        <div v-if="mainFile">
            <div v-for="(values, namespace) in mainFile.values" :key="namespace">
                <div class="namespace">
                  <h2>{{ namespace }}</h2>
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

  .actions {
    display: flex;
    margin-bottom: 20px;

    > button {
      margin-right: 10px;
    }
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