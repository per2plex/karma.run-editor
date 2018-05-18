import React from 'react'
import ReactDOMServer from 'react-dom/server'

import express from 'express'
import * as path from 'path'

const cacheOptions = {maxAge: '1d'}

export interface Options {
  basePath?: string
  clientPath: string
  workerPath: string
  staticDirs?: string[]
  title?: string
  karmaURL?: string
  mediaServerURL?: string
  customClientConfig?: {[name: string]: any}
}

export function createRouter(opts: Options): express.Router {
  const title = opts.title || 'karma.run'
  const basePath = opts.basePath || ''
  const staticDirs = opts.staticDirs || []
  const customClientConfig = opts.customClientConfig || {}

  const router = express.Router()
  const reactDateTimePath = require.resolve('react-datetime')
  const draftJSPath = require.resolve('draft-js')

  const reactDateTimeCSSPath = path.join(path.dirname(reactDateTimePath), 'css/react-datetime.css')
  const draftJSCSSPath = path.join(path.dirname(draftJSPath), '../dist/Draft.css')

  staticDirs.forEach((staticDir) => {
    router.use(`${basePath}/static`, express.static(staticDir, cacheOptions))
  })

  router.get(`${basePath}/css/react-datetime.css`, (_, res) => {
    res.sendFile(reactDateTimeCSSPath, cacheOptions)
  })

  router.get(`${basePath}/css/draft-js.css`, (_, res) => {
    res.sendFile(draftJSCSSPath, cacheOptions)
  })

  router.get(`${basePath}/js/worker.js`, (_, res) => {
    res.sendFile(opts.workerPath, cacheOptions)
  })

  router.get(`${basePath}/js/main.js`, (_, res) => {
    res.sendFile(opts.clientPath, cacheOptions)
  })

  router.get(`${basePath}/js/worker.js.map`, (_, res) => {
    res.sendFile(opts.workerPath + '.map', cacheOptions)
  })

  router.get(`${basePath}/js/main.js.map`, (_, res) => {
    res.sendFile(opts.clientPath + '.map', cacheOptions)
  })

  router.get(`${basePath}(/*)?`, (_, res) => {
    const configJSON = JSON.stringify({
      custom: customClientConfig,
      title,
      basePath,
      KARMA_API_URL: opts.karmaURL,
      KARMA_MEDIA_SERVER_URL: opts.mediaServerURL
    })

    const stream = ReactDOMServer.renderToStaticNodeStream(
      <html>
        <head>
          <title>{title}</title>

          <link href={`${basePath}/css/draft-js.css`} rel='stylesheet' />
          <link href={`${basePath}/css/react-datetime.css`} rel='stylesheet' />
          <link href='https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i' rel='stylesheet' />

          <script id='Config' type='application/json' dangerouslySetInnerHTML={{__html: configJSON}}/>
          <script src={`${basePath}/js/main.js`} defer />
        </head>
        <body>
          <div id='EditorRoot'></div>
        </body>
      </html>
    )

    res.write('<!DOCTYPE html>')
    stream.pipe(res)
  })

  return router
}
