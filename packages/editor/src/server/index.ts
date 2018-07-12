#!/usr/bin/env node
import 'dotenv/config'
import commander from 'commander'

import run, {defaultPort} from './commands/run'
export * from './commands/run'

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
  .option(
    '-k --karmaDataURL [karmaDataURL]',
    'Preload module before loading config. (environment: KARMA_DATA_URL)'
  )
  .action(options => run(options))

program.parse(process.argv)
