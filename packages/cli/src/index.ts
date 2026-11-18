#!/usr/bin/env node
import { run } from './cli.ts'
import { askYesNo } from './prompt.ts'

process.exitCode = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  confirm: process.stdin.isTTY
    ? (question) => askYesNo(question, process.stdin, process.stdout)
    : undefined,
})
