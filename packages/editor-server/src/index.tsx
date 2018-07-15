/**
 * @module @karma.run/editor-server
 * @license MIT
 *
 * Copyright (c) 2018, karma.run AG.
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import path from 'path'
import express from 'express'

import {ServerPlugin, PluginTuple} from '@karma.run/editor-common'

const cacheOptions = {maxAge: '1d'}

export interface MiddlewareOptions {
  title?: string
  basePath?: string
  karmaDataURL: string

  bundlePublicPath: string
  clientName: string
  workerName: string

  favicon: string
  plugins?: ServerPlugin[]
}

export function editorMiddleware(opts: MiddlewareOptions): express.Router {
  const title = opts.title || 'karma.data - editor'
  const basePath = opts.basePath || ''

  const router = express.Router()
  const reactDateTimePath = require.resolve('react-datetime')
  const draftJSPath = require.resolve('draft-js')

  const reactDateTimeCSSPath = path.join(path.dirname(reactDateTimePath), 'css/react-datetime.css')
  const draftJSCSSPath = path.join(path.dirname(draftJSPath), '../dist/Draft.css')

  router.get(`${basePath}/css/react-datetime.css`, (_, res) => {
    return res.sendFile(reactDateTimeCSSPath, cacheOptions)
  })

  router.get(`${basePath}/css/draft-js.css`, (_, res) => {
    return res.sendFile(draftJSCSSPath, cacheOptions)
  })

  router.use(
    `${basePath}/static`,
    express.static(opts.bundlePublicPath, {
      index: false,
      ...cacheOptions
    })
  )

  router.use(`${basePath}/static`, (_, res) => {
    return res.status(404).send()
  })

  router.get(`${basePath}/static/favicon.ico`, (_, res) => {
    return res.sendFile(opts.favicon, cacheOptions)
  })

  const clientPlugins: PluginTuple[] = []

  if (opts.plugins && opts.plugins.length) {
    for (const plugin of opts.plugins) {
      plugin.initialize({router})
      console.info(`Initialized plugin: ${plugin.name}@${plugin.version}`)
    }
  }

  if (opts.bundlePublicPath) {
  }

  router.get(`${basePath}(/*)?`, (_, res) => {
    const configJSON = JSON.stringify({
      title,
      basePath,
      karmaDataURL: opts.karmaDataURL,
      workerURL: `/static/worker.js`,
      plugins: clientPlugins
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

          <script src={`${basePath}/static/${opts.clientName}`} defer />
        </head>
        <body>
          <div id="EditorRoot" />
        </body>
      </html>
    )

    res.write('<!DOCTYPE html>')
    return stream.pipe(res)
  })

  return router
}

export default editorMiddleware
