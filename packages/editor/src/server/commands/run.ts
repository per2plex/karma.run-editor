import * as path from 'path'
import express from 'express'
import compression from 'compression'
import editorMiddleware from '@karma.run/editor-server'
import {ObjectMap, ServerPlugin} from '@karma.run/editor-common'

const Liftoff = require('liftoff')
const interpret = require('interpret')

export const defaultPort = 3000

export interface Configuration {
  port?: number
  karmaDataURL?: string
  plugins?: (ServerPlugin | string)[]
}

export interface RunCommandOptions {
  cwd?: string
  karmaDataURL?: string
  config?: string
  require?: string
  port: number
  plugins?: string[]
}

export interface LiftoffEnvironment {
  cwd: string
  require: string[]
  configNameSearch: string[]
  configPath: string
  configBase: string
  configFiles: string[]
  modulePackage: any
}

// Include .config in extensions
const extensions = Object.entries(interpret.jsVariants).reduce(
  (acc, [key, value]) => {
    acc[`.config${key}`] = value
    return acc
  },
  {} as ObjectMap<any>
)

export function loadPlugins(plugins: (ServerPlugin | string)[]): ServerPlugin[] {
  return plugins.map(plugin => {
    if (typeof plugin === 'string') {
      try {
        const module = require(plugin)

        if (typeof module === 'function') {
          return new module()
        }

        return new module.default()
      } catch (err) {
        return process.exit(1)
      }
    }

    return plugin
  })
}

export default function runCommand(opts: RunCommandOptions) {
  const configLoader = new Liftoff({
    name: 'test',
    configName: 'editor', // Extension includes .config so full name is editor.config.*
    extensions: extensions
  })
    .on('require', (name: string) => {
      console.log('Preloading module:', name)
    })
    .on('requireFail', (name: string, err: Error) => {
      console.log('Unable to preload:', name, err)
    })

  configLoader.launch(
    {
      cwd: opts.cwd,
      configPath: opts.config,
      require: opts.require
    },
    (env: LiftoffEnvironment): void => {
      let config: Configuration = {}
      if (env.configPath) config = require(env.configPath).default

      if (process.cwd() !== env.cwd) {
        process.chdir(env.cwd)
        console.info('Working directory changed to', env.cwd)
      }

      const karmaDataURL = process.env.KARMA_DATA_URL || opts.karmaDataURL || config.karmaDataURL

      if (!karmaDataURL) {
        console.error('No karma.data URL specified, set it via environment, CLI or config.')
        return process.exit(1)
      }

      const port = process.env.PORT
        ? parseInt(process.env.PORT)
        : opts.port || config.port || defaultPort

      const plugins = loadPlugins([...(opts.plugins || []), ...(config.plugins || [])])

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
          clientModule: path.resolve(__dirname, '../static/main.js'),
          workerModule: path.resolve(__dirname, '../static/worker.js'),
          favicon: path.resolve(__dirname, '../../static/favicon.ico'),
          karmaDataURL,
          plugins
        })
      )

      app.listen(port, () => {
        console.log('Server running at localhost:' + port)
      })
    }
  )
}
