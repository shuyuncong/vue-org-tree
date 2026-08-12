import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = new URL('..', import.meta.url)
const rootPath = fileURLToPath(root)
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'vue-hierarchy-package-'))
const rootPackage = JSON.parse(readFileSync(new URL('./package.json', root), 'utf8'))
let archive

function run(command, args, cwd = root, options = {}) {
  return execFileSync(command, args, {
    cwd,
    stdio: options.encoding ? undefined : 'inherit',
    encoding: options.encoding,
    shell: process.platform === 'win32'
  })
}

try {
  run('npm', ['run', 'build'])
  const [{ filename, files }] = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts'], root, { encoding: 'utf8' }))
  archive = new URL(filename, root)
  const paths = files.map(file => file.path)
  for (const required of ['dist/vue-hierarchy.js', 'dist/vue-hierarchy.cjs', 'dist/index.d.ts', 'dist/style.css', 'README.md', 'LICENSE', 'package.json']) {
    if (!paths.includes(required)) throw new Error(`Package is missing ${required}`)
  }
  if (paths.some(path => path.startsWith('src/') || path.startsWith('test/') || path.startsWith('docs/'))) {
    throw new Error('Source, tests, or workflow documentation leaked into the package')
  }
  const esBuild = readFileSync(new URL('./dist/vue-hierarchy.js', root), 'utf8')
  const cjsBuild = readFileSync(new URL('./dist/vue-hierarchy.cjs', root), 'utf8')
  if (/Vue\.js v3|@vue\/runtime/.test(esBuild + cjsBuild)) throw new Error('Vue appears to be bundled instead of externalized')

  writeFileSync(join(temporaryDirectory, 'package.json'), JSON.stringify({ name: 'vue-hierarchy-consumer', private: true, type: 'module' }))
  run('npm', ['install', fileURLToPath(archive), '--ignore-scripts', '--no-audit', '--no-fund', '--legacy-peer-deps'], temporaryDirectory)
  symlinkSync(join(rootPath, 'node_modules', 'vue'), join(temporaryDirectory, 'node_modules', 'vue'), 'junction')

  const require = createRequire(join(temporaryDirectory, 'consumer.cjs'))
  const packageDirectory = join(temporaryDirectory, 'node_modules', ...rootPackage.name.split('/'))
  const packageJson = require(join(packageDirectory, 'package.json'))
  const cjs = require(packageDirectory)
  const esm = await import(pathToFileURL(join(packageDirectory, packageJson.module)).href)
  const { createSSRApp, h } = await import('vue')
  const { renderToString } = await import('@vue/server-renderer')
  const css = readFileSync(join(packageDirectory, packageJson.style), 'utf8')

  for (const module of [cjs, esm]) {
    if (typeof module.HierarchyView !== 'object' || typeof module.validateDocument !== 'function' || typeof module.togglePermission !== 'function') {
      throw new Error('Installed tarball is missing component or core exports')
    }
  }
  if (!css.includes('.vh-view')) throw new Error('Installed tarball CSS is not consumable')
  if (!readFileSync(join(packageDirectory, packageJson.types), 'utf8').includes('HierarchyView')) throw new Error('Type entry does not expose HierarchyView')

  const document = { version: '2.0', nodes: [{ id: 'root', label: 'Tarball root' }], edges: [] }
  const html = await renderToString(createSSRApp({ render: () => h(esm.HierarchyView, { modelValue: document }) }))
  if (!html.includes('Tarball root') || !html.includes('vh-view')) throw new Error('Installed package failed Vue 3 SSR rendering')

  writeFileSync(join(temporaryDirectory, 'consumer.ts'), "import { HierarchyView, type HierarchyDocument } from '@shuyuncong/vue-hierarchy'\nconst document: HierarchyDocument = { version: '2.0', nodes: [], edges: [] }\nvoid HierarchyView\nvoid document\n")
  writeFileSync(join(temporaryDirectory, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, module: 'ESNext', moduleResolution: 'Bundler', target: 'ES2022', skipLibCheck: false }, include: ['consumer.ts'] }))
  const tsc = join(rootPath, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc')
  run(tsc, ['--noEmit'], temporaryDirectory)

  process.stdout.write(`Verified ${filename}: ESM, CommonJS, declarations, CSS, Vue external, and SSR.\n`)
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
  if (archive) rmSync(archive, { force: true })
}
