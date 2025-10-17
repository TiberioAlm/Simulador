#!/usr/bin/env bash
set -euo pipefail

# Compact setup: scaffolds Vite+React+TS app, installs deps, downloads RAWs,
# and copies this repo's already-ported React/TS code into the new app.
# Defaults from prompt.txt

PROJECT_NAME="${1:-${PROJECT_NAME:-fiscal-flash}}"
PKG_MANAGER="${PKG_MANAGER:-npm}"
CHART_LIB="${CHART_LIB:-react-chartjs-2}" # chart.js|react-chartjs-2
PERSIST_KEY="${PERSIST_KEY:-fiscalflash:last}"
USE_PWA="${USE_PWA:-false}"

RAW_INDEX="https://raw.githubusercontent.com/TiberioAlm/Simulador/main/public/index.html"
RAW_CSS="https://raw.githubusercontent.com/TiberioAlm/Simulador/main/public/assets/styles.css"
RAW_JS="https://raw.githubusercontent.com/TiberioAlm/Simulador/main/public/assets/main.js"

SRC_ROOT="$(pwd)"
echo "==> Criando projeto Vite React+TS: ${PROJECT_NAME}"
${PKG_MANAGER} create vite@latest "${PROJECT_NAME}" -- --template react-ts >/dev/null 2>&1 || true
cd "${PROJECT_NAME}"

echo "==> Baixando RAWs para referência"
mkdir -p public/source
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$RAW_INDEX" -o public/source/raw_index.html || true
  curl -fsSL "$RAW_CSS" -o public/source/raw_styles.css || true
  curl -fsSL "$RAW_JS" -o public/source/raw_main.js || true
elif command -v wget >/dev/null 2>&1; then
  wget -q "$RAW_INDEX" -O public/source/raw_index.html || true
  wget -q "$RAW_CSS" -O public/source/raw_styles.css || true
  wget -q "$RAW_JS" -O public/source/raw_main.js || true
fi

echo "==> Instalando dependências"
APP_DEPS=(react react-dom zustand immer chart.js)
if [ "$CHART_LIB" = "react-chartjs-2" ]; then APP_DEPS+=(react-chartjs-2); fi
${PKG_MANAGER} i "${APP_DEPS[@]}" >/dev/null

echo "==> Instalando dev deps"
DEV_DEPS=(vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/node eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks)
${PKG_MANAGER} i -D "${DEV_DEPS[@]}" >/dev/null

echo "==> Copiando código React/TS portado deste repositório"
rm -rf src
mkdir -p src
cp -R "${SRC_ROOT}/src/." src/

echo "==> Ajustando index.html (tema + skip-link)"
cat > index.html <<'HTML'
<!doctype html>
<html lang="pt-BR" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0f172a" />
    <title>Fiscal Flash – Simulador CBS/IBS</title>
  </head>
  <body>
    <a class="skip-link" href="#root">Pular para o conteúdo</a>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
  <style>
    .skip-link{position:absolute;left:-9999px;top:auto;overflow:hidden}
    .skip-link:focus{left:12px;top:12px;background:#fff;color:#111;padding:8px 10px;border-radius:8px}
  </style>
  </html>
HTML

echo "==> Copiando estilos globais, testes e configs se existirem"
if [ -f "${SRC_ROOT}/vitest.setup.ts" ]; then cp "${SRC_ROOT}/vitest.setup.ts" ./; fi
if [ -f "${SRC_ROOT}/vite.config.ts" ]; then cp "${SRC_ROOT}/vite.config.ts" ./; fi
if [ -f "${SRC_ROOT}/tsconfig.json" ]; then cp "${SRC_ROOT}/tsconfig.json" ./; fi
if [ -f "${SRC_ROOT}/tsconfig.node.json" ]; then cp "${SRC_ROOT}/tsconfig.node.json" ./; fi
if [ -d "${SRC_ROOT}/public/legislacao" ]; then mkdir -p public/legislacao && cp -R "${SRC_ROOT}/public/legislacao/." public/legislacao/; fi
if [ -d "${SRC_ROOT}/docs/legislacao" ]; then mkdir -p public/legislacao && cp -R "${SRC_ROOT}/docs/legislacao/." public/legislacao/; fi

echo "==> Configurando Vitest e scripts do package.json"
node - <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.vitest = { environment: 'jsdom', setupFiles: ['vitest.setup.ts'] };
pkg.scripts = Object.assign({}, pkg.scripts, { dev:'vite', build:'tsc && vite build', preview:'vite preview', test:'vitest --run', lint:'eslint . --ext .ts,.tsx' });
fs.writeFileSync('package.json', JSON.stringify(pkg,null,2));
NODE

echo "==> ESLint + Prettier básicos"
cat > .eslintrc.cjs <<'CJS'
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint','react','react-hooks'],
  extends: [ 'eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:@typescript-eslint/recommended' ],
  settings: { react: { version: 'detect' } },
  rules: { 'react/react-in-jsx-scope': 'off' }
};
CJS
echo '{ "singleQuote": true, "semi": true, "printWidth": 100 }' > .prettierrc
echo -e "node_modules\ndist\n" > .eslintignore
echo -e "node_modules\ndist\n" > .prettierignore

echo "\n==> Pronto!"
echo "Execute:"
echo "  bash setup.sh && cd ${PROJECT_NAME} && ${PKG_MANAGER} run dev"
echo
echo "SMOKE TEST (manual):"
echo "  1) Selecione Cenário 'Regime definitivo (2033+ — CBS/IBS)'."
echo "  2) Preencha: Receita 100000; Compras CBS/IBS 20000; PIS/COFINS 15000; ICMS 10000; Seletivo 5000; Despesas 40000."
echo "  3) Adicione à base e Recalcule."
echo "  4) Verifique cards/tabelas/gráficos e tema dinâmico."
