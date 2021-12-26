import fs from 'node:fs/promises'
import path from 'node:path'
import { hrtime } from 'node:process'
import ora from 'ora'
import chokidar from 'chokidar'
import colors from 'picocolors'
import { Command } from 'commander'
import { run } from './run.js'
import { OpenAPIV3 } from 'openapi-types'

const program = new Command()
program
  .version('0.0.1')
  .command('compile <source> <outDir>')
  .option('-w, --watch', 'Watch source file and compile on change')
  // TODO: Why add quiet? No benefit?
  .option('-q, --quiet', 'Suppress console output')
  // .description('clone a repository into a newly created directory')
  .action(async (source, outDir, { watch, quiet }) => {
    let spinner = ora({ isSilent: quiet })
    spinner.start()
    spinner.text = 'Compiling...'

    if (watch) {
      chokidar.watch(source).on('all', () => {
        compileSafe()
      })
    } else {
      const exitCode = await compileSafe()
      process.exit(exitCode)
    }

    async function compileSafe() {
      const startTime = hrtime.bigint()
      try {
        await compile({ source, outDir })
        spinner.succeed(getMessage('Compiled!', startTime))
        return 0
      } catch (e) {
        spinner.fail(
          getMessage(colors.red(`Failed to parse "${source}".`), startTime)
        )
        return 1
      }
    }

    function getMessage(message: string, startTime: bigint) {
      const endTime = hrtime.bigint()
      const execTimeMs = Number((endTime - startTime) / BigInt(1e6))

      const output = [colors.blue(`[${execTimeMs}ms]`), message]

      if (watch) {
        output.push(colors.dim(`Watching for changes...`))
      }

      return output.join(' ')
    }
  })

program.parse(process.argv)

async function compile({ source, outDir }: { source: string; outDir: string }) {
  const spec: OpenAPIV3.Document = JSON.parse(
    await fs.readFile(source, 'utf-8')
  )

  const artifacts = await run(spec)

  try {
    await fs.stat(path.join(outDir, './dist'))
  } catch (err) {
    await fs.mkdir(path.join(outDir, './dist'))
  }

  await Promise.all(
    Object.entries(artifacts).map(([filename, data]) => {
      return fs.writeFile(path.join(outDir, filename), data)
    })
  )
}
