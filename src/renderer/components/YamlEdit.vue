<template>
    <div>
      <header>
        <div class="actions">
          <button @click="loadFile()" v-if="!mainFile">
            <i class="fa fa-folder-open-o"></i> Datei öffnen
          </button>
          <button @click="loadOtherFile()" v-if="mainFile">
            <i class="fa fa-folder-open-o"></i> zusätzl. Datei öffnen
          </button>
          <button @click="save()" v-if="mainFile">
            <i class="fa fa-floppy-o"></i> Speichern
          </button>
          <button @click="reset()" v-if="mainFile">
            <i class="fa fa-eraser"></i> Reset
          </button>
          <button @click="sort()" v-if="mainFile">
            <i class="fa fa-sort-alpha-asc"></i> Sortieren
          </button>
        </div>
        <div class="actions" v-if="mainFile">
          <input type="search" v-model="searchTerm" placeholder="Suchen">
        </div>
      </header>

      <main>
        <div class="container">
          <div v-if="mainFile">
              <div v-for="(values, namespace) in mainValues" :key="namespace" class="namespace">
                <h2>
                  {{ namespace | splitCamelCase }}
                </h2>
                <div class="field" v-for="(value, key) in values" :key="key">
                    <label>{{ key }}</label>
                    <div>
                      <div class="input">
                        <span>{{ mainFile.lang }}</span>
                        <textarea :value="value" v-model="mainFile['values'][namespace][key]" cols="75" rows="1"></textarea>
                      </div>

                      <template v-if="hasOtherFiles">
                        <div v-for="otherFile in otherFiles" :key="otherFile.lang" class="input">
                          <span>{{ otherFile.lang }}</span>
                          <textarea :value="otherFile.values[namespace][key]" v-model="otherFile.values[namespace][key]" cols="75" rows="1"></textarea>
                        </div>
                      </template>
                    </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-screen">
              <p>keine Dateien geladen</p>
            </div>
        </div>
      </main>

      <notifications position="bottom center" :speed="750" />

      <div id="drag-over-container" v-if="dragOver">
        <div>
          <i class="fa fa-cloud-upload"></i>
        </div>
      </div>
    </div>
</template>

<script>
import fs from 'fs'
import yaml from 'js-yaml'
import { remote } from 'electron'
import Vue from 'vue'
import _ from 'lodash'
import Notifications from 'vue-notification'

Vue.use(Notifications)

window._ = _

export default {
  data () {
    return {
      mainFile: null,
      otherFiles: {},
      notifications: [],
      dragOver: false,
      searchTerm: null
    }
  },
  mounted () {
    let timeout

    document.ondragover = (ev) => {
      clearTimeout(timeout)
      ev.preventDefault()
      this.dragOver = true
    }

    document.ondragleave = (ev) => {
      timeout = setTimeout(() => {
        this.dragOver = false
      }, 100)
    }

    document.body.ondrop = (ev) => {
      ev.preventDefault()
      this.dragOver = false
      ev.preventDefault()

      if (this.mainFile === null) {
        this.loadFile(ev.dataTransfer.files[0].path)
      } else {
        this.loadOtherFile(ev.dataTransfer.files[0].path)
      }
    }

    document.onkeydown = (ev) => {
      if (this.mainFile && ev.which === 83 && (ev.metaKey || ev.ctrlKey)) {
        this.save()
      }

      if (ev.which === 78 && (ev.metaKey || ev.ctrlKey)) {
        if (!this.mainFile) {
          this.loadFile()
        } else {
          this.loadOtherFile()
        }
      }
    }
  },
  computed: {
    hasOtherFiles () {
      return Object.keys(this.otherFiles).length > 0
    },
    mainValues () {
      if (!this.mainFile) {
        return null
      }

      if (!this.searchTerm || this.searchTerm.length < 3) {
        return this.mainFile.values
      }

      let result = {}
      const searchTerm = this.searchTerm.toLowerCase()
      _.forEach(this.mainFile.values, (values, namespace) => {
        if (namespace.toLowerCase().indexOf(searchTerm) !== -1) {
          result[namespace] = values
        }

        _.forEach(values, (value, key) => {
          if (key.toLowerCase().indexOf(searchTerm) !== -1 || value.toLowerCase().indexOf(searchTerm) !== -1) {
            if (!result.hasOwnProperty(namespace)) {
              result[namespace] = {}
            }
            result[namespace][key] = value
          }
        })
      })
      return result
    }
  },
  filters: {
    splitCamelCase (value) {
      return value.replace(/([A-Z])/g, ' $1')
    }
  },
  methods: {

    /**
     * Create and show a small notification
     *
     * @param title Title of the notification
     * @param message Optional a additional message
     * @param type Notification type, available are 'success', 'error' and 'warn'
     */
    createNotification (title, message = null, type = 'success') {
      this.$notify({
        type,
        duration: 3000,
        title,
        text: message
      })
    },

    /**
     * Reset open files
     */
    reset () {
      this.mainFile = null
      this.otherFiles = {}
    },

    /**
     * Save/dump yaml all open files
     */
    save (sortKeys = false) {
      fs.writeFileSync(this.mainFile.path, yaml.safeDump({
        [this.mainFile.lang]: this.mainFile.values
      }, {
        sortKeys
      }))

      if (this.hasOtherFiles) {
        _.forEach(this.otherFiles, file => {
          fs.writeFileSync(file.path, yaml.safeDump({
            [file.lang]: file.values
          }, {
            sortKeys
          }))
        })
      }

      this.createNotification('Gespeichert')
    },

    /**
     * Show a file open dialog and load/parse the yml file if selected.
     */
    doLoadFile () {
      let path = remote.dialog.showOpenDialog(null, {
        filters: [
          {name: 'Yaml File', extensions: ['yml']}
        ]
      })

      if (path) {
        return this.loadFileFromPath(path[0])
      }
    },

    /**
     * Load and parse the yml file from the given path.
     */
    loadFileFromPath (path) {
      try {
        let doc = yaml.safeLoad(fs.readFileSync(path, 'utf8'))
        let lang = Object.keys(doc)[0]

        return {
          doc,
          lang,
          path
        }
      } catch (e) {
        this.createNotification('Could not load file', e.reason, 'error')
        return null
      }
    },

    /**
     * Load main language file
     */
    loadFile (fromPath) {
      let result = typeof fromPath === 'string' ? this.loadFileFromPath(fromPath) : this.doLoadFile()

      if (result !== null && !_.isUndefined(result)) {
        let {doc, lang, path} = result

        if (!_.isUndefined(path) && !_.isUndefined(doc)) {
          this.mainFile = Object.assign({}, this.mainFile, {
            lang,
            path: path,
            values: doc[lang]
          })
        }
      }
    },

    /**
     * Load additional language files with the same namespaces/keys for translations
     */
    loadOtherFile (fromPath) {
      let {doc, lang, path} = typeof fromPath === 'string' ? this.loadFileFromPath(fromPath) : this.doLoadFile()

      Vue.set(this.otherFiles, lang, {
        lang,
        path: path,
        values: Object.assign({}, _.clone(this.mainFile.values), doc[lang])
      })
    },

    sort () {
      this.save(true)
      this.loadFile(this.mainFile.path)
      _.forEach(this.otherFiles, file => {
        this.loadOtherFile(file.path)
      })
    }
  }
}
</script>

<style lang="scss">
  @import '../../../node_modules/font-awesome/css/font-awesome.css';

  body {
    background: $color-light-grey;;
  }

  header {
    position: fixed;
    z-index: 9090;
    top: 0;
    left: 0;
    width: 100%;
    padding: 10px;
    background: #ddd;
    border-bottom: 2px solid $color-middle-grey;;
  }

  .actions {
    display: flex;
    justify-content: center;

    &:not(:first-child) {
      margin-top: 10px;
    }

    > button {
      margin-right: 10px;
      border: 0;
      background: $color-main;
      border-radius: 5px;
      padding: 10px 20px;
      color: #fff;
      transition: background-color 250ms ease-in-out;
      outline: 0;

      i {
        margin-right: 5px;
      }

      &:hover {
        background-color: lighten($color-main, 10);
      }
    }

    input[type="search"] {
      -webkit-appearance: none;
      padding: 5px 10px;
      border-radius: 3px;
      border: 1px solid $color-middle-grey;;
      box-shadow: none;
      width: 200px;
    }
  }

  main {
    padding-top: 100px;
  }

  .container {
    padding: 0 20px;
  }

  .namespace {
    margin-bottom: 30px;

    h2 {
      margin: 40px 0 20px;
      padding: 40px 0 0;
    }

    &:first-child {
      h2 {
        margin-top: 0;
        padding-top: 0;
      }
    }

    &:not(:first-child) {
      h2 {
        border-top: 1px solid $color-middle-grey;
      }
    }

    .field {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 10px;
      }

      div.input {
        margin-bottom: 10px;
        position: relative;
        
        input, textarea {
          padding-left: 40px;
        }

        span {
          position: absolute;
          left: 0;
          line-height: 32px;
          padding: 0 10px;
          border-right: 1px solid $color-middle-grey;
          font-size: 12px;
          color: $color-middle-grey;
          height: 100%;
        }
      }

      input, textarea {
        border-radius: 3px;
        border: 1px solid $color-middle-grey;;
        box-shadow: none;
        padding: 0 10px;
      }

      input {
        width: 300px;
        height: 30px;
      }

      textarea {
        resize: vertical;
        display: block;
        padding: 8px 10px 8px 40px;
      }
    }
  }

  .notifications {
    .notification {
      cursor: pointer;
    }
  }

  #drag-over-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.3);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
    color: $color-middle-grey;

    i {
      font-size: 100px;
    }
  }

  .empty-screen {
    text-align: center;
    color: $color-middle-grey;
    font-size: 30px;
  }
</style>
