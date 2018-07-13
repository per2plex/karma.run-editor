import {ObjectMap, ServerPlugin} from '@karma.run/editor-common'
import {Configuration} from '@karma.run/editor/src/cli/interface'

const Liftoff = require('liftoff')
const interpret = require('interpret')

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

export interface LoadConfigOptions {
  cwd?: string
  configPath?: string
  require?: string
}

export async function loadConfig(opts: LoadConfigOptions): Promise<Configuration> {
  return new Promise(resolve => {
    const configLoader = new Liftoff({
      name: 'karma.tools/editor',
      configName: 'editor', // Extension includes .config so full name is editor.config.*
      extensions: extensions
    })
      .on('require', (name: string) => {
        console.info('Preloading module:', name)
      })
      .on('requireFail', (name: string, err: Error) => {
        console.info('Unable to preload:', name, err)
      })

    configLoader.launch(
      {cwd: opts.cwd, configPath: opts.configPath, require: opts.require},
      (env: LiftoffEnvironment): void => {
        let config: Configuration = {}
        if (env.configPath) {
          const module = require(env.configPath)
          config = module.default || module
        }

        if (process.cwd() !== env.cwd) {
          process.chdir(env.cwd)
          console.info('Working directory changed to', env.cwd)
        }

        return resolve(config)
      }
    )
  })
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
