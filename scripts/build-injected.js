// Gera src/generated/injectedScript.ts a partir dos arquivos da extensão (extratores, adapters por loja
// e botão), para o app e a extensão enxergarem as lojas do mesmo jeito. Uso: npm run build:injected
// (precisa do repositório PriceWatchExtension ao lado deste; o resultado é versionado).
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EXT = process.env.PW_EXTENSION_DIR || path.join(ROOT, '..', 'PriceWatchExtension');
const SOURCES = [
  path.join(EXT, 'content/namespace.js'),
  path.join(EXT, 'content/extract.js'),
  path.join(EXT, 'content/adapters/mercadolivre.js'),
  path.join(EXT, 'content/adapters/kabum.js'),
  path.join(EXT, 'content/adapters/index.js'),
  path.join(EXT, 'content/button.js'),
  path.join(ROOT, 'injected/bridge.js'),
];

const code = SOURCES.map(f => `// ---- ${path.relative(path.join(ROOT, '..'), f)}\n${fs.readFileSync(f, 'utf8')}`).join('\n');
const out =
  '// GERADO por scripts/build-injected.js. Não edite: altere a extensão ou injected/bridge.js e rode npm run build:injected.\n' +
  `export const INJECTED_SCRIPT = ${JSON.stringify(code + '\ntrue;\n')};\n`;

fs.writeFileSync(path.join(ROOT, 'src/generated/injectedScript.ts'), out);
console.log(`injectedScript.ts gerado (${code.length} bytes)`);
