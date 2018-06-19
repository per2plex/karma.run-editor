/**
 * @module @karma.run/editor-server
 * @license MIT
 *
 * Copyright (c) 2018, karma.run AG.
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import express from 'express'
import * as path from 'path'

const cacheOptions = {maxAge: '1d'}

export interface Options {
  basePath?: string
  mediaAPIBasePath?: string
  staticPath: string
  clientName?: string
  workerName?: string
  title?: string
  karmaURL?: string
  mediaServerURL?: string
  customClientConfig?: {[name: string]: any}
}

export function editorMiddleware(opts: Options): express.Router {
  const title = opts.title || 'karma.run'
  const basePath = opts.basePath || ''
  const mediaAPIBasePath = opts.mediaAPIBasePath || ''
  const customClientConfig = opts.customClientConfig || {}

  const staticPath = opts.staticPath
  const clientName = opts.clientName || 'main.js'
  const workerName = opts.workerName || 'worker.js'

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

  router.use(
    `${basePath}/static`,
    express.static(staticPath, {
      index: false
    })
  )

  router.get(`${basePath}(/*)?`, (_, res) => {
    const configJSON = JSON.stringify({
      custom: customClientConfig,
      title,
      basePath,
      mediaAPIBasePath,
      karmaURL: opts.karmaURL,
      workerName
    })

    const stream = ReactDOMServer.renderToStaticNodeStream(
      <html>
        <head>
          <title>{title}</title>

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
          <script src={`${basePath}/static/${clientName}`} defer />
        </head>
        <body>
          <div id="EditorRoot" />
        </body>
      </html>
    )

    res.write('<!DOCTYPE html>')
    stream.pipe(res)
  })

  return router
}

export default editorMiddleware
