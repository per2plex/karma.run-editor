import rimraf from 'rimraf'
import {getCachePath, loadConfig} from './helper'

export interface CleanCommandOptions {
  cwd?: string
  config?: string
  require?: string
}

export default async function cleanCommand(opts: CleanCommandOptions): Promise<void> {
  await loadConfig(opts)
  const cachePath = getCachePath()

  console.info('Cleaning cache...')

  rimraf(cachePath, err => {
    if (err) return console.error(`Coulnd't clean cache: ${err.message}`)
    return console.info('Cleaned cache.')
  })
}
