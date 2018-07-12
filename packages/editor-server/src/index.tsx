/**
 * @module @karma.run/editor-server
 * @license MIT
 *
 * Copyright (c) 2018, karma.run AG.
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import {ServerPlugin} from '@karma.run/editor-common'

import express from 'express'
import * as path from 'path'

const cacheOptions = {maxAge: '1d'}

export interface MiddlewareOptions {
  title?: string
  basePath?: string
  karmaDataURL: string
  clientModule: string
  workerModule: string
  favicon: string
  plugins?: ServerPlugin[]
}

export function editorMiddleware(opts: MiddlewareOptions): express.Router {
  const title = opts.title || 'karma.tools/editor'
  const basePath = opts.basePath || ''

  const router = express.Router()
  const reactDateTimePath = require.resolve('react-datetime')
  const draftJSPath = require.resolve('draft-js')

  const reactDateTimeCSSPath = path.join(path.dirname(reactDateTimePath), 'css/react-datetime.css')
  const draftJSCSSPath = path.join(path.dirname(draftJSPath), '../dist/Draft.css')

  router.get(`${basePath}/css/react-datetime.css`, (_, res) => {
    res.sendFile(reactDateTimeCSSPath, cacheOptions)
  })

  router.get(`${basePath}/css/draft-js.css`, (_, res) => {
    res.sendFile(draftJSCSSPath, cacheOptions)
  })

  router.get(`${basePath}/static/client.js`, (_, res) => {
    res.sendFile(opts.clientModule)
  })

  router.get(`${basePath}/static/worker.js`, (_, res) => {
    res.sendFile(opts.workerModule)
  })

  router.get(`${basePath}/static/favicon.ico`, (_, res) => {
    res.sendFile(opts.favicon)
  })

  router.get(`${basePath}(/*)?`, (_, res) => {
    const configJSON = JSON.stringify({
      title,
      basePath,
      karmaDataURL: opts.karmaDataURL
    })

    const stream = ReactDOMServer.renderToStaticNodeStream(
      <html>
        <head>
          <title>{title}</title>

          <link href={`${basePath}/static/favicon.ico`} rel="icon" type="image/x-icon" />
          <link href={`${basePath}/css/draft-js.css`} rel="stylesheet" />
          <link href={`${basePath}/css/react-datetime.css`} rel="stylesheet" />
          <link
            href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i"
            rel="stylesheet"
          />

          <script
            id="Config"
            type="application/json"
            dangerouslySetInnerHTML={{__html: configJSON}}
          />

          <script src={`${basePath}/static/client.js`} defer />
        </head>
        <body>
          <div id="EditorRoot" />
        </body>
      </html>
    )

    res.write('<!DOCTYPE html>')
    stream.pipe(res)
  })

  if (opts.plugins && opts.plugins.length) {
    for (const plugin of opts.plugins) {
      plugin.initialize({router})
    }
  }

  return router
}

export default editorMiddleware
