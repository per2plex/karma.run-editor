import Raven from 'raven-js'
import { Editor } from '@karma.run/editor-client'

const editor = new Editor()

editor.on('configLoaded', (config) => {
  if (config.custom.sentryURL) {
    Raven.config(config.custom.sentryURL, {
      release: process.env.VERSION,
      environment: process.env.NODE_ENV
    }).install()
  }
})

editor.attach()
