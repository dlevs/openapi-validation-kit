import fs from 'node:fs/promises'
import ora from 'ora'
import chokidar from 'chokidar'
import { Command } from 'commander'
import { run } from './run.js'
import { OpenAPIV3 } from 'openapi-types'

const program = new Command()
program
  .version('0.0.1')
  .command('compile <source>')
  .option('-w, --watch', 'Watch source file and compile on change')
  // .description('clone a repository into a newly created directory')
  .action(async (source, { watch }) => {
    let spinner = ora()

    const compile = async () => {
      spinner.start()
      spinner.text = 'Compiling...'

      let spec: OpenAPIV3.Document
      try {
        spec = JSON.parse(await fs.readFile(source, 'utf-8'))
      } catch (e) {
        let message = `Failed to parse "${source}".`
        if (watch) {
          message += ' Watching for changes...'
        }
        spinner.fail(message)
        return
      }
      await run(spec)
      let message = `Compiled!`
      if (watch) {
        message += ' Watching for changes...'
      }
      spinner.succeed(message)
    }

    if (watch) {
      chokidar.watch(source).on('all', () => {
        compile()
      })
    } else {
      await compile()
    }
  })

program.parse(process.argv)
