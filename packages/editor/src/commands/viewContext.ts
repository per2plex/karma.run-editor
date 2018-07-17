import {loadConfig} from './helper'
import {getEditorContext} from '@karma.run/editor-server'
import {authenticate} from '@karma.run/sdk'

export interface ViewContextCommandOptions {
  cwd?: string
  config?: string
  require?: string
  karmaDataURL?: string
  instanceSecret: string
}

export default async function viewContextCommand(opts: ViewContextCommandOptions): Promise<void> {
  const config = await loadConfig(opts)
  const karmaDataURL = process.env.KARMA_DATA_URL || opts.karmaDataURL || config.karmaDataURL

  if (!karmaDataURL) {
    console.error('No karma.data URL specified, set it via environment, CLI option or config.')
    return process.exit(1)
  }

  try {
    const signature = await authenticate(karmaDataURL, 'admin', opts.instanceSecret)
    const {viewContexts} = await getEditorContext(karmaDataURL, signature)

    process.stdout.write(
      JSON.stringify(viewContexts.map(viewContext => viewContext.serialize()), undefined, 2),
      () => {
        process.exit(0)
      }
    )
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}
