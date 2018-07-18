import express from 'express'
import compression from 'compression'
import editorMiddleware from '@karma.run/editor-server'

import {loadPlugins, loadConfig, build, getCachedBuild, watchBuild, getCachePath} from './helper'

export const defaultPort = 3000

export interface RunCommandOptions {
  cwd?: string
  karmaDataURL?: string
  watch?: boolean
  config?: string
  require?: string
  port: number
  plugins?: string[]
}

export default async function runCommand(opts: RunCommandOptions): Promise<void> {
  const config = await loadConfig(opts)
  const karmaDataURL = process.env.KARMA_DATA_URL || opts.karmaDataURL || config.karmaDataURL

  if (!karmaDataURL) {
    console.error('No karma.data URL specified, set it via environment, CLI option or config.')
    return process.exit(1)
  }

  const port = process.env.PORT
    ? parseInt(process.env.PORT)
    : opts.port || config.port || defaultPort

  const plugins = loadPlugins([...(opts.plugins || []), ...(config.plugins || [])])
  const cachePath = getCachePath()

  let clientBundlePath: string | undefined

  if (opts.watch) {
    console.info('Watching bundle...')
    clientBundlePath = await watchBuild(cachePath, {plugins}, (err, stats) => {
      if (err) return console.error(err.message)
      process.stdout.write(stats.toString({colors: true}) + '\n')
    })
  } else {
    clientBundlePath = await getCachedBuild(cachePath, {plugins})

    if (!clientBundlePath) {
      try {
        console.info('Building bundle...')
        const {path, stats} = await build(cachePath, {plugins})
        process.stdout.write(stats.toString({colors: true}) + '\n')
        clientBundlePath = path
      } catch (err) {
        console.error(`Coulnd't build bundle: ${err.message}`)
        process.exit(1)
      }
    }
  }

  const app = express()
  app.disable('x-powered-by')

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
    res.status(200).send({status: 'OK'}) // TODO: Move into middleware
  })

  app.use(
    editorMiddleware({
      bundlePublicPath: clientBundlePath!,
      clientName: 'index.js',
      workerName: 'worker.js',
      favicon: '../../static/favicon.ico',
      karmaDataURL,
      editorContextsForRoles: config.editorContexts,
      viewContextsForRoles: config.viewContexts,
      plugins
    })
  )

  app.listen(port, () => {
    console.log('Server running at localhost:' + port)
  })
}

// TODO: Move to plugin
// if (
//   process.env.CLOUDINARY_CLOUD_NAME &&
//   process.env.CLOUDINARY_API_KEY &&
//   process.env.CLOUDINARY_API_SECRET
// ) {
//   app.use(
//     '/api/media',
//     editorMediaMiddleware({
//       karmaURL: process.env.KARMA_URL || process.env.KARMA_API_URL || karmaURL,
//       hostname: '/api/media',
//       backend: new CloudinaryBackend({
//         cloudName: process.env.CLOUDINARY_CLOUD_NAME,
//         folder: process.env.CLOUDINARY_FOLDER,
//         apiKey: process.env.CLOUDINARY_API_KEY,
//         apiSecret: process.env.CLOUDINARY_API_SECRET
//       })
//     })
//   )
// }
