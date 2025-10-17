#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/fiscal-flash"
DOCS_DIR="$ROOT_DIR/docs/legislacao"
RAW_BASE_DEFAULT="https://raw.githubusercontent.com/fiscalflash/simulador-static/main/public"
INDEX_HTML_URL="${INDEX_HTML_URL:-$RAW_BASE_DEFAULT/index.html}"
STYLES_CSS_URL="${STYLES_CSS_URL:-$RAW_BASE_DEFAULT/assets/styles.css}"
MAIN_JS_URL="${MAIN_JS_URL:-$RAW_BASE_DEFAULT/assets/main.js}"

export APP_DIR
TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Erro: comando '$1' não encontrado. Instale-o antes de continuar." >&2
    exit 1
  fi
}

require_cmd node
require_cmd npm
require_cmd curl
require_cmd rsync

if [ -d "$APP_DIR" ]; then
  echo "Removendo diretório existente em '$APP_DIR' para recriar o projeto..."
  rm -rf "$APP_DIR"
fi

export npm_config_yes=true

echo "Criando projeto Vite (React + TypeScript) em '$APP_DIR'..."
npm create vite@latest "$APP_DIR" -- --template react-ts >/dev/null

cd "$APP_DIR"

echo "Instalando dependências padrão do template..."
npm install >/dev/null

echo "Instalando bibliotecas adicionais..."
npm install chart.js zustand react-chartjs-2 >/dev/null
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom eslint prettier >/dev/null

fetch_asset() {
  local url="$1"
  local dest="$2"
  echo "Baixando ${url}..."
  if ! curl -fsSL "$url" -o "$dest"; then
    echo "Falha ao baixar '$url'." >&2
    exit 1
  fi
}

fetch_asset "$INDEX_HTML_URL" "$TMP_DIR/index.html"
fetch_asset "$STYLES_CSS_URL" "$TMP_DIR/styles.css"
fetch_asset "$MAIN_JS_URL" "$TMP_DIR/main.js"

python <<'PY'
import json
import os
from pathlib import Path

app_dir = Path(os.environ["APP_DIR"])
tmp_dir = Path(os.environ["TMP_DIR"])

styles_dir = app_dir / "src" / "styles"
styles_dir.mkdir(parents=True, exist_ok=True)
(theme_css_path := styles_dir / "theme.css").write_text((tmp_dir / "styles.css").read_text(encoding="utf-8"), encoding="utf-8")

lib_dir = app_dir / "src" / "lib"
lib_dir.mkdir(parents=True, exist_ok=True)
legacy_js = (tmp_dir / "main.js").read_text(encoding="utf-8")
(lib_dir / "legacySource.ts").write_text("export const legacyScript = " + json.dumps(legacy_js, ensure_ascii=False) + "\n", encoding="utf-8")

raw_html = (tmp_dir / "index.html").read_text(encoding="utf-8")
(lib_dir / "legacyTemplate.ts").write_text("export const legacyIndexHtml = " + json.dumps(raw_html, ensure_ascii=False) + "\n", encoding="utf-8")
PY

cat <<'TSX' > src/components/LegacyPreview.tsx
import { useEffect, useRef } from 'react';
import { legacyIndexHtml } from '../lib/legacyTemplate';
import { legacyScript } from '../lib/legacySource';

const LEGACY_ROOT_ID = 'legacy-root';

export function LegacyPreview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = legacyIndexHtml;

    const script = document.createElement('script');
    script.type = 'module';
    const blob = new Blob([legacyScript], { type: 'application/javascript' });
    script.src = URL.createObjectURL(blob);
    script.addEventListener('load', () => {
      URL.revokeObjectURL(script.src);
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      if (script.src) URL.revokeObjectURL(script.src);
    };
  }, []);

  return (
    <div className="legacy-preview" data-testid="legacy-preview" ref={containerRef}>
      <div id={LEGACY_ROOT_ID} />
    </div>
  );
}
TSX

cat <<'APP' > src/App.tsx
import './styles/theme.css';
import './App.css';
import { LegacyPreview } from './components/LegacyPreview';

function App() {
  return (
    <main data-theme="flash" className="app-shell">
      <LegacyPreview />
    </main>
  );
}

export default App;
APP

cat <<'CSS' > src/App.css
:root {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--fg, #0f172a);
  background-color: var(--bg, #f8fafc);
  line-height: 1.5;
}

body {
  margin: 0;
}

main.app-shell {
  min-height: 100vh;
}
CSS

cat <<'MAIN' > src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
MAIN

python <<'PY'
import os
from pathlib import Path

app_dir = Path(os.environ["APP_DIR"])
index_path = app_dir / "index.html"
html = index_path.read_text(encoding="utf-8")

if 'data-theme' not in html:
    html = html.replace('<html lang="en">', '<html lang="pt-BR" data-theme="flash">')

if 'name="theme-color"' not in html:
    html = html.replace('<head>', '<head>\n    <meta name="theme-color" content="#1E3A8A">', 1)

index_path.write_text(html, encoding="utf-8")
PY

if [ -d "$DOCS_DIR" ]; then
  echo "Espelhando documentação de legislação em public/legislacao..."
  rsync -a --delete "$DOCS_DIR/" "$APP_DIR/public/legislacao/"
else
  echo "Aviso: diretório '$DOCS_DIR' não encontrado. Pasta public/legislacao não foi criada." >&2
fi

echo ""
echo "Setup concluído. Próximos passos:"
echo "  bash setup.sh && cd fiscal-flash && npm run dev"
echo ""
echo "Smoke test sugerido:"
echo "  1. Após iniciar com 'npm run dev', acesse http://localhost:5173."
echo "  2. Verifique se a interface legacy é exibida dentro do contêiner React."
echo "  3. Use o alternador de tema existente e confira se estilos são aplicados."
echo "  4. Observe o console do navegador para confirmar ausência de erros."
