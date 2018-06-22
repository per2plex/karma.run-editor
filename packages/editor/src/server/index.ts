#!/usr/bin/env node
import 'dotenv/config'
import commander from 'commander'
import runCommand from './runCommand'

const program = commander.name('karma-editor').version('0.13.0')

program
  .command('run [karmaURL]')
  .description('run editor server. (environment: KARMA_URL or KARMA_API_URL)')
  .option('-p --port [port]', 'set port the server runs on. (environment: PORT)', parseInt, 3000)
  .action((karmaURL, options) => runCommand(karmaURL, options))

program.parse(process.argv)
