#!/usr/bin/env bash
set -euo pipefail

# =========================
# Defaults (pode passar um nome na linha de comando: ./setup.sh meu-app)
# =========================
PROJECT_NAME="${1:-fiscal-flash}"
PKG_MANAGER="${PKG_MANAGER:-npm}"   # npm|pnpm|yarn
USE_PWA="${USE_PWA:-true}"

echo ">> Criando projeto Vite React+TS: $PROJECT_NAME"
${PKG_MANAGER} create vite@latest "${PROJECT_NAME}" -- --template react-ts >/dev/null 2>&1 || true

cd "${PROJECT_NAME}"

echo ">> Instalando dependências (app)…"
${PKG_MANAGER} i react react-dom chart.js lucide-react @radix-ui/react-tabs @radix-ui/react-dialog @radix-ui/react-toast zustand >/dev/null

echo ">> Instalando dependências (dev)…"
${PKG_MANAGER} i -D vite-plugin-pwa eslint prettier @types/node vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom >/dev/null

# =========================
# Estrutura de pastas
# =========================
mkdir -p src/styles src/lib src/state src/components/AppShell src/components/Panels src/components/BaseDataset src/components/Reports src/components/Common public/icons public/legislacao

# =========================
# index.html (Vite) - injeta data-theme + theme-color
# =========================
cat > index.html <<'HTML'
<!doctype html>
<html lang="pt-BR" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/icons/app-192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0f172a" />
    <title>Simulador • Fiscal Flash</title>
  </head>
  <body>
    <a class="skip-link" href="#app-root">Pular para o conteúdo</a>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML

# =========================
# styles/theme.css (tokens base + dark)
# =========================
cat > src/styles/theme.css <<'CSS'
:root{
  --bg: #0b1220;         /* app topbar bg (também usado no theme-color) */
  --surface: #0f172a;
  --panel: #111827;
  --panel-2: #0b1220;
  --text: #e5e7eb;
  --muted: #94a3b8;
  --accent: #4f46e5;     /* roxo/índigo */
  --accent-2:#22c55e;
  --ring: #60a5fa;

  --card: #0b1220;
  --border:#1f2937;

  --ok:#10b981; --warn:#f59e0b; --bad:#ef4444;

  --radius: 14px;
  --shadow: 0 16px 40px rgba(0,0,0,.25);

  --gap-1: .5rem;
  --gap-2: .75rem;
  --gap-3: 1rem;
  --gap-4: 1.25rem;
  --gap-6: 1.75rem;
}

html[data-theme="light"]{
  --bg: #e8eefc;
  --surface: #ffffff;
  --panel: #f8fafc;
  --panel-2: #eef2ff;
  --text: #0f172a;
  --muted: #475569;
  --card: #ffffff;
  --border:#e2e8f0;
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{
  margin:0;
  font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Inter, Arial, sans-serif;
  color: var(--text);
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
}
.skip-link{
  position:absolute;left:-9999px;top:auto;overflow:hidden;
}
.skip-link:focus{
  left: 12px; top: 12px; background:#fff; color:#111; padding:8px 10px; border-radius:8px;
}

a{color:inherit}
button{font:inherit}
input,select{font:inherit;color:inherit}

.card{
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: var(--gap-3);
}

.grid{display:grid;gap:var(--gap-3)}
.grid.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width: 1024px){
  .grid.cols-2,.grid.cols-3,.grid.cols-4{grid-template-columns:1fr}
}

input[type="text"], input[type="number"], select{
  width:100%; padding:.65rem .8rem;
  background: var(--surface);
  border:1px solid var(--border);
  border-radius: 12px;
  outline: none;
}
input:focus, select:focus{border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 35%, transparent)}

.btn{
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.6rem .9rem; border-radius:12px; border:1px solid var(--border);
  background: linear-gradient(180deg, color-mix(in oklab, var(--surface) 88%, transparent), var(--surface));
  cursor:pointer;
}
.btn.primary{background: linear-gradient(180deg, color-mix(in oklab, var(--accent) 28%, var(--surface)), var(--surface)); border-color: color-mix(in oklab, var(--accent) 40%, var(--border))}
.btn.ghost{background: transparent}
.btn:focus-visible{outline:2px solid var(--ring)}

.badge{
  display:inline-flex;align-items:center;gap:.35rem;
  padding:.25rem .55rem;border-radius:999px;border:1px solid var(--border);background:var(--surface);font-size:.8rem;color:var(--muted)
}

.kpi{display:flex;align-items:center;justify-content:space-between}
.kpi .val{font-weight:700;font-size:1.35rem}

.table{width:100%; border-collapse: collapse}
.table th,.table td{padding:.6rem .5rem; border-bottom:1px solid var(--border); text-align:left}
.table th{font-weight:600;color:var(--muted)}
CSS

# =========================
# styles/app.css (AppShell, navs, FAB, animações)
# =========================
cat > src/styles/app.css <<'CSS'
.app-wrap{
  display:grid;
  grid-template-columns: 240px minmax(0,1fr);
  grid-template-rows: 56px minmax(0,1fr) 68px;
  grid-template-areas:
   "topbar topbar"
   "sidebar content"
   "bottomnav bottomnav";
  min-height:100dvh;
}

.topbar{
  grid-area: topbar;
  display:flex; align-items:center; justify-content:space-between;
  padding: 0 14px; background: var(--bg);
  border-bottom:1px solid var(--border);
}
.brand{display:flex;align-items:center;gap:.6rem;font-weight:700}
.brand .dot{width:10px;height:10px;border-radius:999px;background:var(--accent)}

.sidebar{
  grid-area: sidebar;
  display:flex; flex-direction:column; gap:6px;
  padding: 12px; border-right:1px solid var(--border);
  background: linear-gradient(180deg,var(--panel-2),var(--panel));
}
.side-btn{
  display:flex;align-items:center;gap:.7rem;
  padding:.6rem .8rem; border-radius:10px; border:1px solid transparent; cursor:pointer;
}
.side-btn.active{background: color-mix(in oklab, var(--accent) 18%, var(--surface)); border-color: color-mix(in oklab, var(--accent) 35%, transparent)}

.content{
  grid-area: content;
  padding: 16px; min-height: calc(100dvh - 56px - 68px);
}

.bottomnav{
  grid-area: bottomnav; position: sticky; bottom:0;
  display:flex; justify-content:space-around;
  border-top:1px solid var(--border);
  background: var(--panel-2);
}
.bn-btn{display:flex; flex-direction:column; align-items:center; padding:8px 10px; gap:4px; font-size:.75rem; opacity:.9}
.bn-btn.active{color: var(--accent)}

.fab{
  position: fixed; right: 20px; bottom: 86px;
  padding: .8rem 1rem; border-radius: 16px;
  background: var(--accent); border: none; color:#fff; font-weight:700;
  box-shadow: var(--shadow); cursor:pointer;
}
@media (min-width: 1025px){ .fab{bottom: 20px} }

.fade-in{animation:fade .24s ease-out}
@keyframes fade{from{opacity:0; transform: translateY(4px)}to{opacity:1; transform:none}}
CSS

# =========================
# lib/format.ts
# =========================
cat > src/lib/format.ts <<'TS'
export const parseBR = (v: string): number => {
  if (!v) return 0;
  const s = v.replace(/[^\d,.-]/g, "").replace(/\.(?=.*,)/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export const fmtMon = (n: number, moeda: "BRL" | "USD" | string = "BRL", casas = 2) =>
  new Intl.NumberFormat(moeda === "USD" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: moeda,
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(n ?? 0);

export const fmtPct = (n: number, casas = 2) =>
  `${(n ?? 0).toFixed(casas).replace(".", ",")}%`;

export const clamp = (v: number, min = -1e12, max = 1e12) => Math.min(max, Math.max(min, v));
TS

# =========================
# lib/charts.ts
# =========================
cat > src/lib/charts.ts <<'TS'
import { Chart, Filler, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale, LineElement, PointElement } from "chart.js";
Chart.register(Filler, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale, LineElement, PointElement);

export function applyChartTheme(theme: "light"|"dark"){
  const isDark = theme === "dark";
  Chart.defaults.color = isDark ? "#e5e7eb" : "#0f172a";
  Chart.defaults.borderColor = isDark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.12)";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
}
TS

# =========================
# lib/scenario.ts (placeholder para presets)
# =========================
cat > src/lib/scenario.ts <<'TS'
export type Regime = "simples"|"presumido"|"real";
export interface Entradas { receita:number; compras:number; despesas:number; }
export interface Aliquotas { pis:number; cofins:number; iss:number; cbs:number; ibs:number; }
export interface Opcoes { incluirPisCof:boolean; }

export const DEFAULTS = {
  regime: "real" as Regime,
  moeda: "BRL",
  casas: 2,
  entradas: { receita: 100000, compras: 50000, despesas: 20000 } as Entradas,
  aliquotas: { pis: 0.0065, cofins: 0.03, iss: 0.05, cbs: 0.009, ibs: 0.001 } as Aliquotas,
  opcoes: { incluirPisCof: true } as Opcoes,
};
TS

# =========================
# lib/calc.ts (shim funcional + pontos de extensão)
# =========================
cat > src/lib/calc.ts <<'TS'
import { Entradas, Aliquotas, Regime } from "./scenario";

export interface Resultado {
  modeloAtual: { total: number; detalhado: Record<string, number> };
  modeloNovo: { total: number; detalhado: Record<string, number> };
  comparativo: { deltaAbs: number; deltaPct: number };
}

/**
 * >>> ATENÇÃO <<<
 * Este módulo é um SHIM funcional. Substitua a lógica por suas funções reais,
 * portadas do main.js original. Mantenha a mesma interface.
 */
export function simular(regime: Regime, ent: Entradas, aliq: Aliquotas): Resultado {
  const base = Math.max(0, ent.receita - ent.compras); // aproximação
  const atualPisCof = base * (aliq.pis + aliq.cofins);
  const atualIss = ent.receita * aliq.iss;
  const atualTotal = atualPisCof + atualIss;

  const novoCbsIbs = ent.receita * (aliq.cbs + aliq.ibs);
  const novoTotal = novoCbsIbs;

  const detalhadoAtual = { PIS_COFINS: atualPisCof, ISS: atualIss };
  const detalhadoNovo = { CBS_IBS: novoCbsIbs };

  const deltaAbs = novoTotal - atualTotal;
  const deltaPct = atualTotal ? (deltaAbs / atualTotal) : 0;

  return {
    modeloAtual: { total: atualTotal, detalhado: detalhadoAtual },
    modeloNovo: { total: novoTotal, detalhado: detalhadoNovo },
    comparativo: { deltaAbs, deltaPct },
  };
}
TS

# =========================
# state/useLocalStorage.ts
# =========================
cat > src/state/useLocalStorage.ts <<'TS'
import { useEffect, useState } from "react";

export function useLocalStorage<T>(key:string, initial:T){
  const [value,setValue] = useState<T>(() => {
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : initial;
    }catch{ return initial; }
  });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(value)); }catch{} },[key,value]);
  return [value,setValue] as const;
}
TS

# =========================
# state/store.ts (Zustand)
# =========================
cat > src/state/store.ts <<'TS'
import { create } from "zustand";
import { DEFAULTS, Regime, Entradas, Aliquotas } from "../lib/scenario";
import { simular, Resultado } from "../lib/calc";

interface UIState { tema:"light"|"dark"; aba:"resumo"|"entradas"|"aliquotas"|"relatorios"|"graficos"|"config"; }
interface AppState {
  ui: UIState;
  regime: Regime;
  moeda: string;
  casas: number;
  entradas: Entradas;
  aliquotas: Aliquotas;
  resultado: Resultado | null;

  set:(p: Partial<AppState>)=>void;
  setAba:(a:UIState["aba"])=>void;
  toggleTema:()=>void;
  simulate:()=>void;
  reset:()=>void;
}

export const useStore = create<AppState>((set,get)=>({
  ui: { tema:"light", aba:"resumo" },
  regime: DEFAULTS.regime,
  moeda: DEFAULTS.moeda,
  casas: DEFAULTS.casas,
  entradas: DEFAULTS.entradas,
  aliquotas: DEFAULTS.aliquotas,
  resultado: null,

  set:(p)=>set(p),
  setAba:(a)=>set(s=>({ ui:{...s.ui,aba:a} })),
  toggleTema:()=>{
    const cur = get().ui.tema;
    const next = cur==="light"?"dark":"light";
    document.documentElement.setAttribute("data-theme", next);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", next==="dark" ? "#0b1220" : "#ffffff");
    set(s=>({ ui:{...s.ui, tema:next} }));
  },
  simulate:()=>{
    const s = get();
    const r = simular(s.regime, s.entradas, s.aliquotas);
    set({ resultado: r });
  },
  reset:()=>{
    set({
      regime: DEFAULTS.regime,
      moeda: DEFAULTS.moeda,
      casas: DEFAULTS.casas,
      entradas: DEFAULTS.entradas,
      aliquotas: DEFAULTS.aliquotas,
      resultado: null,
    });
  }
}));
TS

# =========================
# Common: Tabs / Dialog / Toasts wrappers
# =========================
cat > src/components/Common/Tabs.tsx <<'TSX'
import * as Tabs from "@radix-ui/react-tabs";
import React from "react";
import "../../styles/app.css";

export const AppTabs = Tabs.Root;
export const TabsList = (p:Tabs.TabsListProps)=>(
  <Tabs.List {...p} className={(p.className??"")+" card"} />
);
export const TabsTrigger = (p:Tabs.TabsTriggerProps)=>(
  <Tabs.Trigger {...p} className={(p.className??"")+" btn"} />
);
export const TabsContent = (p:Tabs.TabsContentProps)=>(
  <Tabs.Content {...p} className={(p.className??"")+" fade-in"} />
);
export default {AppTabs,TabsList,TabsTrigger,TabsContent};
TSX

cat > src/components/Common/Dialog.tsx <<'TSX'
import * as Dialog from "@radix-ui/react-dialog";
import React from "react";
export default Dialog;
TSX

cat > src/components/Common/Toasts.tsx <<'TSX'
import * as Toast from "@radix-ui/react-toast";
import React from "react";

export function ToastProvider({children}:{children:React.ReactNode}){
  return <Toast.Provider duration={2600}>{children}<Toast.Viewport /></Toast.Provider>;
}
export function useToast(){
  const [open,setOpen] = React.useState(false);
  const show = ()=>setOpen(true);
  const node = (
    <Toast.Root open={open} onOpenChange={setOpen}>
      <Toast.Title>Ação concluída</Toast.Title>
      <Toast.Description>Operação realizada com sucesso.</Toast.Description>
    </Toast.Root>
  );
  return { show, node };
}
TSX

# =========================
# AppShell: Topbar / Sidebar / BottomNav / ThemeToggle
# =========================
cat > src/components/AppShell/ThemeToggle.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle(){
  const tema = useStore(s=>s.ui.tema);
  const toggle = useStore(s=>s.toggleTema);
  return (
    <button aria-label="Alternar tema" className="btn" onClick={toggle} title="Tema">
      {tema==="dark"? <Sun size={16}/> : <Moon size={16}/>}
      {tema==="dark" ? "Claro" : "Escuro"}
    </button>
  );
}
TSX

cat > src/components/AppShell/Topbar.tsx <<'TSX'
import React from "react";
import ThemeToggle from "./ThemeToggle";
import { Printer } from "lucide-react";

export default function Topbar(){
  return (
    <header className="topbar">
      <div className="brand"><span className="dot"></span> <span>Simulador</span></div>
      <div style={{display:"flex",gap:8}}>
        <button className="btn" onClick={()=>window.print()}><Printer size={16}/> Exportar PDF</button>
        <ThemeToggle/>
      </div>
    </header>
  );
}
TSX

cat > src/components/AppShell/Sidebar.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";
import { Home, FileInput, Percent, Table, LineChart, Settings } from "lucide-react";

const items = [
  {key:"resumo", label:"Resumo", icon: Home},
  {key:"entradas", label:"Entradas", icon: FileInput},
  {key:"aliquotas", label:"Alíquotas", icon: Percent},
  {key:"relatorios", label:"Relatórios", icon: Table},
  {key:"graficos", label:"Gráficos", icon: LineChart},
  {key:"config", label:"Config", icon: Settings},
] as const;

export default function Sidebar(){
  const aba = useStore(s=>s.ui.aba);
  const setAba = useStore(s=>s.setAba);
  return (
    <aside className="sidebar">
      {items.map(it=>{
        const Icon = it.icon;
        const active = aba===it.key;
        return (
          <button key={it.key} className={"side-btn "+(active?"active":"")} onClick={()=>setAba(it.key as any)}>
            <Icon size={18}/><span>{it.label}</span>
          </button>
        )
      })}
    </aside>
  );
}
TSX

cat > src/components/AppShell/BottomNav.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";
import { Home, FileInput, Percent, Table, LineChart } from "lucide-react";

const items = [
  {key:"resumo", label:"Resumo", icon: Home},
  {key:"entradas", label:"Entradas", icon: FileInput},
  {key:"aliquotas", label:"Alíquotas", icon: Percent},
  {key:"relatorios", label:"Relatórios", icon: Table},
  {key:"graficos", label:"Gráficos", icon: LineChart},
] as const;

export default function BottomNav(){
  const aba = useStore(s=>s.ui.aba);
  const setAba = useStore(s=>s.setAba);
  return (
    <nav className="bottomnav">
      {items.map(it=>{
        const Icon = it.icon;
        const active = aba===it.key;
        return (
          <button key={it.key} className={"bn-btn "+(active?"active":"")} onClick={()=>setAba(it.key as any)}>
            <Icon size={18}/><span>{it.label}</span>
          </button>
        )
      })}
    </nav>
  );
}
TSX

# =========================
# Panels básicos (Resumo, Entradas, Alíquotas, Relatórios, Gráficos)
# =========================
cat > src/components/Panels/Resumo.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";
import { fmtMon } from "../../lib/format";

export default function Resumo(){
  const r = useStore(s=>s.resultado);
  return (
    <section className="grid cols-3">
      <div className="card kpi">
        <div>Tributos (Atual)</div>
        <div className="val">{fmtMon(r?.modeloAtual.total ?? 0)}</div>
      </div>
      <div className="card kpi">
        <div>Tributos (Novo)</div>
        <div className="val">{fmtMon(r?.modeloNovo.total ?? 0)}</div>
      </div>
      <div className="card kpi">
        <div>Diferença</div>
        <div className="val">{fmtMon(r?.comparativo.deltaAbs ?? 0)}</div>
      </div>
    </section>
  );
}
TSX

cat > src/components/Panels/EntradaForm.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";
import { parseBR } from "../../lib/format";

export default function EntradaForm(){
  const entradas = useStore(s=>s.entradas);
  const set = useStore(s=>s.set);
  return (
    <div className="card grid cols-3">
      <div><label>Receita</label><input defaultValue="100.000,00" onBlur={e=>set({entradas:{...entradas, receita: parseBR(e.currentTarget.value)}})} /></div>
      <div><label>Compras</label><input defaultValue="50.000,00" onBlur={e=>set({entradas:{...entradas, compras: parseBR(e.currentTarget.value)}})} /></div>
      <div><label>Despesas</label><input defaultValue="20.000,00" onBlur={e=>set({entradas:{...entradas, despesas: parseBR(e.currentTarget.value)}})} /></div>
    </div>
  );
}
TSX

cat > src/components/Panels/AliquotasTabs.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";
import { AppTabs, TabsList, TabsTrigger, TabsContent } from "../Common/Tabs";

export default function AliquotasTabs(){
  const a = useStore(s=>s.aliquotas);
  const set = useStore(s=>s.set);
  const setAliq = (k:keyof typeof a, v:number)=> set({ aliquotas:{...a, [k]: v} });
  return (
    <div className="card">
      <AppTabs defaultValue="consumo">
        <TabsList aria-label="Alíquotas">
          <TabsTrigger value="consumo">Consumo</TabsTrigger>
          <TabsTrigger value="lucro">Lucro</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
          <TabsTrigger value="opcoes">Opções</TabsTrigger>
        </TabsList>
        <TabsContent value="consumo">
          <div className="grid cols-4">
            <div><label>PIS</label><input defaultValue="0,65" onBlur={e=>setAliq("pis", Number(e.currentTarget.value.replace(",", "."))/100)} /></div>
            <div><label>COFINS</label><input defaultValue="3,00" onBlur={e=>setAliq("cofins", Number(e.currentTarget.value.replace(",", "."))/100)} /></div>
            <div><label>ISS</label><input defaultValue="5,00" onBlur={e=>setAliq("iss", Number(e.currentTarget.value.replace(",", "."))/100)} /></div>
            <div><label>CBS</label><input defaultValue="0,90" onBlur={e=>setAliq("cbs", Number(e.currentTarget.value.replace(",", "."))/100)} /></div>
            <div><label>IBS</label><input defaultValue="0,10" onBlur={e=>setAliq("ibs", Number(e.currentTarget.value.replace(",", "."))/100)} /></div>
          </div>
        </TabsContent>
        <TabsContent value="lucro">
          <p className="muted">Configurações de IRPJ/CSLL aqui (placeholder).</p>
        </TabsContent>
        <TabsContent value="outros">
          <p className="muted">Impostos adicionais (seletivo, etc.) — placeholder.</p>
        </TabsContent>
        <TabsContent value="opcoes">
          <p className="muted">Opções diversas do simulador — placeholder.</p>
        </TabsContent>
      </AppTabs>
    </div>
  );
}
TSX

# =========================
# Reports (tabelas simples)
# =========================
cat > src/components/Reports/AtualTable.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";

export default function AtualTable(){
  const r = useStore(s=>s.resultado?.modeloAtual);
  return (
    <div className="card">
      <h3>Modelo Atual</h3>
      <table className="table">
        <thead><tr><th>Componente</th><th>Valor</th></tr></thead>
        <tbody>
          {r ? Object.entries(r.detalhado).map(([k,v])=>(
            <tr key={k}><td>{k}</td><td>{v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td></tr>
          )) : <tr><td colSpan={2}>Sem dados</td></tr>}
        </tbody>
        <tfoot><tr><td>Total</td><td>{(r?.total ?? 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td></tr></tfoot>
      </table>
    </div>
  );
}
TSX

cat > src/components/Reports/NovoTable.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";

export default function NovoTable(){
  const r = useStore(s=>s.resultado?.modeloNovo);
  return (
    <div className="card">
      <h3>Novo Cenário</h3>
      <table className="table">
        <thead><tr><th>Componente</th><th>Valor</th></tr></thead>
        <tbody>
          {r ? Object.entries(r.detalhado).map(([k,v])=>(
            <tr key={k}><td>{k}</td><td>{v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td></tr>
          )) : <tr><td colSpan={2}>Sem dados</td></tr>}
        </tbody>
        <tfoot><tr><td>Total</td><td>{(r?.total ?? 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td></tr></tfoot>
      </table>
    </div>
  );
}
TSX

cat > src/components/Reports/Comparativo.tsx <<'TSX'
import React from "react";
import { useStore } from "../../state/store";
import { fmtMon, fmtPct } from "../../lib/format";

export default function Comparativo(){
  const c = useStore(s=>s.resultado?.comparativo);
  return (
    <div className="card kpi">
      <div>Delta</div>
      <div className="val">{fmtMon(c?.deltaAbs ?? 0)} ({fmtPct((c?.deltaPct ?? 0)*100)})</div>
    </div>
  );
}
TSX

cat > src/components/Reports/MiniCharts.tsx <<'TSX'
import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js";
import { useStore } from "../../state/store";
import { applyChartTheme } from "../../lib/charts";

export default function MiniCharts(){
  const tema = useStore(s=>s.ui.tema);
  const r = useStore(s=>s.resultado);
  const ref = useRef<HTMLCanvasElement|null>(null);

  useEffect(()=>{
    applyChartTheme(tema);
    const ctx = ref.current?.getContext("2d");
    if(!ctx) return;
    const data = r ? [r.modeloAtual.total, r.modeloNovo.total] : [0,0];
    const chart = new Chart(ctx, {
      type: "bar",
      data: { labels:["Atual","Novo"], datasets:[{ data }] },
      options: { responsive:true, plugins:{legend:{display:false}} }
    });
    return ()=>chart.destroy();
  },[tema,r]);

  return <div className="card"><h3>Gráfico rápido</h3><canvas ref={ref} height={120}/></div>;
}
TSX

# =========================
# App.tsx (AppShell + navegação de abas)
# =========================
cat > src/App.tsx <<'TSX'
import React, { useEffect } from "react";
import "./styles/theme.css";
import "./styles/app.css";
import Topbar from "./components/AppShell/Topbar";
import Sidebar from "./components/AppShell/Sidebar";
import BottomNav from "./components/AppShell/BottomNav";
import Resumo from "./components/Panels/Resumo";
import EntradaForm from "./components/Panels/EntradaForm";
import AliquotasTabs from "./components/Panels/AliquotasTabs";
import AtualTable from "./components/Reports/AtualTable";
import NovoTable from "./components/Reports/NovoTable";
import Comparativo from "./components/Reports/Comparativo";
import MiniCharts from "./components/Reports/MiniCharts";
import { useStore } from "./state/store";

export default function App(){
  const aba = useStore(s=>s.ui.aba);
  const simulate = useStore(s=>s.simulate);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="enter"){ e.preventDefault(); simulate(); }
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[simulate]);

  return (
    <div className="app-wrap">
      <Topbar/>
      <Sidebar/>
      <main className="content" id="app-root">
        {aba==="resumo" && (<div className="grid cols-3">
          <Resumo/>
          <MiniCharts/>
          <Comparativo/>
        </div>)}
        {aba==="entradas" && (<div className="grid"><EntradaForm/></div>)}
        {aba==="aliquotas" && (<div className="grid"><AliquotasTabs/></div>)}
        {aba==="relatorios" && (<div className="grid cols-2"><AtualTable/><NovoTable/></div>)}
        {aba==="graficos" && (<div className="grid"><MiniCharts/></div>)}
        {aba==="config" && (<div className="card">Configurações (placeholder)</div>)}
      </main>

      <button className="fab" onClick={simulate}>Simular</button>
      <BottomNav/>
    </div>
  );
}
TSX

# =========================
# main.tsx
# =========================
cat > src/main.tsx <<'TSX'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useStore } from "./state/store"; // side-effect init
import { applyChartTheme } from "./lib/charts";

// sincroniza tema inicial
document.documentElement.setAttribute("data-theme","light");
applyChartTheme("light");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
TSX

# =========================
# vite.config.ts (PWA opcional)
# =========================
if [ "${USE_PWA}" = "true" ]; then
cat > vite.config.ts <<'TS'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/app-192.png','icons/app-512.png'],
      manifest: {
        name: 'Simulador • Fiscal Flash',
        short_name: 'Simulador',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/app-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/app-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
})
TS
else
cat > vite.config.ts <<'TS'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
TS
fi

# =========================
# Ícones placeholder
# =========================
cat > public/icons/app-192.png <<'BIN'
$(printf "")
BIN
cat > public/icons/app-512.png <<'BIN'
$(printf "")
BIN

# =========================
# package.json scripts (ajuste)
# =========================
node - <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts = Object.assign({}, pkg.scripts, {
  dev: "vite",
  build: "vite build",
  preview: "vite preview",
  test: "vitest --run",
  lint: "echo 'Add ESLint config if desejado'"
});
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
NODE

echo ">> Pronto! Para iniciar:"
echo "   cd ${PROJECT_NAME}"
echo "   ${PKG_MANAGER} run dev"
echo
echo "SMOKE TEST:"
echo "  1) Vá em Entradas e ajuste os valores."
echo "  2) Clique em 'Simular' (ou Ctrl+Enter)."
echo "  3) Veja Resumo/Relatórios/Gráficos atualizarem."
echo "  4) Troque o tema no topo e confirme que o gráfico muda o esquema."
echo
echo ">>> Para portar sua lógica real, edite src/lib/calc.ts (substitua o SHIM pelas fórmulas do seu main.js)."
