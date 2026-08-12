import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const root = new URL('..', import.meta.url)
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'vue-org-tree-package-'))
const rootPackage = JSON.parse(readFileSync(new URL('./package.json', root), 'utf8'))

try {
  execFileSync('npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  const packOutput = execFileSync('npm', ['pack', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  })
  const [{ filename, files }] = JSON.parse(packOutput)
  const archive = new URL(filename, root)
  const paths = files.map(file => file.path)

  for (const required of [
    'dist/vue-org-tree.es.mjs',
    'dist/vue-org-tree.umd.js',
    'dist/style.css',
    'README.md',
    'LICENSE',
    'package.json'
  ]) {
    if (!paths.includes(required)) throw new Error(`Package is missing ${required}`)
  }

  if (paths.some(path => path.startsWith('src/') || path.startsWith('docs/'))) {
    throw new Error('Source or workflow documentation leaked into the npm package')
  }

  execFileSync('npm', ['init', '-y'], {
    cwd: temporaryDirectory,
    stdio: 'ignore',
    shell: process.platform === 'win32'
  })
  execFileSync('npm', ['install', archive.pathname, 'vue@2.7.16', 'vue-server-renderer@2.7.16', '--ignore-scripts'], {
    cwd: temporaryDirectory,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  const require = createRequire(join(temporaryDirectory, 'consumer.cjs'))
  const packageDirectory = join(temporaryDirectory, 'node_modules', ...rootPackage.name.split('/'))
  const packageJson = require(join(packageDirectory, 'package.json'))
  const moduleExports = require(packageDirectory)
  const Vue = require(join(temporaryDirectory, 'node_modules', 'vue'))
  const { createRenderer } = require(join(temporaryDirectory, 'node_modules', 'vue-server-renderer'))
  const css = readFileSync(join(packageDirectory, packageJson.style), 'utf8')
  const plugin = moduleExports.default || moduleExports

  if (plugin.name !== 'Vue2OrgTree' || typeof plugin.install !== 'function') {
    throw new Error('Installed tarball does not expose the Vue2OrgTree plugin')
  }
  if (!css.includes('.org-tree-container')) {
    throw new Error('Installed tarball CSS is not consumable')
  }
  if (readFileSync(new URL('./dist/vue-org-tree.umd.js', root), 'utf8').includes('Vue.js v2')) {
    throw new Error('Vue appears to be bundled into the UMD build')
  }

  Vue.use(plugin)
  const app = new Vue({
    render: h => h('vue2-org-tree', {
      props: {
        data: { label: 'Tarball root', children: [] }
      }
    })
  })
  const html = await createRenderer().renderToString(app)
  if (!html.includes('Tarball root') || !html.includes('org-tree-container')) {
    throw new Error('Installed tarball did not render the Vue2OrgTree component')
  }

  process.stdout.write(`Verified ${filename} with ${paths.length} files.\n`)
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
  const archiveName = `${rootPackage.name.replace(/^@/, '').replace('/', '-')}-${rootPackage.version}.tgz`
  for (const file of [archiveName]) {
    rmSync(new URL(file, root), { force: true })
  }
}
