import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import util from 'util'
import mkdirp from 'mkdirp'
import findupSync from 'findup-sync'

import {ServerPlugin} from '@karma.run/editor-server'
import {ServerConfiguration} from '../interface'

const mkdirpPromise = util.promisify(mkdirp)

export function findServerConfig(): string | undefined {
  return findupSync('editor.server.config.{js,ts,tsx}')
}

export function findClientConfig(): string | undefined {
  return findupSync('editor.client.config.{js,ts,tsx}')
}

export function findConfigsIfNeededAndSetCWD(serverConfigPath?: string, clientConfigPath?: string) {
  if (!serverConfigPath) serverConfigPath = findServerConfig()
  if (!clientConfigPath) clientConfigPath = findClientConfig()

  if (serverConfigPath && clientConfigPath) {
    if (path.dirname(serverConfigPath) !== path.dirname(clientConfigPath)) {
      console.warn(
        'Server and client config are not in the same directory, working directory will be set to server config location!'
      )
    }
  }

  if (clientConfigPath) {
    console.info(`Client config path: ${clientConfigPath}`)
  }

  if (serverConfigPath) {
    console.info(`Server config path: ${serverConfigPath}`)
    const configDir = path.dirname(serverConfigPath)

    if (process.cwd() !== configDir) {
      process.chdir(configDir)
      console.info(`Working directory changed to: ${configDir}`)
    }
  }

  return {serverConfigPath, clientConfigPath}
}

export function loadServerConfig(serverConfigPath?: string): ServerConfiguration {
  if (!serverConfigPath) return {}

  const extension = path.extname(serverConfigPath)

  if (['.ts', '.tsx'].includes(extension)) {
    console.info('Requiring ts-node/register.')
    require('ts-node/register')
  }

  const module = require(serverConfigPath)
  return module.default || module
}

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

export interface BuildOptions {
  plugins: ServerPlugin[]
}

export function getClientEntryData(cachePath: string, clientConfigPath?: string) {
  return `// THIS FILE IS AUTOGENERATED, EDIT WITH CAUTION
import {Editor} from '@karma.run/editor-client'
${clientConfigPath && `import config from '${path.relative(cachePath, clientConfigPath)}'`}

const editor = new Editor(${clientConfigPath ? 'config' : ''})
editor.attach()`
}

export function getWorkerEntryData() {
  return `// THIS FILE IS AUTOGENERATED, EDIT WITH CAUTION
import '@karma.run/editor-worker'`
}

export function md5Hash(data: string) {
  return crypto
    .createHash('md5')
    .update(data)
    .digest('hex')
}

export function getBundleFilename(hash: string) {
  return `bundle.${hash}`
}

export function getEntryFilename(name: string, hash: string) {
  return `entry.${name}.${hash}`
}

export async function getCachedBuild(cachePath: string, clientConfigPath?: string) {
  const entryData = getClientEntryData(cachePath, clientConfigPath)
  const bundlePath = path.resolve(cachePath, './', getBundleFilename(md5Hash(entryData)))

  try {
    await fs.promises.stat(bundlePath)
    return bundlePath
  } catch (err) {
    return undefined
  }
}

type WebpackStats = import('webpack').Stats
export type BuildResult = {stats: WebpackStats; path: string}

export async function build(
  cachePath: string,
  clientConfigPath?: string,
  onProgress?: (percentage: number, msg: string) => void
) {
  return new Promise<BuildResult>(async (resolve, reject) => {
    let webpack: typeof import('webpack')

    try {
      webpack = (await import('webpack')).default
    } catch (err) {
      throw new Error("Coulnd't load webpack")
    }

    const clientEntryData = getClientEntryData(cachePath, clientConfigPath)
    const clientEntryPath = path.resolve(cachePath, './entry.client.js')

    const workerEntryData = getWorkerEntryData()
    const workerEntryPath = path.resolve(cachePath, './entry.worker.js')

    await mkdirpPromise(cachePath)
    await fs.promises.writeFile(clientEntryPath, clientEntryData)
    await fs.promises.writeFile(workerEntryPath, workerEntryData)

    const bundlePath = path.resolve(cachePath, './bundle')

    const compiler = webpack({
      entry: {index: clientEntryPath, worker: workerEntryPath},
      mode: 'production',
      devtool: 'source-map',
      output: {path: bundlePath, publicPath: '/static/'},
      resolve: {extensions: ['.ts', '.tsx', '.js']},
      module: {rules: [{test: /\.tsx?$/, loader: 'ts-loader'}]}
    } as import('webpack').Configuration)

    if (onProgress) compiler.apply(new webpack.ProgressPlugin(onProgress))

    compiler.run((err, stats) => {
      if (err) return reject(err)
      return resolve({path: bundlePath, stats})
    })
  })
}

export async function watchBuild(
  cachePath: string,
  clientConfigPath?: string,
  onBuild?: (err: Error, stats: WebpackStats) => void,
  onProgress?: (percentage: number, msg: string) => void
) {
  let webpack: typeof import('webpack')

  try {
    webpack = (await import('webpack')).default
  } catch (err) {
    throw new Error("Coulnd't load webpack")
  }

  const clientEntryData = getClientEntryData(cachePath, clientConfigPath)
  const clientEntryPath = path.resolve(cachePath, './entry.client.js')

  const workerEntryData = getWorkerEntryData()
  const workerEntryPath = path.resolve(cachePath, './entry.worker.js')

  await mkdirpPromise(cachePath)
  await fs.promises.writeFile(clientEntryPath, clientEntryData)
  await fs.promises.writeFile(workerEntryPath, workerEntryData)

  const bundlePath = path.resolve(cachePath, './bundle')

  const compiler = webpack({
    entry: {index: clientEntryPath, worker: workerEntryPath},
    mode: 'development',
    devtool: 'cheap-module-eval-source-map',
    output: {path: bundlePath, publicPath: '/static/'},
    resolve: {extensions: ['.ts', '.tsx', '.js']},
    module: {rules: [{test: /\.tsx?$/, loader: 'ts-loader'}]}
  } as import('webpack').Configuration)

  if (onProgress) compiler.apply(new webpack.ProgressPlugin(onProgress))

  compiler.watch({}, (err, stats) => {
    if (onBuild) onBuild(err, stats)
  })

  return bundlePath
}

export function getCachePath() {
  return path.resolve(process.cwd(), '.cache')
}
