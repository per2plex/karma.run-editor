import fs from 'fs'
import path from 'path'

import express from 'express'
import compression from 'compression'
import editorMiddleware from '@karma.run/editor-server'
import webpack from 'webpack'

import {loadPlugins, loadConfig} from './helper'

export const defaultPort = 3000

export interface RunCommandOptions {
  cwd?: string
  karmaDataURL?: string
  config?: string
  require?: string
  port: number
  plugins?: string[]
}

const staticPath = path.resolve(__dirname, '../../client')

export default async function runCommand(opts: RunCommandOptions): Promise<void> {
  const config = await loadConfig(opts)
  const karmaDataURL = process.env.KARMA_DATA_URL || opts.karmaDataURL || config.karmaDataURL

  if (!karmaDataURL) {
    console.error('No karma.data URL specified, set it via environment, CLI or config.')
    return process.exit(1)
  }

  const port = process.env.PORT
    ? parseInt(process.env.PORT)
    : opts.port || config.port || defaultPort

  // TODO: Move into separate command
  const plugins = loadPlugins([...(opts.plugins || []), ...(config.plugins || [])])
  const clientModules = plugins.map(plugin => plugin.clientModule)

  const entryFile = `
        import {Editor} from '@karma.run/editor-client'

        const editor = new Editor({
          plugins: [${clientModules.map(module => `require(${JSON.stringify(module)})`)}]
        })

        editor.attach()
      `

  fs.mkdirSync(path.resolve(process.cwd(), '.cache'))
  const tempPath = path.resolve(process.cwd(), './.cache/client.js')
  fs.writeFileSync(tempPath, entryFile)

  const compiler = webpack({
    entry: tempPath,

    mode: process.env.NODE_ENV || 'development',
    output: {
      path: path.resolve(__dirname, '../../client/'),
      publicPath: '/static/'
    }
  } as webpack.Configuration)

  compiler.run((err, stats) => {
    if (err) return console.error(err)
    process.stdout.write(stats.toString({colors: true}) + '\n')
  })

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

  app.get('/api/status', (_, res) => {
    res.status(200).send({status: 'OK'}) // TODO: Move into middleware
  })

  app.use(
    editorMiddleware({
      modulesPath: staticPath,
      clientModule: path.resolve(staticPath, './main.js'),
      workerModule: path.resolve(staticPath, './worker.js'),
      favicon: path.resolve(staticPath, './favicon.ico'),
      karmaDataURL
    })
  )

  app.listen(port, () => {
    console.log('Server running at localhost:' + port)
  })
}
