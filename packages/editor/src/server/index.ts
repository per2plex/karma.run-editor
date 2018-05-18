#!/usr/bin/env node
import * as path from 'path'
import express from 'express'
import compression from 'compression'
import { createRouter } from '@karma.run/editor-server'

const app = express()
const port = Number(process.env.PORT) || 3000

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_REQUESTS !== 'true') {
  app.use((req, res, next) => {
    if (req.get('X-Forwarded-Proto') === 'http') {
      res.redirect('https://' + req.headers.host + req.url)
      return
    }

    res.setHeader('Content-Security-Policy', 'upgrade-insecure-requests')
    res.setHeader('X-Content-Security-Policy', 'upgrade-insecure-requests')

    return next()
  })
}

app.use(compression())

app.get('/api/status', (_, res) => {
  res.status(200).send({status: 'OK'})
})

app.get('/favicon.ico', (_, res) => {
  res.sendFile(path.join(__dirname, '../../static/favicon.ico'))
})

app.use(createRouter({
  clientPath: path.join(__dirname, '../client/main.js'),
  workerPath: path.join(__dirname, '../client/worker.js'),
  karmaURL: process.env.KARMA_API_URL,
  mediaServerURL: process.env.KARMA_MEDIA_SERVER_URL,
  customClientConfig: {
    sentryURL: process.env.SENTRY_API_URL
  }
}))

app.listen(port, () => {
  console.log('Server running at localhost:' + port)
})
