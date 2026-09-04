#!/usr/bin/env node
/**
 * Merge config.shared.toml + config.<env>.toml and either write local
 * config.toml (for Docker) or push the merge to a hosted project.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'smol-toml'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SUPA = resolve(ROOT, 'supabase')

const REFS = {
  staging: 'wyggunstezdstrmblkhx',
  prod: 'ogfaqdmhqwlysavooroo',
}

const ENVS = ['local', 'staging', 'prod']

function deepMerge(base, overlay) {
  if (overlay === undefined) return base
  if (Array.isArray(overlay)) return overlay
  if (overlay && typeof overlay === 'object') {
    const out =
      base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {}
    for (const [key, value] of Object.entries(overlay)) {
      out[key] = deepMerge(out[key], value)
    }
    return out
  }
  return overlay
}

function loadToml(name) {
  return parse(readFileSync(resolve(SUPA, name), 'utf8'))
}

function mergeEnv(env) {
  if (!ENVS.includes(env)) {
    throw new Error(`Unknown env "${env}". Use ${ENVS.join(', ')}.`)
  }
  return deepMerge(loadToml('config.shared.toml'), loadToml(`config.${env}.toml`))
}

function assertAuthUrls(merged, env) {
  const site = merged?.auth?.site_url
  const redirects = merged?.auth?.additional_redirect_urls
  if (!site || !Array.isArray(redirects)) {
    throw new Error(`config.${env}.toml must set auth.site_url and additional_redirect_urls`)
  }
}

function writeLocal() {
  const merged = mergeEnv('local')
  assertAuthUrls(merged, 'local')
  const header =
    '# GENERATED — do not edit.\n' +
    '# Sources: config.shared.toml + config.local.toml\n' +
    '# Regenerate: npm run db:config:sync\n\n'
  writeFileSync(resolve(SUPA, 'config.toml'), header + stringify(merged) + '\n')
}

function dump(env) {
  const merged = mergeEnv(env)
  assertAuthUrls(merged, env)
  process.stdout.write(stringify(merged) + '\n')
}

function push(env) {
  if (env !== 'staging' && env !== 'prod') {
    throw new Error('push requires staging or prod')
  }
  const merged = mergeEnv(env)
  assertAuthUrls(merged, env)
  const dest = resolve(SUPA, 'config.toml')
  const bak = resolve(SUPA, 'config.toml.push-bak')
  copyFileSync(dest, bak)
  try {
    writeFileSync(dest, stringify(merged) + '\n')
    console.error(`Pushing ${env} Auth config to ${REFS[env]} (CLI will show a diff).`)
    const result = spawnSync(
      'npx',
      ['supabase', 'config', 'push', '--project-ref', REFS[env]],
      { cwd: ROOT, stdio: 'inherit' },
    )
    if (result.status !== 0) process.exit(result.status ?? 1)
  } finally {
    if (existsSync(bak)) {
      copyFileSync(bak, dest)
      unlinkSync(bak)
    }
    writeLocal()
  }
}

const [cmd, env] = process.argv.slice(2)
try {
  if (cmd === 'sync' || cmd === 'write-local') writeLocal()
  else if (cmd === 'dump' && env) dump(env)
  else if (cmd === 'push' && env) push(env)
  else {
    console.error('Usage: supabase-config.mjs sync | dump <local|staging|prod> | push <staging|prod>')
    process.exit(1)
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
