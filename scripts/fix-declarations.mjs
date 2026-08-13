import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
const dirs = ['dist', 'dist-cjs']
const specifierPattern = /(from\s+|import\s*\(|export\s+\*\s+from\s+|import\s*type\s*\{[^}]*\}\s+from\s+)(['"])(\.\.?\/[^'"]+)(['"])/g
function fixSpecifier(spec, cjs) {
  if (spec.endsWith('.js') || spec.endsWith('.mjs') || spec.endsWith('.cjs') || spec.endsWith('.json') || spec.endsWith('.css')) return spec
  if (spec.endsWith('.vue')) return spec + (cjs ? '.cjs' : '.js')
  return spec + (cjs ? '.cjs' : '.js')
}
let changed = 0
for (const dir of dirs) {
  const abs = path.join(root, dir)
  if (!fs.existsSync(abs)) continue
  for (const name of fs.readdirSync(abs)) {
    if (!/\.d\.(ts|mts|cts)$/.test(name)) continue
    const cjs = name.endsWith('.d.cts')
    const file = path.join(abs, name)
    let content = fs.readFileSync(file, 'utf8')
    const updated = content.replace(specifierPattern, (match, prefix, q1, spec, q2) => {
      const fixed = fixSpecifier(spec, cjs)
      return fixed === spec ? match : prefix + q1 + fixed + q2
    })
    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf8')
      changed++
      console.log(`fixed: ${path.relative(root, file)}`)
    }
  }
}
console.log(changed === 0 ? 'no declarations needed fixing' : `fixed ${changed} declaration file(s)`)
