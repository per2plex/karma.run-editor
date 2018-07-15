#!/usr/bin/env node
import 'dotenv/config'
import commander from 'commander'

import run, {defaultPort} from './commands/run'
import build from './commands/build'
import clean from './commands/clean'

export * from './interface'

const program = commander.name('karma-editor').version('0.13.0')

program
  .command('run')
  .description('Run editor server.')
  .option(
    '-p --port [port]',
    `Set port the server runs on. (environment: PORT, default: ${defaultPort})`,
    parseInt
  )
  .option('-c --config [config]', 'Set path to config file.')
  .option('-r --require [require]', 'Preload module before loading config.')
  .option('-w --watch', 'Watch bundle build.')
  .option('--no-cache --noCache', 'Ignores cache.')
  .option(
    '-u --karma-data-url --karmaDataURL [karmaDataURL]',
    'Set karma.data URL. (environment: KARMA_DATA_URL)'
  )
  .action(opts => run(opts))

program
  .command('build')
  .description('Pre-build editor client.')
  .option('-c --config [config]', 'Set path to config file.')
  .option('-r --require [require]', 'Preload module before loading config.')
  .option('-w --watch', 'Watch bundle build.')
  .option(
    '-u --karma-data-url --karmaDataURL [karmaDataURL]',
    'Set karma.data URL. (environment: KARMA_DATA_URL)'
  )
  .action(opts => build(opts))

program
  .command('clean')
  .description('Clean client cache.')
  .action(opts => clean(opts))

program.parse(process.argv)

if (process.argv.length <= 2) {
  program.help()
}
