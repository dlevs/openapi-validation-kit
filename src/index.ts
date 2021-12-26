import { Command } from 'commander'
import { compileCommand } from './commands/compile.js'

const program = new Command()

program.version('0.0.1')

program
  .command('compile <source> <outDir>')
  .option('-w, --watch', 'Watch source file and compile on change')
  .option('-q, --quiet', 'Suppress console output')
  .option('-f, --fast', 'Skip formatting for faster performance')
  .description('clone a repository into a newly created directory')
  .action(compileCommand)

program.parse(process.argv)
