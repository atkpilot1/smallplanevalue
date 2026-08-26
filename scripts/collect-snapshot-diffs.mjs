#!/usr/bin/env node
/**
 * Copy Playwright snapshot expected/actual/diff artifacts into
 * test-results/snapshot-review/ so they are easy to open and compare.
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const SRC = 'test-results'
const DEST = 'test-results/snapshot-review'

async function walk(dir) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'snapshot-review') continue
      out.push(...(await walk(path)))
      continue
    }
    if (!entry.isFile()) continue
    if (/\.(png|yml|txt)$/i.test(entry.name) && /(expected|actual|diff|error)/i.test(entry.name)) {
      out.push(path)
    }
  }
  return out
}

const files = await walk(SRC)
if (!files.length) {
  console.error('No snapshot diffs found under test-results/. Re-run the failing snapshot test first.')
  process.exit(1)
}

await mkdir(DEST, { recursive: true })
for (const file of files) {
  const name = relative(SRC, file).replaceAll('/', '__')
  await copyFile(file, join(DEST, name))
  console.log(name)
}
console.log(`\nCopied ${files.length} file(s) to ${DEST}/`)
