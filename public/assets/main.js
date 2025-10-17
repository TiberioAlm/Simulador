const el = id => document.getElementById(id);
const safe = id => ({ has: !!el(id), add: (c)=>{const n=el(id); if(n) n.classList.add(c)}, remove: (c)=>{const n=el(id); if(n) n.classList.remove(c)}, toggle: (c,on)=>{const n=el(id); if(n) n.classList.toggle(c,on)} });
const casas = () => +(el('casas')?.value || 2);
const moedaSel = () => (el('moeda')?.value || 'BRL');
const parseBR = v => parseFloat((v||'').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',', '.')) || 0;
const fmtMon = n => new Intl.NumberFormat(moedaSel()==='USD'?'en-US':'pt-BR', { style:'currency', currency: moedaSel()==='USD'?'USD':'BRL', minimumFractionDigits: casas(), maximumFractionDigits: casas() }).format(n||0);
const fmtPct = n => (isFinite(n) ? (n).toFixed(2).replace('.', ',')+'%' : '—');
const fmtAliq = aliq => { if(aliq===null || aliq===undefined || aliq==='—') return '—'; if(typeof aliq === 'string') return aliq; const num=Number(aliq); if(!isFinite(num)) return '—'; return `${(num*100).toFixed(2).replace('.',',')}%`; };
const fmtBase = base => { if(base===null || base===undefined || base==='—') return '—'; if(typeof base === 'string') return base; if(typeof base === 'number' && isFinite(base)) return fmtMon(base); const num=Number(base); return isFinite(num)?fmtMon(num):'—'; };
const isHidden = node => !node || node.classList.contains('hidden');
const clamp01 = n => Math.min(Math.max(n,0),1);
const SCENARIO_CONFIG={
  piloto2026:{ title:'Piloto 2026 — IBS teste de 1% (compensado)', total:'Total (Piloto 2026)', legacyShare:1, ibsShare:0, auto:{ cbs:0.9, ibs:0.1, seletivo:0 } },
  cbs2027:{ title:'CBS + tributos legados (2027–2028)', total:'Total (2027–2028)', legacyShare:1, ibsShare:0, auto:{ cbs:8.7, ibs:0.1, seletivo:0 } },
  ibs2029:{ title:'Transição do IBS (2029 — 10%)', total:'Total (2029)', legacyShare:0.9, ibsShare:0.1, auto:{ cbs:8.8, ibs:1.77 } },
  ibs2030:{ title:'Transição do IBS (2030 — 20%)', total:'Total (2030)', legacyShare:0.8, ibsShare:0.2, auto:{ cbs:8.8, ibs:3.54 } },
  ibs2031:{ title:'Transição do IBS (2031 — 30%)', total:'Total (2031)', legacyShare:0.7, ibsShare:0.3, auto:{ cbs:8.8, ibs:5.31 } },
  ibs2032:{ title:'Transição do IBS (2032 — 40%)', total:'Total (2032)', legacyShare:0.6, ibsShare:0.4, auto:{ cbs:8.8, ibs:7.08 } },
  regime2033:{ title:'Regime definitivo (2033+ — CBS/IBS)', total:'Total (2033+)', legacyShare:0, ibsShare:1, auto:{ cbs:8.8, ibs:17.7 } }
};

// Trava/destrava Cenário e Regime somente com item simulado
const lockGlobalConfigIfHasItems = () => {
  const has = (hasSimulated === true) && baseDataset.length > 0;
  const cSel = el('cenario'); if(cSel) cSel.disabled = has;
  const rSel = el('regimeTrib'); if(rSel) rSel.disabled = has;
};
const currentScenario = () => el('cenario')?.value || 'piloto2026';
const DEFAULT_ACTIVITY_ID = 'servicos_gerais';
const OPERATION_ACTIVITIES = {
  // Serviços
  servicos_gerais:{ id:'servicos_gerais', label:'Serviços', tipoOper:'servico', presKey:'servicos', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  servicos_profissionais:{ id:'servicos_profissionais', label:'Profissionais', tipoOper:'servico', presKey:'servicos', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  saude:{ id:'saude', label:'Saúde', tipoOper:'servico', presKey:'hospitalar', presAliqIrpj:8, presAliqCsll:12, aliqOutros:0 },
  ti_software:{ id:'ti_software', label:'TI / Software', tipoOper:'servico', presKey:'servicos', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  educacao:{ id:'educacao', label:'Educação', tipoOper:'servico', presKey:'servicos', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  transporte_cargas:{ id:'transporte_cargas', label:'Transp. cargas', tipoOper:'servico', presKey:'transportes', presAliqIrpj:8, presAliqCsll:12, aliqOutros:0 },
  transporte_passageiros:{ id:'transporte_passageiros', label:'Transp. passageiros', tipoOper:'servico', presKey:'passageiros', presAliqIrpj:16, presAliqCsll:12, aliqOutros:0 },
  alimentacao_bares_rest:{ id:'alimentacao_bares_rest', label:'Alimentação', tipoOper:'servico', presKey:'servicos', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  construcao_empreitada:{ id:'construcao_empreitada', label:'Construção', tipoOper:'servico', presKey:'servicos', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  locacao_imobiliaria:{ id:'locacao_imobiliaria', label:'Locação imob.', tipoOper:'none', presKey:'locacao', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  locacao_moveis:{ id:'locacao_moveis', label:'Locação bens', tipoOper:'servico', presKey:'servicos', presAliqIrpj:32, presAliqCsll:32, aliqOutros:0 },
  // Comércio e Indústria
  comercio_varejo:{ id:'comercio_varejo', label:'Varejo', tipoOper:'mercadoria', presKey:'comercio', presAliqIrpj:8, presAliqCsll:12, aliqOutros:0 },
  comercio_atacado:{ id:'comercio_atacado', label:'Atacado', tipoOper:'mercadoria', presKey:'comercio', presAliqIrpj:8, presAliqCsll:12, aliqOutros:0 },
  comercio_online:{ id:'comercio_online', label:'E‑commerce', tipoOper:'mercadoria', presKey:'comercio', presAliqIrpj:8, presAliqCsll:12, aliqOutros:0 },
  industria_fabricacao:{ id:'industria_fabricacao', label:'Indústria', tipoOper:'mercadoria', presKey:'comercio', presAliqIrpj:8, presAliqCsll:12, aliqOutros:0 },
  combustiveis_revenda:{ id:'combustiveis_revenda', label:'Combustíveis', tipoOper:'mercadoria', presKey:'combustiveis', presAliqIrpj:1.6, presAliqCsll:12, aliqOutros:0 },
  // Especiais
  construcao_ret:{ id:'construcao_ret', label:'Construção – RET', tipoOper:'servico', presKey:'retpa', presAliqIrpj:4, presAliqCsll:4, aliqOutros:4 },
  custom:{ id:'custom', label:'Personalizado', tipoOper:null }
};
let suppressTipoOperSync = false;
let suppressActivitySync = false;
let suppressActivityPreset = false;

const RECEITAS_DEFAULT_TAB = 'receitas';
const receitasTabsState = { current: RECEITAS_DEFAULT_TAB };
const baseDataset = [];
let hasSimulated = false;
// inline editing per-item is controlled by item.uiEditing (boolean)

// Quick KPI updater
const updateQuickStats = () => {
  try{
    const receita = parseBR(el('receita')?.value);
    const comprasAtualWrap = document.getElementById('wrapComprasAtual');
    const comprasNovoWrap = document.getElementById('wrapComprasNovo');
    const comprasICMSWrap = document.getElementById('wrapComprasICMS');
    const comprasAtual = isHidden(comprasAtualWrap) ? 0 : parseBR(el('comprasAtual')?.value);
    const comprasNovo = isHidden(comprasNovoWrap) ? 0 : parseBR(el('comprasNovo')?.value);
    const comprasICMS = isHidden(comprasICMSWrap) ? 0 : parseBR(el('comprasICMS')?.value);
    const comprasSum = Math.max(0, (comprasAtual||0)+(comprasNovo||0)+(comprasICMS||0));
    const regime = el('regimeTrib')?.value || 'real';
    const regimeTxt = (()=>{ const opt=el('regimeTrib')?.selectedOptions?.[0]; return opt?opt.textContent.trim():regime; })();
    const c = currentScenario();
    const cfg = SCENARIO_CONFIG[c] || SCENARIO_CONFIG.regime2033;
    const aliqSum = (cfg.auto?.cbs||0) + (cfg.auto?.ibs||0);
    const cLabel = (el('cenario')?.selectedOptions?.[0]?.textContent || '').trim();
    if(el('qsReceitaVal')) el('qsReceitaVal').textContent = fmtMon(receita||0);
    if(el('qsComprasVal')) el('qsComprasVal').textContent = fmtMon(comprasSum||0);
    if(el('qsRegimeVal')) el('qsRegimeVal').textContent = regimeTxt || '—';
    if(el('qsAliqVal')) el('qsAliqVal').textContent = `CBS+IBS: ${fmtPct(aliqSum)}`;
    if(el('qsAliqHint')) el('qsAliqHint').textContent = `Cenário: ${cLabel||'—'}`;
  }catch(_){ /* noop */ }
};

const scenarioDisplayName = code => {
  const opt = el('cenario')?.querySelector(`option[value="${code}"]`);
  if(opt) return opt.textContent.trim();
  const cfg = SCENARIO_CONFIG[code];
  return cfg?.title || code;
};

const regimeDisplayName = value => {
  const opt = el('regimeTrib')?.querySelector(`option[value="${value}"]`);
  if(opt) return opt.textContent.trim();
  const map = { simples:'Simples Nacional', presumido:'Lucro Presumido', real:'Lucro Real' };
  return map[value] || value || '—';
};

const tipoDisplayName = value => {
  if(value==='servico') return 'Serviço (ISS)';
  if(value==='mercadoria') return 'Mercadoria (ICMS)';
  if(value==='none') return 'Sem incidência';
  return value || '—';
};

const collectEntryFromUI = (opts={}) => {
  const includeMeta = opts.includeMeta !== false;
  const numberField = id => {
    const node = el(id);
    if(!node) return 0;
    const raw = String(node.value ?? '').replace(',', '.');
    const num = parseFloat(raw);
    return isFinite(num) ? num : 0;
  };
  const check = id => !!el(id)?.checked;
  const selectLabel = id => {
    const node = el(id);
    const option = node?.selectedOptions?.[0];
    return option ? option.textContent.trim() : '';
  };

  const percentField = id => {
    const node = el(id);
    if(!node) return null;
    const raw = String(node.value ?? '').trim().replace(',', '.');
    if(raw==='') return null;
    const num = parseFloat(raw);
    return isFinite(num) ? num : null;
  };

  const cenario = currentScenario();
  const regime = el('regimeTrib')?.value || 'real';
  const _actCfg = (()=>{ const a=el('atividadeOper')?.value||DEFAULT_ACTIVITY_ID; return OPERATION_ACTIVITIES[a]||OPERATION_ACTIVITIES.custom; })();
  const tipo = el('tipoOper')?.value || _actCfg.tipoOper || 'servico';
  const atividadeSel = el('atividadeOper');
  const atividadeId = atividadeSel?.value || DEFAULT_ACTIVITY_ID;
  const atividadeLabel = atividadeSel?.selectedOptions?.[0]?.textContent.trim() || 'Personalizado';
  const presAtividade = _actCfg.presKey || (tipo==='mercadoria' ? 'comercio' : 'servicos');
  const snAnexoSel = el('snAnexo');

  const reductions = {
    ativo: true
  };
  Object.entries(REDUCTIONS).forEach(([key,cfg])=>{
    const sel = el(cfg.select);
    const input = el(cfg.input);
    const optVal = sel?.value ?? '0';
    const customValRaw = input?.value ?? '0';
    const customNum = parseFloat(String(customValRaw).replace(',', '.'));
    reductions[key] = {
      opt: optVal,
      custom: isFinite(customNum) ? customNum : 0
    };
  });

  const defaultAnexo = tipo==='mercadoria' ? 'I' : 'III';
  const entry = {
    cenario,
    cenarioLabel: scenarioDisplayName(cenario),
    regime,
    regimeLabel: regimeDisplayName(regime),
    tipo,
    tipoLabel: tipoDisplayName(tipo),
    atividade: atividadeId,
    atividadeLabel,
    receita: parseBR(el('receita')?.value),
    comprasNovo: parseBR(el('comprasNovo')?.value),
    comprasAtual: parseBR(el('comprasAtual')?.value),
    comprasICMS: parseBR(el('comprasICMS')?.value),
    baseSeletivo: parseBR(el('baseSeletivo')?.value),
    despesasLucroReal: parseBR(el('despesasLucroReal')?.value),
    meses: parseInt(el('meses')?.value, 10) || 0,
    pis: numberField('pis'),
    cofins: numberField('cofins'),
    iss: numberField('iss'),
    icms: numberField('icms'),
    ipi: numberField('ipi'),
    cbs: numberField('cbs'),
    ibs: numberField('ibs'),
    seletivo: numberField('seletivo'),
    irpj: numberField('irpj'),
    csll: numberField('csll'),
    cpp: numberField('cpp'),
    aliqOutros: numberField('aliqOutros'),
    incPisCof: !!el('incPisCof')?.checked,
    incIssIcms: !!el('incIssIcms')?.checked,
    incIpi: !!el('incIpi')?.checked,
    incCbsIbs: !!el('incCbsIbs')?.checked,
    incSeletivo: !!el('incSeletivo')?.checked,
    incIrpj: !!el('incIrpj')?.checked,
    incCsll: !!el('incCsll')?.checked,
    incOutros: !!el('incOutros')?.checked,
    presAliqIrpj: percentField('presAliqIrpj'),
    presAliqCsll: percentField('presAliqCsll'),
    consideraCredAtual: check('consideraCredAtual'),
    consideraCredICMS: check('consideraCredICMS'),
    consideraCredNovo: check('consideraCredNovo'),
    presAtividade,
    presAtividadeLabel: presAtividade,
    reducoes: reductions,
    snAnexo: snAnexoSel?.value || defaultAnexo,
    snAnexoLabel: selectLabel('snAnexo'),
    snFatorToggle: check('snFatorToggle'),
    snCompararFora: check('snCompararFora'),
    snRbt12: parseBR(el('snRbt12')?.value),
    moedaAtual: el('moeda')?.value || 'BRL'
  };

  if(includeMeta){
    entry.id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    entry.addedAt = new Date();
  }
  return entry;
};

const captureBaseDatasetEntry = () => {
  const entry = collectEntryFromUI();
  baseDataset.push(entry);
  renderBaseDataset();
  if(typeof lockGlobalConfigIfHasItems==='function') lockGlobalConfigIfHasItems();
  return entry;
};

const removeBaseDatasetEntry = id => {
  const idx = baseDataset.findIndex(item => item.id === id);
  if(idx === -1) return;
  baseDataset.splice(idx,1);
  renderBaseDataset();
  if(baseDataset.length){
    calcula();
  } else {
    clearSimulationOutputs();
    const statusEl = el('status');
    if(statusEl) statusEl.textContent = 'Base vazia';
  }
};

const renderBaseDataset = () => {
  const listEl = el('baseDatasetLista');
  const resumoEl = el('baseDatasetResumo');
  const info = el('baseDatasetInfo');
  if(info) info.textContent = `Itens na base: ${baseDataset.length}`;
  if(!listEl) return;
  if(!baseDataset.length){
    if(resumoEl) resumoEl.innerHTML = '';
    listEl.innerHTML = '<div class="text-sm text-slate-500">Nenhum item cadastrado.</div>';
    return;
  }
  const totals = baseDataset.reduce((acc,item)=>{
    acc.receita += item.receita||0;
    acc.comprasNovo += item.comprasNovo||0;
    acc.comprasAtual += item.comprasAtual||0;
    acc.comprasICMS += item.comprasICMS||0;
    acc.baseSeletivo += item.baseSeletivo||0;
    acc.despesas += item.despesasLucroReal||0;
    return acc;
  },{receita:0,comprasNovo:0,comprasAtual:0,comprasICMS:0,baseSeletivo:0,despesas:0});
  const globalMeses = parseInt(el('meses')?.value,10) || 1;
  const formatPct = v => `${(isFinite(v)?v:0).toFixed(2).replace('.',',')}%`;
  const boolLabel = v => v ? 'Sim' : 'Não';
  const reductionLabel = (key,label,item) => {
    const red=item.reducoes?.[key];
    if(!item.reducoes?.ativo || !red) return `${label}: 0%`;
    if(red.opt==='custom') return `${label}: ${formatPct(red.custom||0)}`;
    const optNum=parseFloat(red.opt);
    return `${label}: ${formatPct(isFinite(optNum)?optNum*100:0)}`;
  };

  // Resumo em mini-cards padronizados
  if(resumoEl){
    resumoEl.innerHTML = `
      <div class="mini-stat" data-kind="receita">
        <span class="mini-stat__label">Receita total</span>
        <span class="mini-stat__value">${fmtMon(totals.receita)}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M12 8v8"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
        </span>
      </div>
      <div class="mini-stat" data-kind="compras">
        <span class="mini-stat__label">Compras – CBS/IBS</span>
        <span class="mini-stat__value">${fmtMon(totals.comprasNovo)}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </span>
      </div>
      <div class="mini-stat" data-kind="compras">
        <span class="mini-stat__label">Compras – PIS/COFINS</span>
        <span class="mini-stat__value">${fmtMon(totals.comprasAtual)}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2l.344 2.75A4 4 0 0 0 10.31 8H19a2 2 0 0 1 2 2v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7a5 5 0 0 1 2-4l0 0z"/></svg>
        </span>
      </div>
      <div class="mini-stat" data-kind="compras">
        <span class="mini-stat__label">Compras – ICMS</span>
        <span class="mini-stat__value">${fmtMon(totals.comprasICMS)}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 7h18"/></svg>
        </span>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__label">Base Seletivo</span>
        <span class="mini-stat__value">${fmtMon(totals.baseSeletivo)}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </span>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__label">Despesas (LR)</span>
        <span class="mini-stat__value">${fmtMon(totals.despesas)}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6a2 2 0 0 1 2 2v14l-5-3-5 3V5a2 2 0 0 1 2-2z"/></svg>
        </span>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__label">Meses acum.</span>
        <span class="mini-stat__value">${globalMeses}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </span>
        <span class="mini-stat__action"><button class="icon-btn" data-edit-kind="meses" title="Editar meses" aria-label="Editar meses">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button></span>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__label">Itens</span>
        <span class="mini-stat__value">${baseDataset.length}</span>
        <span class="mini-stat__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
        </span>
      </div>
    `;
  }

  // Cartões por item (modelo widget.html adaptado)
  const cards = baseDataset.map((item,idx)=>{
      const res = evaluateEntry(item);
      const tipoCurto = item.tipo==='mercadoria'?'Mercadoria (ICMS)': item.tipo==='servico'?'Serviço (ISS)':'Sem incidência';
      const chipsTop = [`<span class=\"w-chip\">${item.cenarioLabel||''}</span>`, `<span class=\"w-chip\">${item.regimeLabel} • ${item.tipoLabel}</span>`, `<span class=\"w-chip w-chip--ok\">Total (Atual): ${fmtMon(res.totalAtual||0)}</span>`, `<span class=\"w-chip w-chip--ok\">Total (Cenário): ${fmtMon(res.totalNovo||0)}</span>`].join('');

      const V = (()=>{
        const id = item.id;
        const money = (field,val)=>`<input type="text" class="w-input${item.uiEditing?'':' opacity-60 bg-slate-100'}" data-item="${id}" data-kind="money" data-field="${field}" value="${fmtMon(val||0)}"${item.uiEditing?'':' disabled'} inputmode="decimal" />`;
        const int = (field,val)=>`<input type="number" min="1" step="1" class="w-input${item.uiEditing?'':' opacity-60 bg-slate-100'}" data-item="${id}" data-kind="int" data-field="${field}" value="${val||1}"${item.uiEditing?'':' disabled'} inputmode="numeric" pattern="[0-9]*" />`;
        const rows = [
          ['Receita', money('receita', item.receita)],
          ['Compras – CBS/IBS', money('comprasNovo', item.comprasNovo)],
          ['Compras – PIS/COFINS', money('comprasAtual', item.comprasAtual)],
          ['Compras – ICMS', money('comprasICMS', item.comprasICMS)],
          ['Base Seletivo', money('baseSeletivo', item.baseSeletivo)],
          ...(item.regime==='real' ? [['Despesas (LR)', money('despesasLucroReal', item.despesasLucroReal)]] : []),
          ['Meses', int('meses', item.meses||1)]
        ];
        return rows.map(([k,v])=>`<div class="w-kv"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
      })();

      const inc = {
        pisCof: item.incPisCof !== false && item.regime!=='simples',
        issIcms: item.incIssIcms !== false,
        cbsIbs: item.incCbsIbs !== false,
        ipi: item.incIpi !== false,
        seletivo: item.incSeletivo !== false,
        irpj: item.incIrpj !== false,
        csll: item.incCsll !== false,
        outros: item.incOutros !== false,
        cpp: item.cpp !== undefined
      };
      const pct = (field,val)=>`<input type="number" min="0" step="0.01" class="w-input number-input pct-input${item.uiEditing?'':' opacity-60 bg-slate-100'}" data-item="${item.id}" data-kind="pct" data-field="${field}" value="${Number(val||0)}"${item.uiEditing?'':' disabled'} inputmode="decimal" />`;
      const aliqs = [];
      if(inc.pisCof){ aliqs.push(['PIS', item.pis, 'pis'], ['COFINS', item.cofins, 'cofins']); }
      if(inc.issIcms){ const isMerc=item.tipo==='mercadoria'; aliqs.push([isMerc?'ICMS':'ISS', isMerc?item.icms:item.iss, isMerc?'icms':'iss']); }
      if(inc.cbsIbs){ aliqs.push(['CBS', item.cbs, 'cbs'], ['IBS', item.ibs, 'ibs']); }
      if(inc.ipi){ aliqs.push(['IPI', item.ipi, 'ipi']); }
      if(inc.seletivo){ aliqs.push(['Seletivo', item.seletivo, 'seletivo']); }
      if(inc.irpj){ aliqs.push(['IRPJ', item.irpj, 'irpj']); }
      if(inc.csll){ aliqs.push(['CSLL', item.csll, 'csll']); }
      if(inc.cpp){ aliqs.push(['CPP', item.cpp, 'cpp']); }
      if(inc.outros){ aliqs.push(['Outros', item.aliqOutros||0, 'aliqOutros']); }
      const aliqsHTML = aliqs.map(([label,val,field])=>{
        const v = Number(val)||0; const cls = v>0 ? 'ok' : 'off';
        const editor = item.uiEditing ? pct(field,v) : fmtPct(v);
        return `<div class="w-aliq ${cls}"><div class="k">${label}</div><div class="v">${editor}</div></div>`;
      }).join('');

      const getRed = (key) => Math.round((getReductionForEntry(item,key)||0)*10000)/100; // percent 0..100
      const id = item.id;
      const chips = [];
      // Créditos (Opções) — editáveis somente quando em modo edição
      const credited = (ok)=> ok ? 'w-chip--ok' : 'w-chip--off';
      const dis = item.uiEditing ? '' : ' disabled="disabled"';
      chips.push(`<button type=\"button\" class=\"w-chip ${credited(!!item.consideraCredAtual)}\" aria-pressed=\"${item.consideraCredAtual?'true':'false'}\" data-opt-toggle=\"credAtual\" data-item=\"${id}\"${item.uiEditing?'':' tabindex=\"-1\" title=\"Ative edição para alterar\"'}><strong>Créd. PIS/COFINS:</strong> ${item.consideraCredAtual?'Sim':'Não'}</button>`);
      chips.push(`<button type=\"button\" class=\"w-chip ${credited(!!item.consideraCredICMS)}\" aria-pressed=\"${item.consideraCredICMS?'true':'false'}\" data-opt-toggle=\"credIcms\" data-item=\"${id}\"${item.uiEditing?'':' tabindex=\"-1\" title=\"Ative edição para alterar\"'}><strong>Créd. ICMS:</strong> ${item.consideraCredICMS?'Sim':'Não'}</button>`);
      chips.push(`<button type=\"button\" class=\"w-chip ${credited(!!item.consideraCredNovo)}\" aria-pressed=\"${item.consideraCredNovo?'true':'false'}\" data-opt-toggle=\"credNovo\" data-item=\"${id}\"${item.uiEditing?'':' tabindex=\"-1\" title=\"Ative edição para alterar\"'}><strong>Créd. CBS/IBS:</strong> ${item.consideraCredNovo?'Sim':'Não'}</button>`);
      // Reduções (Deduções)
      const pushRed = (key,label)=>{ const v=getRed(key); const cls = v>0?'w-chip--warn':'w-chip--off'; chips.push(`<button type=\"button\" class=\"w-chip ${cls}\" data-reduction=\"${key}\" data-item=\"${id}\"><strong>${label}:</strong> ${fmtPct(v)}</button>`); };
      if(inc.pisCof) pushRed('pisCof','PIS/COFINS');
      if(inc.issIcms) pushRed('issIcms', item.tipo==='mercadoria'?'ICMS':'ISS');
      if(inc.cbsIbs) pushRed('cbsIbs','CBS/IBS');
      if(inc.ipi) pushRed('ipi','IPI');
      if(inc.seletivo) pushRed('seletivo','Seletivo');
      if(inc.irpj) pushRed('irpj','IRPJ');
      // Divide visualmente em Opções (créditos) e Deduções (reduções)
      const optsCredits = chips.filter(h=> h.includes('data-opt-toggle')).join('');
      const optsReductions = chips.filter(h=> h.includes('data-reduction')).join('');
      const optsHTML = `
        <div class=\"w-chips-group\">
          <div class=\"w-chips-head\">Opções <span class=\"help-tip\" title=\"Créditos a abater das bases de cálculo (PIS/COFINS, ICMS, CBS/IBS).\">?</span></div>
          <div class=\"w-chips\">${optsCredits || '<span class="text-xs text-slate-500">Sem opções</span>'}</div>
        </div>
        <div class=\"w-chips-group\">
          <div class=\"w-chips-head\">Deduções <span class=\"help-tip\" title=\"Benefícios e tratamentos que reduzem alíquotas/bases (ex.: isenções, incentivos).\">?</span></div>
          <div class=\"w-chips\">${optsReductions || '<span class="text-xs text-slate-500">Sem deduções</span>'}</div>
        </div>`;
      // Deduções em grid (editável)
      const dedPct = (key,val)=>`<input type=\"number\" min=\"0\" max=\"100\" step=\"0.01\" class=\"w-input number-input pct-input${item.uiEditing?'':' opacity-60 bg-slate-100'}\" data-item=\"${item.id}\" data-kind=\"ded\" data-field=\"${key}\" value=\"${Number(val||0)}\"${item.uiEditing?'':' disabled'} inputmode=\"decimal\" />`;
      const dedsArr = [];
      if(inc.pisCof) dedsArr.push(['PIS/COFINS','pisCof', getRed('pisCof')]);
      if(inc.issIcms) dedsArr.push([item.tipo==='mercadoria'?'ICMS':'ISS','issIcms', getRed('issIcms')]);
      if(inc.cbsIbs) dedsArr.push(['CBS/IBS','cbsIbs', getRed('cbsIbs')]);
      if(inc.ipi) dedsArr.push(['IPI','ipi', getRed('ipi')]);
      if(inc.seletivo) dedsArr.push(['Seletivo','seletivo', getRed('seletivo')]);
      if(inc.irpj) dedsArr.push(['IRPJ','irpj', getRed('irpj')]);
      const dedGridHTML = dedsArr.map(([label,key,val])=>{ const v=Number(val)||0; const cls=v>0?'ok':'off'; const editor = item.uiEditing ? dedPct(key,v) : fmtPct(v); return `<div class=\"w-aliq ${cls}\"><div class=\"k\">${label}</div><div class=\"v\">${editor}</div></div>`; }).join('');

      return `
      <article class="card" data-entry-id="${item.id}">
        <div class="flex items-center justify-between gap-3 mb-3">
          <div>
            <div class="font-medium">Item ${idx+1}</div>
            <div class="text-xs text-slate-500">${item.cenarioLabel||''} · ${tipoCurto} · ${item.regimeLabel}</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-soft" data-entry-edit="${item.id}" title="${item.uiEditing?'Concluir edição':'Editar item'}" aria-label="${item.uiEditing?'Concluir edição':'Editar item'}">${item.uiEditing?'Concluir':'Editar'}</button>
            <button class="btn btn-ghost" data-base-remove="${item.id}" title="Excluir item" aria-label="Excluir item">Excluir</button>
          </div>
        </div>
        <div class="w-chips mb-2">${chipsTop}</div>
        <div class="grid grid-cols-12 gap-4">
          <section class="section-block col-span-12 lg:col-span-6">
            <div class="section-block__header">
              <span class="section-block__label">Cenário & Config</span>
              <span class="section-block__hint">Editar inline</span>
            </div>
            <div class="section-block__content">
              <div class="w-kv"><div class="k">Cenário</div><div class="v">${(()=>{ const sel=el('cenario'); const opts=sel?Array.from(sel.options).map(o=>`<option value=\"${o.value}\" ${o.value===item.cenario?'selected':''}>${o.textContent.trim()}</option>`).join(''):Object.keys(SCENARIO_CONFIG).map(k=>`<option value=\"${k}\" ${k===item.cenario?'selected':''}>${SCENARIO_CONFIG[k].title}</option>`).join(''); const dis=item.uiEditing?'':' disabled'; return `<select class=\"w-select\" data-item=\"${item.id}\" data-field=\"cenario\"${dis}>${opts}</select>`; })()}</div></div>
              <div class="w-kv"><div class="k">Regime</div><div class="v"><select class="w-select" data-item="${item.id}" data-field="regime"${item.uiEditing?'':' disabled'}><option value="simples" ${item.regime==='simples'?'selected':''}>Simples Nacional</option><option value="presumido" ${item.regime==='presumido'?'selected':''}>Lucro Presumido</option><option value="real" ${item.regime==='real'?'selected':''}>Lucro Real</option></select></div></div>
              <div class="w-kv"><div class="k">Tipo</div><div class="v"><select class="w-select" data-item="${item.id}" data-field="tipo"${item.uiEditing?'':' disabled'}><option value="servico" ${item.tipo==='servico'?'selected':''}>Serviço (ISS)</option><option value="mercadoria" ${item.tipo==='mercadoria'?'selected':''}>Mercadoria (ICMS)</option><option value="none" ${item.tipo==='none'?'selected':''}>Sem incidência</option></select></div></div>
            </div>
          </section>
          <section class="section-block col-span-12 lg:col-span-6">
            <div class="section-block__header">
              <span class="section-block__label">Valores</span>
              <span class="section-block__hint">Base do cálculo</span>
            </div>
            <div class="section-block__content">
              ${V}
            </div>
          </section>
          <section class="section-block col-span-12">
            <div class="section-block__header">
              <span class="section-block__label">Alíquotas</span>
              <span class="section-block__hint">Percentuais declarados</span>
            </div>
            <div class="section-block__content"><div class="w-aliq-grid">${aliqsHTML}</div></div>
          </section>
          <section class="section-block col-span-12 lg:col-span-6">
            <div class="section-block__header">
              <span class="section-block__label">Opções</span>
              <span class="section-block__hint">Créditos</span>
            </div>
            <div class="section-block__content"><div class="opts-only">${optsHTML}</div></div>
          </section>
          <section class="section-block col-span-12 lg:col-span-6">
            <div class="section-block__header">
              <span class="section-block__label">Deduções</span>
              <span class="section-block__hint">Reduções por tributo</span>
            </div>
            <div class="section-block__content"><div class="w-aliq-grid">${dedGridHTML || '<div class=\\"text-xs text-slate-500\\">Sem deduções</div>'}</div></div>
          </section>
        </div>
      </article>`;
  }).join('');

  listEl.innerHTML = cards;
  if(typeof lockGlobalConfigIfHasItems==='function') lockGlobalConfigIfHasItems();
  // mini-stat actions (edit aggregate)
  const resumoWrap = el('baseDatasetResumo');
  resumoWrap?.addEventListener('click', ev=>{
    const btn = ev.target.closest('[data-edit-kind]');
    if(!btn) return;
    const kind = btn.getAttribute('data-edit-kind');
    if(kind==='meses'){
      const cur = parseInt(el('meses')?.value,10) || 1;
      const next = prompt('Definir meses do período:', String(cur));
      if(next!=null){
        const val = Math.max(1, parseInt(String(next).trim(),10)||1);
        const node = el('meses'); if(node) node.value = String(val);
        baseDataset.forEach(it=> it.meses = val);
        renderBaseDataset();
        calcula();
      }
    }
  }, { once: true });
};

const initBaseDataset = () => {
  renderBaseDataset();
  if(typeof lockGlobalConfigIfHasItems==='function') lockGlobalConfigIfHasItems();
  el('moeda')?.addEventListener('change', renderBaseDataset);
  el('casas')?.addEventListener('change', renderBaseDataset);
  el('baseDatasetLista')?.addEventListener('click', ev=>{
    const t = ev.target;
    // toggle editing mode for widget
    const editToggle = t.closest('[data-entry-edit]');
    if(editToggle){
      const id = editToggle.getAttribute('data-entry-edit');
      if(id){ const idx = baseDataset.findIndex(it=> String(it.id)===String(id)); if(idx>-1){ baseDataset[idx].uiEditing = !baseDataset[idx].uiEditing; renderBaseDataset(); } }
      return;
    }
    // toggle credit chips
    const chipToggle = t.closest('[data-opt-toggle]');
    if(chipToggle){
      const id = chipToggle.getAttribute('data-item');
      const key = chipToggle.getAttribute('data-opt-toggle');
      const idx = baseDataset.findIndex(it=> String(it.id)===String(id));
      if(idx>-1 && baseDataset[idx].uiEditing){
        const it = baseDataset[idx];
        if(key==='credAtual') it.consideraCredAtual = !it.consideraCredAtual;
        if(key==='credIcms') it.consideraCredICMS = !it.consideraCredICMS;
        if(key==='credNovo') it.consideraCredNovo = !it.consideraCredNovo;
        renderBaseDataset();
        calcula();
      }
      return;
    }
    // edit reduction chips
    const chipRed = t.closest('[data-reduction]');
    if(chipRed){
      const id = chipRed.getAttribute('data-item');
      const key = chipRed.getAttribute('data-reduction');
      const idx = baseDataset.findIndex(it=> String(it.id)===String(id));
      if(idx>-1){
        const it = baseDataset[idx];
        const current = (getReductionForEntry(it,key)||0)*100;
        const next = prompt(`Definir redução para ${key} (%)`, String((Math.round(current*100)/100).toString().replace('.',',')));
        if(next!=null){
          const val = parseFloat(String(next).replace(',','.'));
          const pct = isFinite(val) ? Math.max(0, Math.min(val,100)) : 0;
          if(!it.reducoes) it.reducoes = { ativo:true };
          if(!it.reducoes[key]) it.reducoes[key] = { opt:'0', custom:0 };
          if(pct===0){ it.reducoes[key].opt='0'; it.reducoes[key].custom=0; }
          else if(pct===50){ it.reducoes[key].opt='0.5'; it.reducoes[key].custom=0; }
          else if(pct===100){ it.reducoes[key].opt='1'; it.reducoes[key].custom=0; }
          else { it.reducoes[key].opt='custom'; it.reducoes[key].custom=pct; }
          renderBaseDataset();
          calcula();
        }
      }
      return;
    }
    const removeBtn = t.closest('[data-base-remove]');
    if(removeBtn){
      const id = removeBtn.getAttribute('data-base-remove');
      if(id){ removeBaseDatasetEntry(id); }
      return;
    }
  });

  // Inline edits for widget fields
  const updateItemField = (id, field, rawValue, kind=null) => {
    const idx = baseDataset.findIndex(it=> String(it.id) === String(id));
    if(idx===-1) return;
    const it = baseDataset[idx];
    if(kind==='money'){
      it[field] = parseBR(String(rawValue));
    } else if(kind==='int'){
      const n = parseInt(String(rawValue||'1'),10);
      it[field] = isFinite(n) && n>0 ? n : 1;
    } else if(kind==='pct'){
      const f = parseFloat(String(rawValue).replace(',','.'));
      it[field] = isFinite(f) && f>=0 ? f : 0;
    } else if(kind==='ded'){
      const f = parseFloat(String(rawValue).replace(',','.'));
      const pct = isFinite(f) && f>=0 ? Math.min(f,100) : 0;
      if(!it.reducoes) it.reducoes = { ativo:true };
      if(!it.reducoes[field]) it.reducoes[field] = { opt:'0', custom:0 };
      if(pct===0){ it.reducoes[field].opt='0'; it.reducoes[field].custom=0; }
      else if(pct===50){ it.reducoes[field].opt='0.5'; it.reducoes[field].custom=0; }
      else if(pct===100){ it.reducoes[field].opt='1'; it.reducoes[field].custom=0; }
      else { it.reducoes[field].opt='custom'; it.reducoes[field].custom=pct; }
    } else {
      it[field] = rawValue;
      if(field==='cenario'){ it.cenarioLabel = scenarioDisplayName(rawValue); }
      if(field==='regime'){ it.regimeLabel = regimeDisplayName(rawValue); }
      if(field==='tipo'){ it.tipoLabel = tipoDisplayName(rawValue); }
      if(field==='cenario'){
        const cfg = SCENARIO_CONFIG[rawValue];
        if(cfg && cfg.auto){ if(isFinite(cfg.auto.cbs)) it.cbs = cfg.auto.cbs; if(isFinite(cfg.auto.ibs)) it.ibs = cfg.auto.ibs; if(isFinite(cfg.auto.seletivo)) it.seletivo = cfg.auto.seletivo; }
      }
    }
    renderBaseDataset();
    calcula();
  };

  el('baseDatasetLista')?.addEventListener('change', ev=>{
    const t = ev.target;
    if(t && t.classList.contains('w-select')){
      const id = t.getAttribute('data-item');
      const field = t.getAttribute('data-field');
      if(id && field){ updateItemField(id, field, t.value, null); }
    }
  });
  el('baseDatasetLista')?.addEventListener('blur', ev=>{
    const t = ev.target;
    if(t && t.classList.contains('w-input')){
      const id = t.getAttribute('data-item');
      const field = t.getAttribute('data-field');
      const kind = t.getAttribute('data-kind');
      if(id && field){ updateItemField(id, field, t.value, kind); }
      // Normalização visual do input percentual no blur (pt-BR)
      if(kind==='pct' || kind==='ded'){
        const v = parseFloat(String(t.value).replace(',','.'));
        const num = isFinite(v) && v>=0 ? v : 0;
        t.value = String(num.toFixed(2)).replace('.',',');
      }
    }
  }, true);
};

const reductionRatio = cfg => {
  if(!cfg) return 0;
  if(cfg.opt === 'custom'){
    return clamp01((cfg.custom || 0) / 100);
  }
  const num = parseFloat(cfg.opt);
  if(!isFinite(num)) return 0;
  return clamp01(num);
};

const getReductionForEntry = (entry, key) => {
  if(!entry?.reducoes?.ativo) return 0;
  return reductionRatio(entry.reducoes[key]);
};

const computeSNForEntry = (entry, rc) => {
  if(!entry) return null;
  const receitaPeriodo = Math.max(rc || 0, 0);
  const rbt12Raw = entry.snRbt12 || 0;
  const rbt12 = rbt12Raw > 0 ? rbt12Raw : (receitaPeriodo || 0);
  const anexoOriginal = entry.snAnexo || (entry.tipo==='mercadoria'?'I':'III');
  const usaFR = anexoOriginal==='V' && !!entry.snFatorToggle;
  const anexoFinal = usaFR ? 'III' : anexoOriginal;
  const faixaInfo = (()=>{ const tbl=SN[anexoFinal]; let idx=0; for(let i=0;i<SN_LIMITS.length;i++){ if(rbt12>SN_LIMITS[i]) idx=i+1; } if(tbl && idx>=tbl.length) idx=tbl.length-1; if(idx<0) idx=0; const slot=tbl?tbl[idx]:null; const aliq=slot?slot[0]:0; const pd=slot?slot[1]:0; return { faixa:idx+1, aliq, pd }; })();
  const efetiva = rbt12>0
    ? Math.max((rbt12*faixaInfo.aliq - faixaInfo.pd)/rbt12,0)
    : Math.max(faixaInfo.aliq,0);
  const das = receitaPeriodo*efetiva;
  const splitFaixa = SN_SPLIT_FAIXA[anexoFinal];
  const split = (splitFaixa && splitFaixa[(faixaInfo.faixa||1)-1]) || SN_SPLIT[anexoFinal] || SN_SPLIT.default;
  const breakdown=[];
  Object.entries(split).forEach(([trib,share])=>{
    const valor=das*share;
    const aliqComp=efetiva*share;
    breakdown.push({
      nome:trib,
      key:trib,
      value:valor,
      base:receitaPeriodo,
      aliq:aliqComp,
      note: usaFR && anexoOriginal==='V' ? 'Fator R ≥28% aplicado.' : ''
    });
  });
  return {
    total:das,
    breakdown,
    receita:receitaPeriodo,
    efetiva,
    faixa:faixaInfo.faixa,
    aliqNominal:faixaInfo.aliq,
    parcelaDedutivel:faixaInfo.pd,
    anexoFinal,
    anexoOriginal,
    fatorRAplicado:usaFR
  };
};

const evaluateEntry = entry => {
  const cfg = SCENARIO_CONFIG[entry.cenario] || SCENARIO_CONFIG.regime2033;
  const rc = Math.max(entry.receita || 0, 0);
  const compN = Math.max(entry.comprasNovo || 0, 0);
  const compA = Math.max(entry.comprasAtual || 0, 0);
  const compICMS = Math.max(entry.comprasICMS || 0, 0);
  const baseSel = Math.max(entry.baseSeletivo || 0, 0);
  const despesasReal = Math.max(entry.despesasLucroReal || 0, 0);
  const regime = entry.regime || 'real';
  const tipoOper = entry.tipo || 'servico';
  const legacyShare = clamp01(cfg.legacyShare ?? 0);
  const ibsShare = clamp01(cfg.ibsShare ?? 1);
  const p = (entry.pis || 0)/100;
  const f = (entry.cofins || 0)/100;
  const alIss = (entry.iss || 0)/100;
  const alIcms = (entry.icms || 0)/100;
  const alIpi = (entry.ipi || 0)/100;
  const alCbs = (entry.cbs || 0)/100;
  const alIbs = (entry.ibs || 0)/100;
  const alSel = (entry.seletivo || 0)/100;
  const alIrpj = (entry.irpj || 0)/100;
  const alCsll = (entry.csll || 0)/100;
  const aliqOutrosRate = ((entry.aliqOutros ?? 0) || 0)/100;
  const presAliqEntryIrpj = entry.presAliqIrpj != null ? (entry.presAliqIrpj/100) : null;
  const presAliqEntryCsll = entry.presAliqCsll != null ? (entry.presAliqCsll/100) : null;
  const credAtual = !!entry.consideraCredAtual;
  const credICMS = !!entry.consideraCredICMS;
  const credNovo = !!entry.consideraCredNovo;
  const redPisCof = clamp01(getReductionForEntry(entry,'pisCof'));
  const redIssIcms = clamp01(getReductionForEntry(entry,'issIcms'));
  const redIpi = clamp01(getReductionForEntry(entry,'ipi'));
  const fatorAliqCbsIbs = 1 - clamp01(getReductionForEntry(entry,'cbsIbs'));
  const redSel = clamp01(getReductionForEntry(entry,'seletivo'));
  const redIrpj = clamp01(getReductionForEntry(entry,'irpj'));

  const basePisCof0 = Math.max(rc - (credAtual ? compA : 0), 0);
  const basePisCof = basePisCof0 * (1 - redPisCof);
  const valPis = (regime==='simples' || entry.incPisCof===false) ? 0 : basePisCof * p;
  const valCof = (regime==='simples' || entry.incPisCof===false) ? 0 : basePisCof * f;

  const baseIss = rc * (1 - redIssIcms);
  const baseIcms0 = Math.max(rc - ((tipoOper==='mercadoria' && credICMS) ? compICMS : 0), 0);
  const baseIcms = baseIcms0 * (1 - redIssIcms);
  const valIss = (tipoOper==='servico' && entry.incIssIcms!==false) ? baseIss * alIss : 0;
  const valIcms = (tipoOper==='mercadoria' && entry.incIssIcms!==false) ? baseIcms * alIcms : 0;

  const baseIpi = rc * (1 - redIpi);
  const valIpi = entry.incIpi===false ? 0 : baseIpi * alIpi;

  const aliqPisEff = basePisCof>0 ? valPis/basePisCof : null;
  const aliqCofEff = basePisCof>0 ? valCof/basePisCof : null;
  const aliqIssEff = baseIss>0 ? valIss/baseIss : null;
  const aliqIcmsEff = baseIcms>0 ? valIcms/baseIcms : null;
  const aliqIpiEff = baseIpi>0 ? valIpi/baseIpi : null;

  const defaultPres = tipoOper==='mercadoria' ? 'comercio' : 'servicos';
  const presCfg = PRES_ATIVIDADES[entry.presAtividade] || PRES_ATIVIDADES[defaultPres];

  let baseIrpj = 0;
  let baseCsll = 0;
  let valIrpjBase = 0;
  let valIrpjExtra = 0;
  let valCsll = 0;
  const mesesApur = Math.max(parseInt(entry.meses,10)||1,1);
  const extraTh = IRPJ_EXTRA_THRESHOLD * mesesApur;

  if(regime==='presumido' && presCfg){
    const presIrpjRate = presAliqEntryIrpj ?? presCfg.irpj ?? 0;
    const presCsllRate = presAliqEntryCsll ?? presCfg.csll ?? 0;
    baseIrpj = rc * presIrpjRate;
    baseCsll = rc * presCsllRate;
    valIrpjBase = baseIrpj * alIrpj;
    valIrpjExtra = alIrpj>0 ? Math.max(baseIrpj - extraTh, 0) * 0.10 : 0;
    valCsll = baseCsll * alCsll;
  } else if(regime==='real'){
    const lucroTributavel = Math.max(rc - despesasReal, 0);
    baseIrpj = lucroTributavel;
    baseCsll = lucroTributavel;
    valIrpjBase = baseIrpj * alIrpj;
    valIrpjExtra = alIrpj>0 ? Math.max(baseIrpj - extraTh, 0) * 0.10 : 0;
    valCsll = baseCsll * alCsll;
  }
  // Aplicar redução de IRPJ (ex.: SUDENE/SUDAM) somente sobre a parcela base
  if(redIrpj>0){
    valIrpjBase = valIrpjBase * (1 - redIrpj);
  }
  const valIrpj = (entry.incIrpj===false ? 0 : (valIrpjBase + valIrpjExtra));
  const baseIrpjExtra = Math.max(baseIrpj - extraTh, 0);
  const valOutros = (aliqOutrosRate>0 && entry.incOutros!==false) ? rc * aliqOutrosRate : 0;

  const snCalc = regime==='simples' ? computeSNForEntry(entry, rc) : null;
  const arrAtual = [];
  const arrCenario = [];
  const atualRows = [];
  const novoRows = [];

  const pushRow = (rows, nome, base, aliq, valor) => {
    if(!rows || Math.abs(valor) < 1e-9) return;
    const hasBase = !(base === null || base === undefined || base === '—');
    const numericBase = hasBase ? base : 0;
    rows.push({ nome, base:numericBase, baseValue:numericBase, aliq, valor, hasBase });
  };

  const pushResumo = (arr, nome, valor, base, aliq, opts={}) => {
    const numericBase = (base === null || base === undefined || base === '—') ? 0 : base;
    pushComp(arr, nome, valor, numericBase, aliq, opts);
  };

  let totalAtual = 0;
  let baseEfetivaAtual = regime==='simples' ? (snCalc?.receita || rc) : rc;

  if(regime==='simples'){
    const baseSN = snCalc?.receita || rc;
    (snCalc?.breakdown || []).forEach(item=>{
      pushRow(atualRows, item.nome, baseSN, item.aliq, item.value);
      pushResumo(arrAtual, item.nome, item.value, baseSN, item.aliq, { key:item.key||item.nome, note:item.note || 'Simples (DAS)' });
      totalAtual += item.value || 0;
    });
  } else {
    if(valPis>0){
      totalAtual += valPis;
      pushRow(atualRows,'PIS',basePisCof,aliqPisEff,valPis);
      pushResumo(arrAtual,'PIS',valPis,basePisCof,aliqPisEff,{key:'PIS'});
    }
    if(valCof>0){
      totalAtual += valCof;
      pushRow(atualRows,'COFINS',basePisCof,aliqCofEff,valCof);
      pushResumo(arrAtual,'COFINS',valCof,basePisCof,aliqCofEff,{key:'COFINS'});
    }
    if(valIss>0){
      totalAtual += valIss;
      pushRow(atualRows,'ISS',baseIss,aliqIssEff,valIss);
      pushResumo(arrAtual,'ISS',valIss,baseIss,aliqIssEff,{key:'ISS'});
    }
    if(valIcms>0){
      totalAtual += valIcms;
      pushRow(atualRows,'ICMS',baseIcms,aliqIcmsEff,valIcms);
      pushResumo(arrAtual,'ICMS',valIcms,baseIcms,aliqIcmsEff,{key:'ICMS'});
    }
    if(valIpi>0){
      totalAtual += valIpi;
      pushRow(atualRows,'IPI',baseIpi,aliqIpiEff,valIpi);
      pushResumo(arrAtual,'IPI',valIpi,baseIpi,aliqIpiEff,{key:'IPI'});
    }
    const valIrpjTotalAtual = (valIrpjBase||0) + (valIrpjExtra||0);
    if(valIrpjTotalAtual>0 && entry.incIrpj!==false){
      totalAtual += valIrpjTotalAtual;
      const aliqIrpjTotal = baseIrpj>0 ? valIrpjTotalAtual/baseIrpj : null;
      pushRow(atualRows,'IRPJ',baseIrpj,aliqIrpjTotal,valIrpjTotalAtual);
      pushResumo(arrAtual,'IRPJ',valIrpjTotalAtual,baseIrpj,aliqIrpjTotal,{key:'IRPJ'});
    }
    if(valCsll>0 && entry.incCsll!==false){
      totalAtual += valCsll;
      const aliqCsll = baseCsll>0 ? valCsll/baseCsll : null;
      pushRow(atualRows,'CSLL',baseCsll,aliqCsll,valCsll);
      pushResumo(arrAtual,'CSLL',valCsll,baseCsll,aliqCsll,{key:'CSLL'});
    }
  }

  if(valOutros>0){
    totalAtual += valOutros;
    pushRow(atualRows,'Outros tributos',rc,aliqOutrosRate,valOutros);
    pushResumo(arrAtual,'Outros tributos',valOutros,rc,aliqOutrosRate,{key:'Outros tributos'});
  }

  const snCompararFora = (regime==='simples') && !!entry.snCompararFora;
  let totalNovo = 0;
  const baseEfetivaNovo = (regime==='simples' && !snCompararFora) ? (snCalc?.receita || rc) : rc;

  const appendSNToNovo = () => {
    if(!snCalc) return;
    const baseSN = snCalc.receita || rc;
    (snCalc.breakdown || []).forEach(item=>{
      pushRow(novoRows,item.nome,baseSN,item.aliq,item.value);
      pushResumo(arrCenario,item.nome,item.value,baseSN,item.aliq,{ key:item.key||item.nome, note:item.note || 'Simples (DAS)'});
    });
  };

  if(regime==='simples' && !snCompararFora){
    appendSNToNovo();
    totalNovo = snCalc?.total || 0;
  } else if(entry.cenario==='piloto2026'){
    if(snCompararFora){
      appendSNToNovo();
      totalNovo += snCalc?.total || 0;
    }
    const baseGenerica = Math.max(rc - (credNovo ? compN : 0), 0);
    const baseTestes = Math.max(baseGenerica, 0);
    const aliqCbsPiloto = 0.009 * fatorAliqCbsIbs;
    const aliqIbsPiloto = 0.001 * fatorAliqCbsIbs;
    const valCbsPiloto = baseTestes * aliqCbsPiloto;
    const valIbsPiloto = baseTestes * aliqIbsPiloto;
    const devidoPisCof = regime==='simples' ? 0 : (basePisCof * (p+f));
    const comp = Math.min(devidoPisCof, valCbsPiloto + valIbsPiloto);
    const pisCofApos = Math.max(devidoPisCof - comp, 0);
    const aliqCbsReal = baseTestes>0 ? valCbsPiloto/baseTestes : null;
    const aliqIbsReal = baseTestes>0 ? valIbsPiloto/baseTestes : null;

    pushRow(novoRows,'CBS (0,9%) – teste',baseTestes,aliqCbsReal,valCbsPiloto);
    pushRow(novoRows,'IBS (0,1%) – teste',baseTestes,aliqIbsReal,valIbsPiloto);
    pushRow(novoRows,'Compensação CBS/IBS × PIS/COFINS',null,null,-comp);
    if(pisCofApos>0){
      const aliqPisComp = basePisCof>0 ? pisCofApos/basePisCof : null;
      pushRow(novoRows,'PIS+COFINS após compensação',basePisCof,aliqPisComp,pisCofApos);
    }

    const extraSN = valCbsPiloto + valIbsPiloto;
    totalNovo = snCompararFora
      ? (totalNovo + extraSN)
      : (devidoPisCof + valIss + valIcms + valIpi + valIrpj + valCsll);

    pushResumo(arrCenario,'CBS (0,9%) – teste',valCbsPiloto,baseTestes,aliqCbsReal,{key:'CBS_piloto',note:'Piloto 2026'});
    pushResumo(arrCenario,'IBS (0,1%) – teste',valIbsPiloto,baseTestes,aliqIbsReal,{key:'IBS_piloto',note:'Piloto 2026'});
    pushResumo(arrCenario,'Compensação CBS/IBS × PIS/COFINS',-comp,0,null,{key:'COMP',note:'Crédito compensatório'});

    if(pisCofApos>0 && (p+f)>0){
      const somaAliq=p+f;
      const valPisNovo=pisCofApos*(p/somaAliq);
      const valCofNovo=pisCofApos*(f/somaAliq);
      const aliqPisNovo=basePisCof>0?valPisNovo/basePisCof:null;
      const aliqCofNovo=basePisCof>0?valCofNovo/basePisCof:null;
      if(valPisNovo>0) pushResumo(arrCenario,'PIS',valPisNovo,basePisCof,aliqPisNovo,{key:'PIS',note:'Após compensação CBS/IBS'});
      if(valCofNovo>0) pushResumo(arrCenario,'COFINS',valCofNovo,basePisCof,aliqCofNovo,{key:'COFINS',note:'Após compensação CBS/IBS'});
    }

    if(!snCompararFora){
      if(valIss>0){
        pushResumo(arrCenario,'ISS',valIss,baseIss,aliqIssEff,{key:'ISS'});
        pushRow(novoRows,'ISS',baseIss,aliqIssEff,valIss);
      }
      if(valIcms>0){
        pushResumo(arrCenario,'ICMS',valIcms,baseIcms,aliqIcmsEff,{key:'ICMS'});
        pushRow(novoRows,'ICMS',baseIcms,aliqIcmsEff,valIcms);
      }
      if(valIpi>0){
        pushResumo(arrCenario,'IPI',valIpi,baseIpi,aliqIpiEff,{key:'IPI'});
        pushRow(novoRows,'IPI',baseIpi,aliqIpiEff,valIpi);
      }
      const valIrpjTotalNovo = (valIrpjBase||0) + (valIrpjExtra||0);
      if(valIrpjTotalNovo>0 && entry.incIrpj!==false){
        const aliqIrpjTotal = baseIrpj>0 ? valIrpjTotalNovo/baseIrpj : null;
        pushResumo(arrCenario,'IRPJ',valIrpjTotalNovo,baseIrpj,aliqIrpjTotal,{key:'IRPJ'});
        pushRow(novoRows,'IRPJ',baseIrpj,aliqIrpjTotal,valIrpjTotalNovo);
      }
      if(valCsll>0 && entry.incCsll!==false){
        const aliqCsll = baseCsll>0 ? valCsll/baseCsll : null;
        pushResumo(arrCenario,'CSLL',valCsll,baseCsll,aliqCsll,{key:'CSLL'});
        pushRow(novoRows,'CSLL',baseCsll,aliqCsll,valCsll);
      }
    } else {
      // SN breakdown already appended when snCompararFora true
    }
  } else {
    if(snCompararFora){
      appendSNToNovo();
      totalNovo += snCalc?.total || 0;
    }
    const baseCbs0 = Math.max(rc - (credNovo ? compN : 0), 0);
    const aliqCbsNom = alCbs * fatorAliqCbsIbs;
    const aliqIbsNom = alIbs * fatorAliqCbsIbs;
    const valCbs = entry.incCbsIbs===false ? 0 : baseCbs0 * aliqCbsNom;
    const valIbs = entry.incCbsIbs===false ? 0 : baseCbs0 * aliqIbsNom;
    const baseSelAdj = baseSel * (1 - redSel);
    const valSel = entry.incSeletivo===false ? 0 : baseSelAdj * alSel;
    const valIssLegacy = snCompararFora ? 0 : (valIss * legacyShare);
    const valIcmsLegacy = snCompararFora ? 0 : (valIcms * legacyShare);
    const seletivoTotal = ((entry.seletivo || 0) > 0 && baseSel > 0) ? valSel : 0;
    const valIpiNovo = valIpi;

    const aliqCbsReal = baseCbs0>0 ? valCbs/baseCbs0 : null;
    const aliqIbsReal = baseCbs0>0 ? valIbs/baseCbs0 : null;
    const aliqSelReal = baseSelAdj>0 ? valSel/baseSelAdj : null;
    const aliqIssLegacyEff = baseIss>0 ? valIssLegacy/baseIss : null;
    const aliqIcmsLegacyEff = baseIcms>0 ? valIcmsLegacy/baseIcms : null;
    const aliqIpiNovo = baseIpi>0 ? valIpiNovo/baseIpi : null;

    pushRow(novoRows,'CBS',baseCbs0,aliqCbsReal,valCbs);
    pushResumo(arrCenario,'CBS',valCbs,baseCbs0,aliqCbsReal);

    const noteIbs = ibsShare>0 && ibsShare<1 ? `Quota IBS ${Math.round(ibsShare*100)}%` : '';
    pushRow(novoRows,'IBS',baseCbs0,aliqIbsReal,valIbs);
    pushResumo(arrCenario,'IBS',valIbs,baseCbs0,aliqIbsReal,{note:noteIbs});

    if(seletivoTotal>0){
      pushRow(novoRows,'Imposto Seletivo',baseSelAdj,aliqSelReal,valSel);
      pushResumo(arrCenario,'Imposto Seletivo',valSel,baseSelAdj,aliqSelReal);
    }

    if(valIssLegacy>0 && tipoOper==='servico'){
      const labelIss = legacyShare===1 ? 'ISS' : 'ISS (legado)';
      const noteIss = legacyShare<1 ? `Legado ${Math.round(legacyShare*100)}% da base` : '';
      pushRow(novoRows,labelIss,baseIss,aliqIssLegacyEff,valIssLegacy);
      pushResumo(arrCenario,labelIss,valIssLegacy,baseIss,aliqIssLegacyEff,{key:'ISS',note:noteIss});
    }
    if(valIcmsLegacy>0 && tipoOper==='mercadoria'){
      const labelIcms = legacyShare===1 ? 'ICMS' : 'ICMS (legado)';
      const noteIcms = legacyShare<1 ? `Legado ${Math.round(legacyShare*100)}% da base` : '';
      pushRow(novoRows,labelIcms,baseIcms,aliqIcmsLegacyEff,valIcmsLegacy);
      pushResumo(arrCenario,labelIcms,valIcmsLegacy,baseIcms,aliqIcmsLegacyEff,{key:'ICMS',note:noteIcms});
    }
    if(valIpiNovo>0){
      pushRow(novoRows,'IPI',baseIpi,aliqIpiNovo,valIpiNovo);
      pushResumo(arrCenario,'IPI',valIpiNovo,baseIpi,aliqIpiNovo);
    }

    const extraSN = valCbs + valIbs + seletivoTotal + valIpiNovo;
    if(snCompararFora){
      totalNovo += extraSN;
    } else {
      totalNovo = valCbs + valIbs + seletivoTotal + valIssLegacy + valIcmsLegacy + valIpiNovo + valIrpj + valCsll;
    }

    if(!snCompararFora){
      const valIrpjTotalNovo2 = (valIrpjBase||0) + (valIrpjExtra||0);
      if(valIrpjTotalNovo2>0){
        const aliqIrpjTotal2 = baseIrpj>0 ? valIrpjTotalNovo2/baseIrpj : null;
        pushRow(novoRows,'IRPJ',baseIrpj,aliqIrpjTotal2,valIrpjTotalNovo2);
        pushResumo(arrCenario,'IRPJ',valIrpjTotalNovo2,baseIrpj,aliqIrpjTotal2,{key:'IRPJ'});
      }
      if(valCsll>0){
        const aliqCsll = baseCsll>0 ? valCsll/baseCsll : null;
        pushRow(novoRows,'CSLL',baseCsll,aliqCsll,valCsll);
        pushResumo(arrCenario,'CSLL',valCsll,baseCsll,aliqCsll,{key:'CSLL'});
      }
    }
  }

  if(valOutros>0){
    totalNovo += valOutros;
    pushRow(novoRows,'Outros tributos',rc,aliqOutrosRate,valOutros);
    pushResumo(arrCenario,'Outros tributos',valOutros,rc,aliqOutrosRate,{key:'Outros tributos'});
  }

  const resultado = {
    totalAtual,
    totalNovo,
    arrAtual,
    arrCenario,
    atualRows,
    novoRows,
    baseEfetivaAtual,
    baseEfetivaNovo,
    tituloNovo: cfg.title || 'Novo modelo',
    rotuloNovo: cfg.total || 'Total (novo)',
    visLabelAtual: (regime==='simples' && !snCompararFora) ? 'Simples Nacional' : 'Modelo atual'
  };

  return resultado;
};

const aggregateEntries = entries => {
  const rowsAtual = new Map();
  const orderRowsAtual = [];
  const rowsNovo = new Map();
  const orderRowsNovo = [];
  const resumoAtual = new Map();
  const resumoNovo = new Map();
  const orderResumoAtual = [];
  const orderResumoNovo = [];

  const mergeRow = (map, order, row) => {
    const key = row.nome;
    if(!map.has(key)){
      map.set(key,{ nome:row.nome, base:0, valor:0, hasBase:false });
      order.push(key);
    }
    const acc = map.get(key);
    acc.valor += row.valor || 0;
    if(row.hasBase) acc.base += row.base || 0;
    acc.hasBase = acc.hasBase || !!row.hasBase;
  };

  const mergeResumo = (map, order, item) => {
    const key = item.key || item.nome;
    if(!map.has(key)){
      map.set(key,{ nome:item.nome, key, value:0, base:0, note:item.note || '' });
      order.push(key);
    }
    const acc = map.get(key);
    acc.value += item.value || 0;
    acc.base += item.base || 0;
    if(!acc.note && item.note) acc.note = item.note;
  };

  let totalAtual = 0;
  let totalNovo = 0;
  let baseEfetivaAtual = 0;
  let baseEfetivaNovo = 0;
  const titulosNovos = new Set();
  const rotulosNovos = new Set();
  const rotulosAtuais = new Set();

  entries.forEach(entry=>{
    const res = evaluateEntry(entry);
    titulosNovos.add(res.tituloNovo);
    rotulosNovos.add(res.rotuloNovo);
    rotulosAtuais.add(res.visLabelAtual);
    totalAtual += res.totalAtual;
    totalNovo += res.totalNovo;
    baseEfetivaAtual += res.baseEfetivaAtual;
    baseEfetivaNovo += res.baseEfetivaNovo;
    res.atualRows.forEach(row=>mergeRow(rowsAtual,orderRowsAtual,row));
    res.novoRows.forEach(row=>mergeRow(rowsNovo,orderRowsNovo,row));
    res.arrAtual.forEach(item=>mergeResumo(resumoAtual,orderResumoAtual,item));
    res.arrCenario.forEach(item=>mergeResumo(resumoNovo,orderResumoNovo,item));
  });

  const finalizeRows = (map, order) => order.map(key=>{
    const acc = map.get(key);
    const baseValue = acc.base || 0;
    const hasBase = !!acc.hasBase;
    const aliq = hasBase && baseValue>0 ? acc.valor/baseValue : null;
    return { nome:acc.nome, base:hasBase ? baseValue : '—', baseValue, aliq, valor:acc.valor, hasBase };
  });

  const finalizeResumo = (map, order) => order.map(key=>{
    const acc = map.get(key);
    const base = acc.base || 0;
    const aliq = base>0 ? acc.value/base : null;
    return { nome:acc.nome, key:acc.key, value:acc.value, base, aliq, note:acc.note };
  });

  const atualRows = finalizeRows(rowsAtual, orderRowsAtual);
  const novoRows = finalizeRows(rowsNovo, orderRowsNovo);
  const arrAtual = finalizeResumo(resumoAtual, orderResumoAtual);
  const arrCenario = finalizeResumo(resumoNovo, orderResumoNovo);

  const tituloNovo = entries.length===1 ? [...titulosNovos][0] : 'Simulação consolidada (CBS/IBS)';
  const rotuloNovo = entries.length===1 ? [...rotulosNovos][0] : 'Total consolidado';
  const tituloAtual = entries.length===1 ? [...rotulosAtuais][0] : 'Modelo atual';

  return {
    totalAtual,
    totalNovo,
    atualRows,
    novoRows,
    arrAtual,
    arrCenario,
    baseEfetivaAtual,
    baseEfetivaNovo,
    tituloNovo,
    rotuloNovo,
    tituloAtual
  };
};

const clearSimulationOutputs = () => {
  const emptyMsg = '<tr><td colspan="4" class="text-center text-slate-400 text-sm">Aguardando dados para cálculo.</td></tr>';
  const tA = el('tAtual'); if(tA) tA.innerHTML = emptyMsg;
  const tN = el('tNovo'); if(tN) tN.innerHTML = emptyMsg;
  const tituloAtualEl = el('titleAtual'); if(tituloAtualEl) tituloAtualEl.textContent = 'Modelo atual';
  const tituloNovoEl = el('tituloNovo'); if(tituloNovoEl) tituloNovoEl.textContent = 'Cenário (CBS/IBS)';
  const rotTotNovoEl = el('rotTotNovo'); if(rotTotNovoEl) rotTotNovoEl.textContent = 'Total (cenário)';
  const resHeadAtualEl = el('resHeadAtual'); if(resHeadAtualEl) resHeadAtualEl.textContent = 'Modelo atual';
  const resHeadNovoEl = el('resHeadNovo'); if(resHeadNovoEl) resHeadNovoEl.textContent = 'Cenário';
  if(el('totAtual')) el('totAtual').textContent = fmtMon(0);
  if(el('totNovo')) el('totNovo').textContent = fmtMon(0);
  if(el('efetAtual')) el('efetAtual').textContent = fmtPct(0);
  if(el('efetNovo')) el('efetNovo').textContent = fmtPct(0);
  if(el('resumoBody')) el('resumoBody').innerHTML = '<tr><td colspan="4" class="text-center text-slate-400 text-sm">Aguardando dados para cálculo.</td></tr>';
  if(el('resTotAtual')) el('resTotAtual').textContent = fmtMon(0);
  if(el('resTotNovo')) el('resTotNovo').textContent = fmtMon(0);
  if(el('resTotDif')) el('resTotDif').textContent = fmtMon(0);
  if(el('difAbs')) el('difAbs').textContent = fmtMon(0);
  if(el('difPct')) el('difPct').textContent = fmtPct(0);
  if(el('difAbsHint')) el('difAbsHint').textContent = 'Adicione itens à base para calcular.';
  if(el('difPctHint')) el('difPctHint').textContent = '';
  if(el('difAbsIcon')) el('difAbsIcon').textContent = '■';
  if(el('difPctBar')){ const bar=el('difPctBar'); bar.style.width='0%'; bar.classList.remove('diff-up','diff-down','diff-neutral'); bar.classList.add('diff-neutral'); }
  if(el('cardDifAbs')){ const card=el('cardDifAbs'); card.classList.remove('diff-up','diff-down'); card.classList.add('diff-neutral'); }
  if(el('cardDifPct')){ const card=el('cardDifPct'); card.classList.remove('diff-up','diff-down'); card.classList.add('diff-neutral'); }
  if(el('cardTotais')){ const card=el('cardTotais'); card.classList.remove('diff-up','diff-down'); card.classList.add('diff-neutral'); }
  if(el('totIcon')) el('totIcon').textContent = '⇆';
  if(el('totAtualResumo')) el('totAtualResumo').textContent = fmtMon(0);
  if(el('totNovoResumo')) el('totNovoResumo').textContent = fmtMon(0);
  try{ window.updateMiniCharts(0,0,[],[]); }catch(_){ }
};

// Chart theme helpers
const chartThemeColors = (themeName) => {
  const theme = themeName || document.documentElement.getAttribute('data-theme') || 'light';
  const isDark = theme === 'dark';
  return {
    text: isDark ? '#ECEFF4' : '#111827',
    grid: isDark ? '#2F4569' : '#E5E7EB'
  };
};
window.applyChartTheme = (themeName) => {
  if(typeof Chart === 'undefined') return;
  const c = chartThemeColors(themeName);
  Chart.defaults.color = c.text;
  Chart.defaults.borderColor = c.grid;
  try{
    const small = (self.innerWidth||0) <= 420;
    Chart.defaults.font = Object.assign({}, Chart.defaults.font || {}, { size: small ? 10 : 12 });
  }catch(_){ }
  try{
    const tot = window.__miniTot; if(tot){
      tot.options.scales = tot.options.scales || {};
      tot.options.scales.x = tot.options.scales.x || {};
      tot.options.scales.y = tot.options.scales.y || {};
      tot.options.scales.x.ticks = Object.assign({}, tot.options.scales.x.ticks, { color: c.text });
      tot.options.scales.y.ticks = Object.assign({}, tot.options.scales.y.ticks, { color: c.text });
      tot.options.scales.x.grid = Object.assign({}, tot.options.scales.x.grid, { color: c.grid });
      tot.options.scales.y.grid = Object.assign({}, tot.options.scales.y.grid, { color: c.grid });
      tot.update();
    }
    const k1='__mini_chartMiniAtual', k2='__mini_chartMiniCenario';
    [k1,k2].forEach(k=>{ if(window[k]){ window[k].update(); } });
  }catch(_){ }
};

// Chart widgets updater (mini)
window.updateMiniCharts = (totalAtual, totalNovo, resumoAtual, resumoNovo) => {
  if(typeof Chart === 'undefined') return;
  const css = (name, fb) => (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb);
  const colorA = css('--accent', '#1E3A8A');
  const colorB = css('--accent-2', '#10B981');
  const c = chartThemeColors();
  // Totais bar
  const cTot = document.getElementById('chartMiniTotais');
  if(cTot){
    const ctx = cTot.getContext('2d');
    const small = (self.innerWidth||0) <= 420;
    if(!window.__miniTot){
      window.__miniTot = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Atual','Cenário'], datasets: [{ data:[totalAtual||0,totalNovo||0], backgroundColor:[colorA,colorB]}] },
        options: { responsive:true, maintainAspectRatio:true, aspectRatio: small? 2.2 : 2.6, plugins:{legend:{display:false}}, scales:{
          x:{ ticks:{ color:c.text }, grid:{ color:c.grid } },
          y:{ ticks:{ color:c.text, callback:(v)=> new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)}, grid:{ color:c.grid } }
        }}
      });
    } else {
      window.__miniTot.data.datasets[0].data = [totalAtual||0,totalNovo||0];
      window.__miniTot.update();
    }
  }
  // Top 4 helper
  const topN = (arr)=> (arr||[]).slice().sort((a,b)=> (b?.value||0)-(a?.value||0)).slice(0,4);
  const palette = ['#6366f1','#22c55e','#f59e0b','#ef4444'];
  const buildPie = (elId, arr) => {
    const el = document.getElementById(elId); if(!el) return;
    const ctx = el.getContext('2d');
    const labels = arr.map(x=>x.nome);
    const data = arr.map(x=>x.value||0);
    const colors = palette.slice(0, data.length);
    const key = `__mini_${elId}`;
    const small = (self.innerWidth||0) <= 420;
    if(!window[key]){
      window[key] = new Chart(ctx, { type:'doughnut', data:{ labels, datasets:[{ data, backgroundColor:colors}] }, options:{ responsive:true, maintainAspectRatio:true, aspectRatio: small? 1 : 1.2, plugins:{legend:{display:false}}, cutout:'60%'}});
    } else {
      window[key].data.labels = labels;
      window[key].data.datasets[0].data = data;
      window[key].data.datasets[0].backgroundColor = colors;
      window[key].update();
    }
  };
  buildPie('chartMiniAtual', topN(resumoAtual));
  buildPie('chartMiniCenario', topN(resumoNovo));
};

const renderSimulationOutputs = data => {
  const tituloAtualEl = el('titleAtual');
  if(tituloAtualEl) tituloAtualEl.textContent = data.tituloAtual || 'Modelo atual';
  const tituloNovoEl = el('tituloNovo');
  if(tituloNovoEl) tituloNovoEl.textContent = data.tituloNovo || 'Novo modelo';
  const rotTotNovoEl = el('rotTotNovo');
  if(rotTotNovoEl) rotTotNovoEl.textContent = 'Total (Cenário)';

  const renderRows = rows => {
    if(!rows.length) return '<tr><td colspan="4" class="text-center text-slate-400 text-sm">Sem tributos calculados.</td></tr>';
    return rows.map(row=>`<tr>
      <td class="text-slate-600">${row.nome}</td>
      <td class="text-right">${row.hasBase ? fmtBase(row.baseValue ?? row.base) : '—'}</td>
      <td class="text-right">${fmtAliq(row.aliq)}</td>
      <td class="text-right">${fmtMon(row.valor)}</td>
    </tr>`).join('');
  };

  const tA = el('tAtual');
  if(tA) tA.innerHTML = renderRows(data.atualRows || []);
  // mobile list (Atual)
  try{
    const listA = el('listAtual');
    if(listA){
      const rows = data.atualRows || [];
      listA.innerHTML = rows.length ? rows.map(row=>{
        const sub = [];
        if(row.hasBase) sub.push(`Base: ${fmtBase(row.baseValue ?? row.base)}`);
        if(row.aliq!=null && row.aliq!=='—') sub.push(`Alíquota: ${fmtAliq(row.aliq)}`);
        return `<div class="ml-row"><div class="ml-k">${row.nome}<span class="ml-sub">${sub.join(' • ')}</span></div><div class="ml-v">${fmtMon(row.valor)}</div></div>`;
      }).join('') : '<div class="text-slate-400 text-sm">Sem tributos calculados.</div>';
    }
  }catch(_){ }
  const tN = el('tNovo');
  if(tN) tN.innerHTML = renderRows(data.novoRows || []);
  // mobile list (Cenário)
  try{
    const listN = el('listNovo');
    if(listN){
      const rows = data.novoRows || [];
      listN.innerHTML = rows.length ? rows.map(row=>{
        const sub = [];
        if(row.hasBase) sub.push(`Base: ${fmtBase(row.baseValue ?? row.base)}`);
        if(row.aliq!=null && row.aliq!=='—') sub.push(`Alíquota: ${fmtAliq(row.aliq)}`);
        return `<div class="ml-row"><div class="ml-k">${row.nome}<span class="ml-sub">${sub.join(' • ')}</span></div><div class="ml-v">${fmtMon(row.valor)}</div></div>`;
      }).join('') : '<div class="text-slate-400 text-sm">Sem tributos calculados.</div>';
    }
  }catch(_){ }

  if(el('totAtual')) el('totAtual').textContent = fmtMon(data.totalAtual || 0);
  if(el('totNovo')) el('totNovo').textContent = fmtMon(data.totalNovo || 0);
  // Add mobile summary footers
  try{
    const addSum = (idTotal,idEfet,into)=>{
      const wrap = el(into); if(!wrap) return;
      const tot = el(idTotal)?.textContent || '';
      const eff = el(idEfet)?.textContent || '';
      const sum = document.createElement('div');
      sum.className='ml-row';
      sum.innerHTML = `<div class="ml-k">Total<span class="ml-sub">Alíquota efetiva: ${eff}</span></div><div class="ml-v">${tot}</div>`;
      wrap.appendChild(sum);
    };
    addSum('totAtual','efetAtual','listAtual');
    addSum('totNovo','efetNovo','listNovo');
  }catch(_){ }
  

  const efetAtual = data.baseEfetivaAtual>0 ? (data.totalAtual/data.baseEfetivaAtual*100) : 0;
  const efetNovo = data.baseEfetivaNovo>0 ? (data.totalNovo/data.baseEfetivaNovo*100) : 0;
  if(el('efetAtual')) el('efetAtual').textContent = fmtPct(efetAtual);
  if(el('efetNovo')) el('efetNovo').textContent = fmtPct(efetNovo);

  const dif = (data.totalNovo||0) - (data.totalAtual||0);
  const pctVar = (data.totalAtual||0)>0 ? (dif/(data.totalAtual||1)*100) : ((data.totalNovo||0)>0?100:0);
  const difState = Math.abs(dif)>0.01 ? (dif>0?'diff-up':'diff-down') : 'diff-neutral';
  const pctState = Math.abs(pctVar)>0.01 ? (pctVar>0?'diff-up':'diff-down') : 'diff-neutral';

  const difAbsEl = el('difAbs'); if(difAbsEl) difAbsEl.textContent = fmtMon(dif);
  const difPctEl = el('difPct'); if(difPctEl) difPctEl.textContent = fmtPct(pctVar);
  const difAbsHint=el('difAbsHint'); if(difAbsHint) difAbsHint.textContent = dif>0 ? 'Maior carga que o modelo atual' : dif<0 ? 'Economia frente ao modelo atual' : 'Sem variação';
  const difPctHint=el('difPctHint'); if(difPctHint) difPctHint.textContent = dif>0 ? 'Aumento relativo da carga' : dif<0 ? 'Redução relativa da carga' : 'Sem variação';

  const cardDifAbs=el('cardDifAbs'); if(cardDifAbs){ cardDifAbs.classList.remove('diff-up','diff-down','diff-neutral'); cardDifAbs.classList.add(difState); }
  const cardDifPct=el('cardDifPct'); if(cardDifPct){ cardDifPct.classList.remove('diff-up','diff-down','diff-neutral'); cardDifPct.classList.add(pctState); }
  const cardTotais=el('cardTotais'); if(cardTotais){ cardTotais.classList.remove('diff-up','diff-down','diff-neutral'); cardTotais.classList.add(difState); }

  const difAbsIcon=el('difAbsIcon'); if(difAbsIcon) difAbsIcon.textContent = difState==='diff-up'?'▲':difState==='diff-down'?'▼':'■';
  const difPctBar=el('difPctBar'); if(difPctBar){ difPctBar.style.width=`${Math.min(Math.abs(pctVar),100)}%`; difPctBar.classList.remove('diff-up','diff-down','diff-neutral'); difPctBar.classList.add(pctState); }
  const totIcon=el('totIcon'); if(totIcon) totIcon.textContent = difState==='diff-up'?'▲':(difState==='diff-down'?'▼':'⇆');

  if(el('totAtualResumo')) el('totAtualResumo').textContent = fmtMon(data.totalAtual || 0);
  if(el('totNovoResumo')) el('totNovoResumo').textContent = fmtMon(data.totalNovo || 0);

  const buildResumoFallback = rows => rows.map(row=>{
    const baseValue = row.baseValue !== undefined ? row.baseValue : (row.hasBase ? row.base : 0);
    const aliq = row.hasBase && baseValue>0 ? row.valor / baseValue : null;
    return {
      nome: row.nome,
      key: row.nome,
      value: row.valor,
      base: row.hasBase ? baseValue : '—',
      baseValue,
      aliq,
      note: ''
    };
  });
  const resumoAtual = (data.arrAtual && data.arrAtual.length) ? data.arrAtual : buildResumoFallback(data.atualRows || []);
  const resumoNovo = (data.arrCenario && data.arrCenario.length) ? data.arrCenario : buildResumoFallback(data.novoRows || []);
  renderResumoComparativo(resumoAtual, resumoNovo, data.totalAtual, data.totalNovo, data.tituloNovo || 'Novo modelo', data.tituloAtual || 'Modelo atual');
};

const setReceitasTab = key => {
  const buttons = [...document.querySelectorAll('.rc-tab-btn')];
  const panels = [...document.querySelectorAll('.rc-tab-panel')];
  if(!buttons.length || !panels.length) return;
  const target = panels.some(panel => panel.dataset.rcPanel===key) ? key : RECEITAS_DEFAULT_TAB;
  buttons.forEach(btn=>{
    const isActive = btn.dataset.rcTab === target;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  panels.forEach(panel=>{
    const show = panel.dataset.rcPanel === target;
    panel.classList.toggle('hidden', !show);
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-hidden', show ? 'false' : 'true');
  });
  receitasTabsState.current = target;
};

const initReceitasTabs = () => {
  const buttons = [...document.querySelectorAll('.rc-tab-btn')];
  if(!buttons.length) return;
  buttons.forEach(btn=>{
    btn.setAttribute('role','tab');
    btn.addEventListener('click', ()=>setReceitasTab(btn.dataset.rcTab));
  });
  document.querySelector('.rc-tablist')?.setAttribute('role','tablist');
  setReceitasTab(receitasTabsState.current);
};

// (side steps navigation removed per request)

// Abas de Alíquotas
const setAlqTab = key => {
  const buttons = [...document.querySelectorAll('.alq-tab-btn')];
  const panels = [...document.querySelectorAll('[data-alq-panel]')];
  if(!buttons.length || !panels.length) return;
  const valid = panels.some(p => p.dataset.alqPanel===key) ? key : 'consumo';
  buttons.forEach(btn=>{
    const active = btn.dataset.alqTab===valid;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active?'true':'false');
    btn.setAttribute('tabindex', active?'0':'-1');
  });
  panels.forEach(p=>{
    const show = p.dataset.alqPanel===valid;
    p.classList.toggle('hidden', !show);
    p.setAttribute('role','tabpanel');
    p.setAttribute('aria-hidden', show?'false':'true');
  });
};
const initAlqTabs = () => {
  document.querySelectorAll('.alq-tab-btn').forEach(btn=>{
    btn.setAttribute('role','tab');
    btn.addEventListener('click',()=>setAlqTab(btn.dataset.alqTab));
  });
  setAlqTab('consumo');
};


const REDUCTIONS={
  pisCof:{select:'optRedPisCof', input:'redPisCof', wrap:'customWrapRedPisCof'},
  issIcms:{select:'optRedIssIcms', input:'redISSICMS', wrap:'customWrapRedIssIcms', label:'redISSICMSLabel'},
  ipi:{select:'optRedIPI', input:'redIPI', wrap:'customWrapRedIPI'},
  cbsIbs:{select:'optRedCBSIBS', input:'redCBSIBS', wrap:'customWrapRedCBSIBS'},
  seletivo:{select:'optRedSeletivo', input:'redSeletivo', wrap:'customWrapRedSeletivo'},
  irpj:{select:'optRedIRPJ', input:'redIRPJ', wrap:'customWrapRedIRPJ'}
};

const moneyInputs = ['receita','comprasNovo','comprasAtual','comprasICMS','baseSeletivo','despesasLucroReal','snRbt12'];
moneyInputs.forEach(id => { const x = el(id); if(!x) return; x.addEventListener('blur', () => x.value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseBR(x.value))); });

const setDis = (id, disabled) => { const x = el(id); if(!x) return; x.disabled = disabled; x.classList.toggle('opacity-60', disabled); x.classList.toggle('bg-slate-100', disabled); };
const setDisMany = (ids, disabled) => ids.forEach(i=>setDis(i, disabled));
const setScenarioDisabled = disabled => { const sel=el('cenario'); if(!sel) return; sel.disabled=disabled; sel.classList.toggle('opacity-60', disabled); sel.classList.toggle('bg-slate-100', disabled); };

const setRedLabel = () => { const l = el('redISSICMSLabel'); if(!l) return; const tipo = el('tipoOper')?.value; if(tipo==='servico') l.textContent='ISS'; else if(tipo==='mercadoria') l.textContent='ICMS'; else l.textContent='ISS / ICMS'; };
let reductionsGlobalDisabled=false;
const reductionOverrides={ pisCof:false, issIcms:false, ipi:false, cbsIbs:false, seletivo:false, irpj:false };
const isReductionActive = () => true;

const refreshReductionUI = (globalDisabled=null)=>{
  if(globalDisabled!==null) reductionsGlobalDisabled=!!globalDisabled;
  const active=isReductionActive();
  Object.entries(REDUCTIONS).forEach(([key,cfg])=>{
    const sel=el(cfg.select);
    const input=el(cfg.input);
    const wrap=el(cfg.wrap);
    if(!sel || !input) return;
    const forced=reductionOverrides[key];
    const disabled=reductionsGlobalDisabled || forced || !active;
    setDis(cfg.select, disabled);
    const isCustom=sel.value==='custom';
    setDis(cfg.input, disabled || !isCustom);
    if(wrap) wrap.classList.toggle('hidden', !(isCustom && !disabled));
  });
};

const initReductions=()=>{
  Object.entries(REDUCTIONS).forEach(([key,cfg])=>{
    const sel=el(cfg.select);
    const input=el(cfg.input);
    if(!sel || !input) return;
    sel.addEventListener('change',()=>{
      if(sel.value!=='custom') input.value='0';
      refreshReductionUI();
      calcula();
    });
  });
  refreshReductionUI();
};

const applyActivityPreset = (activityId,{silent=false}={}) => {
  const cfg = OPERATION_ACTIVITIES[activityId] || OPERATION_ACTIVITIES.custom;
  const actSel = el('atividadeOper');
  if(actSel){
    suppressActivitySync = true;
    actSel.value = cfg.id;
    suppressActivitySync = false;
  }
  const tipoSel = el('tipoOper');
  if(tipoSel){
    tipoSel.value = cfg.tipoOper || 'servico';
    toggleImpostos();
    updateReceitasComprasVisibility();
  }
  const setPercentField = (fieldId,value)=>{
    const field=el(fieldId);
    if(!field || value===undefined || value===null) return;
    field.value = Number(value).toFixed(2);
  };
  if(cfg.presAliqIrpj!==undefined) setPercentField('presAliqIrpj', cfg.presAliqIrpj);
  if(cfg.presAliqCsll!==undefined) setPercentField('presAliqCsll', cfg.presAliqCsll);
  if(cfg.aliqOutros!==undefined) setPercentField('aliqOutros', cfg.aliqOutros);
  updatePresumidoInfo();
  if(!silent) calcula();
  return cfg;
};

const initOperationActivity = () => {
  const sel=el('atividadeOper');
  if(!sel) return;
  if(!OPERATION_ACTIVITIES[sel.value]) sel.value=DEFAULT_ACTIVITY_ID;
  applyActivityPreset(sel.value,{silent:true});
  // Set helpful titles for each option based on presets
  try{
    const toPct = n => `${Number(n).toFixed(0)}%`;
    const mapTipo = t => t==='mercadoria'?'Mercadoria':(t==='servico'?'Serviço':(t==='none'?'Sem incidência':'—'));
    [...sel.options].forEach(opt=>{
      const key = opt.value; const cfg = OPERATION_ACTIVITIES[key];
      if(!cfg) return;
      const pk = cfg.presKey && PRES_ATIVIDADES[cfg.presKey];
      const ir = (cfg.presAliqIrpj!=null?cfg.presAliqIrpj:(pk?pk.irpj*100:null));
      const cs = (cfg.presAliqCsll!=null?cfg.presAliqCsll:(pk?pk.csll*100:null));
      const tip = mapTipo(cfg.tipoOper);
      const parts = [];
      if(tip) parts.push(`Tipo: ${tip}`);
      if(ir!=null && cs!=null) parts.push(`Presunção LP: IRPJ ${toPct(ir)}, CSLL ${toPct(cs)}`);
      opt.title = parts.join(' • ');
    });
  }catch(_){ }
  sel.addEventListener('change',()=>{
    if(suppressActivitySync) return;
    applyActivityPreset(sel.value,{silent:true});
    updateReceitasComprasVisibility();
    calcula();
  });
};

const getReduction = key => {
  const cfg=REDUCTIONS[key];
  if(!cfg) return 0;
  const sel=el(cfg.select);
  const input=el(cfg.input);
  if(!sel || sel.disabled) return 0;
  if(sel.value==='custom'){
    return clamp01((+input?.value||0)/100);
  }
  return clamp01(parseFloat(sel.value)||0);
};

const toggleImpostos = () => {
  const tEl=el('tipoOper');
  const issGrp=el('grupoISS');
  const icmsGrp=el('grupoICMS');
  if(!tEl||!issGrp||!icmsGrp) return;
  if (tEl.value==='servico'){
    issGrp.classList.remove('hidden');
    icmsGrp.classList.add('hidden');
    setDis('iss',false);
    setDis('icms',true);
    setDis('comprasICMS',true);
    setDis('consideraCredICMS',true);
  } else if(tEl.value==='mercadoria'){
    icmsGrp.classList.remove('hidden');
    issGrp.classList.add('hidden');
    setDis('icms',false);
    setDis('iss',true);
    setDis('comprasICMS',false);
    setDis('consideraCredICMS',false);
  } else {
    issGrp.classList.add('hidden');
    icmsGrp.classList.add('hidden');
    setDis('iss',true);
    setDis('icms',true);
    setDis('comprasICMS',true);
    setDis('consideraCredICMS',true);
    const credChk=el('consideraCredICMS'); if(credChk) credChk.checked=false;
  }
  setRedLabel();
};

const updateReceitasComprasVisibility = () => {
  const regime = el('regimeTrib')?.value || 'real';
  const isSN = regime==='simples';
  const c = el('cenario')?.value || 'piloto2026';
  const tipo = el('tipoOper')?.value || 'servico';
  const act = el('atividadeOper')?.value || DEFAULT_ACTIVITY_ID;
  const scenariosSeletivo = new Set(['cbs2027','ibs2029','ibs2030','ibs2031','ibs2032','regime2033']);

  // Compras & créditos – mostrar/ocultar campos internos
  const showComprasNovo = !isSN && c!=='piloto2026';
  const showComprasAtual = !isSN && regime==='real';
  let showComprasICMS = !isSN && tipo==='mercadoria';
  // Regra solicitada: sempre exibir Compras ICMS no Comércio Varejista (real/presumido)
  if(!isSN && (regime==='real' || regime==='presumido') && act==='comercio_varejo'){
    showComprasICMS = true;
  }
  safe('wrapComprasNovo').toggle('hidden', !showComprasNovo);
  safe('wrapComprasAtual').toggle('hidden', !showComprasAtual);
  safe('wrapComprasICMS').toggle('hidden', !showComprasICMS);
  if(showComprasICMS){ setDis('comprasICMS', false); setDis('consideraCredICMS', false); }

  // Bases específicas – mostrar campos por aplicabilidade
  const showBaseSeletivo = !isSN && (regime==='real' || scenariosSeletivo.has(c));
  const showDespesasReal = !isSN && regime==='real';
  safe('wrapBaseSeletivo').toggle('hidden', !showBaseSeletivo);
  safe('wrapDespesasReal').toggle('hidden', !showDespesasReal);

  // Período: irrelevante para Simples
  safe('blockPeriodo').toggle('hidden', isSN);
};

const showHideSN = () => {
  const isSN=el('regimeTrib')?.value==='simples';
  safe('snInlineConfig').toggle('hidden',!isSN);
  safe('snResumoWrap').toggle('hidden',!isSN);
  // Relatórios e comparativos são controlados pelo cálculo/simulações
  safe('reduzWrap').toggle('hidden',isSN);
  if(isSN){
    const rbt=el('snRbt12');
    if(rbt && !parseBR(rbt.value)) rbt.value=el('receita')?.value||'0,00';
    calculaSN();
  }
};    

const aplicaRegime = () => { const r=el('regimeTrib')?.value; if(!r) return; if(r==='presumido'){ if(el('pis')) el('pis').value=0.65; if(el('cofins')) el('cofins').value=3; } else if(r==='real'){ if(el('pis')) el('pis').value=1.65; if(el('cofins')) el('cofins').value=7.6; }
  if(r!=='simples'){
    if(el('iss')) el('iss').value=5;
    if(el('icms')) el('icms').value=20;
    if(el('cbs')) el('cbs').value=12;
    if(el('ibs')) el('ibs').value=13;
    if(el('seletivo')) el('seletivo').value=0;
    if(el('cpp')) el('cpp').value='0';
    if(el('irpj')) el('irpj').value=15;
    if(el('csll')) el('csll').value=9;
  }
};

const aplicaCenarioNovo = () => { const c=currentScenario(); const cfg=SCENARIO_CONFIG[c]||SCENARIO_CONFIG.regime2033; if(cfg.auto){ if(el('cbs') && cfg.auto.cbs!==undefined) el('cbs').value=cfg.auto.cbs; if(el('ibs') && cfg.auto.ibs!==undefined) el('ibs').value=cfg.auto.ibs; if(el('seletivo') && cfg.auto.seletivo!==undefined) el('seletivo').value=cfg.auto.seletivo; }
  if(el('tituloNovo')) el('tituloNovo').textContent=cfg.title;
  if(el('rotTotNovo')) el('rotTotNovo').textContent=cfg.total;
};

const addRow = (tbody,nome,base,aliq,valor) => { if(!tbody) return; const tr=document.createElement('tr'); tr.innerHTML=`<td class="text-slate-600">${nome}</td><td class="text-right">${fmtBase(base)}</td><td class="text-right">${fmtAliq(aliq)}</td><td class="text-right">${fmtMon(valor)}</td>`; tbody.appendChild(tr); };
const pushComp = (arr,nome,valor,base=null,aliq=null,opts={}) => {
  if(valor===undefined || valor===null) return;
  if(Math.abs(valor) < 1e-9) return;
  arr.push({ nome, key: opts.key || nome, value: valor, base, aliq, note: opts.note || '' });
};

const formatCellStack = (entry,total) => {
  if(!entry) return '<div class="text-slate-400">—</div>';
  const parts=[`<div class="font-semibold">${fmtMon(entry.value)}</div>`];
  if(total>0) parts.push(`<div class="text-xs text-slate-500">Participação: ${fmtPct(entry.value/total*100)}</div>`);
  if(entry.base!==undefined && entry.base!==null && entry.base!=='—') parts.push(`<div class="text-xs text-slate-400">Base: ${fmtBase(entry.base)}</div>`);
  if(entry.aliq!==undefined && entry.aliq!==null && entry.aliq!=='—') parts.push(`<div class="text-xs text-slate-400">Alíquota: ${fmtAliq(entry.aliq)}</div>`);
  if(entry.note) parts.push(`<div class="text-xs text-slate-400">${entry.note}</div>`);
  return parts.join('');
};

const renderResumoComparativo = (dadosAtual,dadosNovo,totalAtual,totalNovo,tituloNovo='Cenário',tituloAtual='Modelo atual') => {
  const body=el('resumoBody'); if(!body) return;
  const small = (self.innerWidth||0) <= 420;
  const headAtual=el('resHeadAtual'); if(headAtual) headAtual.textContent = small ? 'Atual' : tituloAtual;
  const headNovo=el('resHeadNovo'); if(headNovo) headNovo.textContent = small ? 'Cenário' : tituloNovo;
  const mapAtual=Object.create(null);
  const mapNovo=Object.create(null);
  (dadosAtual||[]).forEach(item=>{ mapAtual[item.key||item.nome]=item; });
  (dadosNovo||[]).forEach(item=>{ mapNovo[item.key||item.nome]=item; });
  const keys=new Set([...Object.keys(mapAtual), ...Object.keys(mapNovo)]);
  const sorted=[...keys].sort((a,b)=>{
    const novoB=mapNovo[b]?.value||0;
    const novoA=mapNovo[a]?.value||0;
    if(novoB!==novoA) return novoB-novoA;
    const atualB=mapAtual[b]?.value||0;
    const atualA=mapAtual[a]?.value||0;
    return atualB-atualA;
  });
  if(!sorted.length){
    body.innerHTML='<tr><td colspan="4" class="text-center text-slate-500 text-sm">Nenhum tributo calculado para este cenário.</td></tr>';
    try{ const cardsWrap = el('resumoCards'); if(cardsWrap) cardsWrap.innerHTML=''; }catch(_){ }
  } else {
    body.innerHTML=sorted.map(key=>{
      const atualEntry=mapAtual[key];
      const novoEntry=mapNovo[key];
      const label=atualEntry?.nome || novoEntry?.nome || key;
      const diff=(novoEntry?.value||0)-(atualEntry?.value||0);
      const diffClass=diff>0?'diff-pos':diff<0?'diff-neg':'';
      const diffParts=[`<div class="font-semibold">${fmtMon(diff)}</div>`];
      if(atualEntry && atualEntry.value){
        const perc=diff/atualEntry.value*100;
        diffParts.push(`<div class=\"text-xs text-slate-500\">Variação: ${diff>0?'+':''}${fmtPct(perc)}</div>`);
      } else if(Math.abs(diff)>1e-9){
        diffParts.push('<div class="text-xs text-slate-500">Sem base no modelo atual</div>');
      }
      return `<tr>
        <td>${label}</td>
        <td class="text-right cell-stack">${formatCellStack(atualEntry,totalAtual)}</td>
        <td class="text-right cell-stack">${formatCellStack(novoEntry,totalNovo)}</td>
        <td class="text-right cell-stack ${diffClass}">${diffParts.join('')}</td>
      </tr>`;
    }).join('');
    // Also render mobile card summary
    try{
      const cardsWrap = el('resumoCards');
      if(cardsWrap){
        cardsWrap.innerHTML = sorted.map(key=>{
          const atualEntry=mapAtual[key];
          const novoEntry=mapNovo[key];
          const label=atualEntry?.nome || novoEntry?.nome || key;
          const valA = fmtMon((atualEntry?.value)||0);
          const valN = fmtMon((novoEntry?.value)||0);
          const diff=(novoEntry?.value||0)-(atualEntry?.value||0);
          const perc = (atualEntry && atualEntry.value) ? (diff/(atualEntry.value||1)*100) : null;
          const diffClass = diff>0?'diff-pos':diff<0?'diff-neg':'';
          const varTxt = perc!=null ? `${diff>0?'+':''}${fmtPct(perc)}` : '';
          return `
            <section class="section-block">
              <div class="section-block__header">
                <span class="section-block__label">${label}</span>
                <span class="section-block__hint">${varTxt?`Variação: ${varTxt}`:''}</span>
              </div>
              <div class="section-block__content">
                <div class="w-kv"><div class="k">Atual</div><div class="v">${valA}</div></div>
                <div class="w-kv"><div class="k">Cenário</div><div class="v">${valN}</div></div>
                <div class="w-kv"><div class="k">Dif.</div><div class="v ${diffClass}">${fmtMon(diff)}</div></div>
              </div>
            </section>`;
        }).join('');
      }
    }catch(_){ }
  }
  const totAtualEl=el('resTotAtual'); if(totAtualEl) totAtualEl.textContent=fmtMon(totalAtual);
  const totNovoEl=el('resTotNovo'); if(totNovoEl) totNovoEl.textContent=fmtMon(totalNovo);
  const totDifEl=el('resTotDif');
  if(totDifEl){
    const diff=totalNovo-totalAtual;
    totDifEl.textContent=fmtMon(diff);
    totDifEl.classList.remove('diff-pos','diff-neg');
    if(diff>0) totDifEl.classList.add('diff-pos'); else if(diff<0) totDifEl.classList.add('diff-neg');
  }
  try{ window.updateMiniCharts(totalAtual, totalNovo, dadosAtual, dadosNovo); }catch(_){ }
};

const PRES_ATIVIDADES={
  comercio:{ irpj:0.08, csll:0.12, ref:'Lei 9.249/1995, art. 15, III “a” e Lei 7.689/1988, art. 20.' },
  transportes:{ irpj:0.08, csll:0.12, ref:'Lei 9.249/1995, art. 15, III “a”.' },
  passageiros:{ irpj:0.16, csll:0.12, ref:'Lei 9.249/1995, art. 15, §1º III.' },
  hospitalar:{ irpj:0.08, csll:0.12, ref:'Lei 9.249/1995, art. 15, §1º III “a”.' },
  combustiveis:{ irpj:0.016, csll:0.12, ref:'Lei 9.718/1998, art. 15.' },
  retpa:{ irpj:0.04, csll:0.04, ref:'Regime especial da construção civil – Lei 10.931/2004 (RET).' },
  locacao:{ irpj:0.32, csll:0.32, ref:'Locação de bens imóveis – Lei 9.249/1995, art. 15, §1º III “c”.' },
  servicos:{ irpj:0.32, csll:0.32, ref:'Lei 9.249/1995, art. 15, §1º III “c”.' }
};
const IRPJ_EXTRA_THRESHOLD=20000;

const defaultPresAtividade=()=>{
  const actSel = el('atividadeOper')?.value || DEFAULT_ACTIVITY_ID;
  const cfg = OPERATION_ACTIVITIES[actSel] || OPERATION_ACTIVITIES.custom;
  return cfg.presKey || 'servicos';
};
const updatePresumidoInfo=()=>{
  const regime = el('regimeTrib')?.value;
  if(regime!=='presumido') return;
  const actSel = el('atividadeOper')?.value || DEFAULT_ACTIVITY_ID;
  const cfg = OPERATION_ACTIVITIES[actSel] || OPERATION_ACTIVITIES.custom;
  if(cfg && cfg.presAliqIrpj!==undefined) setPercentField('presAliqIrpj', cfg.presAliqIrpj);
  if(cfg && cfg.presAliqCsll!==undefined) setPercentField('presAliqCsll', cfg.presAliqCsll);
};

const SN_LIMITS=[180000,360000,720000,1800000,3600000,4800000];
const SN={ I:[[0.04,0],[0.073,5940],[0.095,13860],[0.107,22500],[0.143,87300],[0.19,378000]], II:[[0.045,0],[0.078,5940],[0.10,13860],[0.112,22500],[0.147,85500],[0.30,720000]], III:[[0.06,0],[0.112,9360],[0.135,17640],[0.16,35640],[0.21,125640],[0.33,648000]], IV:[[0.045,0],[0.09,8100],[0.102,12420],[0.14,39780],[0.22,183780],[0.33,828000]], V:[[0.155,0],[0.18,4500],[0.195,9900],[0.205,17100],[0.23,62100],[0.305,540000]] };
// Repartição do DAS por anexo/faixa (quando disponível). Fallback: repartição fixa por anexo
const SN_SPLIT_FAIXA={
  I:[
    { IRPJ:0.040, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.305 },
    { IRPJ:0.040, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.305 },
    { IRPJ:0.040, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.305 },
    { IRPJ:0.040, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.305 },
    { IRPJ:0.040, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.305 },
    { IRPJ:0.040, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.305 },
  ],
  II:[
    { IRPJ:0.045, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.300 },
    { IRPJ:0.045, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.300 },
    { IRPJ:0.045, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.300 },
    { IRPJ:0.045, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.300 },
    { IRPJ:0.045, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.300 },
    { IRPJ:0.045, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.420, ICMS:0.300 },
  ],
  // Anexo III – Serviços (valores por faixa; aproximados de extratos oficiais)
  // Faixas 1..6: shares somam 1.0
  III:[
    { IRPJ:0.0402, CSLL:0.0351, COFINS:0.1284, PIS:0.0277, CPP:0.4340, ISS:0.3346 }, // Faixa 1 – calibrado por extrato (6,00%)
    { IRPJ:0.0400, CSLL:0.0350, COFINS:0.1330, PIS:0.0289, CPP:0.4200, ISS:0.3431 }, // Faixa 2
    { IRPJ:0.0450, CSLL:0.0350, COFINS:0.1550, PIS:0.0350, CPP:0.4200, ISS:0.3100 }, // Faixa 3 (padrão anterior)
    { IRPJ:0.0400, CSLL:0.0350, COFINS:0.1365, PIS:0.0296, CPP:0.4340, ISS:0.3250 }, // Faixa 4 (ajustado p/ extrato informado)
    { IRPJ:0.0400, CSLL:0.0350, COFINS:0.1330, PIS:0.0290, CPP:0.4340, ISS:0.3290 }, // Faixa 5 (aprox.)
    { IRPJ:0.0500, CSLL:0.0350, COFINS:0.1173, PIS:0.0275, CPP:0.4340, ISS:0.3362 }, // Faixa 6 (aprox.)
  ],
  // Anexo IV – Serviços (CPP fora do DAS; shares renormalizados para o DAS)
  IV:[
    { IRPJ:0.07951, CSLL:0.06184, COFINS:0.21201, PIS:0.04770, ISS:0.59894 },
    { IRPJ:0.07951, CSLL:0.06184, COFINS:0.21201, PIS:0.04770, ISS:0.59894 },
    { IRPJ:0.07951, CSLL:0.06184, COFINS:0.21201, PIS:0.04770, ISS:0.59894 },
    { IRPJ:0.07951, CSLL:0.06184, COFINS:0.21201, PIS:0.04770, ISS:0.59894 },
    { IRPJ:0.07951, CSLL:0.06184, COFINS:0.21201, PIS:0.04770, ISS:0.59894 },
    { IRPJ:0.07951, CSLL:0.06184, COFINS:0.21201, PIS:0.04770, ISS:0.59894 },
  ],
  V:[
    { IRPJ:0.128, CSLL:0.128, COFINS:0.142, PIS:0.034, CPP:0.278, ISS:0.290 },
    { IRPJ:0.128, CSLL:0.128, COFINS:0.142, PIS:0.034, CPP:0.278, ISS:0.290 },
    { IRPJ:0.128, CSLL:0.128, COFINS:0.142, PIS:0.034, CPP:0.278, ISS:0.290 },
    { IRPJ:0.128, CSLL:0.128, COFINS:0.142, PIS:0.034, CPP:0.278, ISS:0.290 },
    { IRPJ:0.128, CSLL:0.128, COFINS:0.142, PIS:0.034, CPP:0.278, ISS:0.290 },
    { IRPJ:0.128, CSLL:0.128, COFINS:0.142, PIS:0.034, CPP:0.278, ISS:0.290 },
  ],
};

const SN_SPLIT={
  I:{ IRPJ:0.04, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.42, ICMS:0.305 },
  II:{ IRPJ:0.045, CSLL:0.035, COFINS:0.165, PIS:0.035, CPP:0.42, ICMS:0.3 },
  III:{ IRPJ:0.045, CSLL:0.035, COFINS:0.155, PIS:0.035, CPP:0.42, ISS:0.31 },
  // Anexo IV: CPP fora do DAS; shares renormalizados (somam 1)
  IV:{ IRPJ:0.07951, CSLL:0.06184, COFINS:0.21201, PIS:0.04770, ISS:0.59894 },
  V:{ IRPJ:0.128, CSLL:0.128, COFINS:0.142, PIS:0.034, CPP:0.278, ISS:0.29 },
  default:{ IRPJ:0.045, CSLL:0.035, COFINS:0.155, PIS:0.035, CPP:0.42, ISS:0.31 }
};

let lastSNCalc={total:0, breakdown:[], fatorR:null, anexo:'III', faixa:1, efetiva:0, rbt12:0, receita:0, folha:0, aliqNominal:0, parcelaDedutivel:0, fatorRAplicado:false, anexoOriginal:'III'};

const snFaixa=(anexo,rbt12)=>{ const tbl=SN[anexo]; let idx=0; for(let i=0;i<SN_LIMITS.length;i++){ if(rbt12>SN_LIMITS[i]) idx=i+1; } if(tbl && idx>=tbl.length) idx=tbl.length-1; if(idx<0) idx=0; const [aliq,pd]=(tbl&&tbl[idx])?tbl[idx]:(tbl?tbl[tbl.length-1]:[0,0]); return {faixa:idx+1,aliq,pd}; };

const snUsesFatorR=()=> el('snAnexo')?.value==='V' && !!el('snFatorToggle')?.checked;

const applySNRateFields=(split,efetiva)=>{
  if(el('regimeTrib')?.value!=='simples') return;
  const setRate=(id,share)=>{
    const input=el(id);
    if(!input) return;
    const rate=(share||0)*efetiva*100;
    input.value=rate.toFixed(2);
  };
  setRate('pis',split.PIS);
  setRate('cofins',split.COFINS);
  setRate('irpj',split.IRPJ);
  setRate('csll',split.CSLL);
  setRate('cpp',split.CPP);
  setRate('iss',split.ISS || 0);
  setRate('icms',split.ICMS || 0);
};

const defaultSNAnexo=()=> (el('tipoOper')?.value==='mercadoria'?'I':'III');
const ensureSNAnexo=()=>{
  const sel=el('snAnexo');
  if(!sel) return;
  if(sel.dataset.userChoice==='true') return;
  const def=defaultSNAnexo();
  if(sel.value!==def){
    sel.value=def;
  }
};

const updateSNControls=()=>{
  const anexo=el('snAnexo')?.value||'III';
  const toggleWrap=el('snFatorToggleWrap');
  if(toggleWrap) toggleWrap.classList.toggle('hidden',anexo!=='V');
  if(anexo!=='V' && el('snFatorToggle')) el('snFatorToggle').checked=false;
  const usaFR=snUsesFatorR();
  const info=el('snFRInfo');
  if(info){
    if(anexo==='V'){
      info.textContent=usaFR?'Fator R aplicado: utilizando alíquotas do Anexo III.':'Marque o Fator R quando a folha for pelo menos 28% do RBT12.';
    } else {
      info.textContent='Fator R não se aplica ao anexo selecionado.';
    }
  }
  calculaSN();
};

const calculaSN=()=>{
  const resumoWrap=el('snResumoWrap');
  if(!resumoWrap) return;

  const receitaPeriodo=Math.max(parseBR(el('receita')?.value)||0,0);
  const rbt12Raw=parseBR(el('snRbt12')?.value)||0;
  const rbt12=rbt12Raw>0?rbt12Raw:(receitaPeriodo||0);
  const axSel=el('snAnexo')?.value||'III';

  const usaFR=snUsesFatorR();
  let anexoFinal=axSel;
  let fatorRAplicado=false;
  if(axSel==='V' && usaFR){
    anexoFinal='III';
    fatorRAplicado=true;
  }

  const dados=snFaixa(anexoFinal,rbt12);
  const efetiva=rbt12>0
    ? Math.max((rbt12*dados.aliq - dados.pd)/rbt12,0)
    : Math.max(dados.aliq,0);
  const das=receitaPeriodo*efetiva;

  const labelAnexo=`Anexo ${anexoFinal}`+(fatorRAplicado?' (Fator R aplicado)':'');
  if(el('snResumoAnexo')) el('snResumoAnexo').textContent=labelAnexo;
  if(el('snResumoHint')) el('snResumoHint').textContent=rbt12>0
    ? `Base RBT12 ${fmtMon(rbt12)}`
    : 'RBT12 não informado (faixa 1 considerada)';
  if(el('snResumoFaixa')) el('snResumoFaixa').textContent=`Faixa ${dados.faixa}`;
  if(el('snResumoFaixaHint')) el('snResumoFaixaHint').textContent=`Alíquota nominal ${(dados.aliq*100).toFixed(2).replace('.',',')}% • Parcela dedutível ${fmtMon(dados.pd)}`;
  if(el('snAliq')) el('snAliq').textContent=fmtPct(efetiva*100);
  if(el('snTot')) el('snTot').textContent=fmtMon(das);
  if(el('snResumoEfet')) el('snResumoEfet').textContent=receitaPeriodo>0
    ? `Aplicado sobre ${fmtMon(receitaPeriodo)} do período`
    : 'Informe a receita do período.';

  const info=el('snFRInfo');
  if(info){
    if(axSel==='V'){
      info.textContent=usaFR?'Fator R aplicado: utilizando alíquotas do Anexo III.':'Marque o Fator R quando a folha for pelo menos 28% do RBT12.';
    } else {
      info.textContent='Fator R não se aplica ao anexo selecionado.';
    }
  }

  const split=(SN_SPLIT_FAIXA[anexoFinal] && SN_SPLIT_FAIXA[anexoFinal][(dados.faixa||1)-1]) || SN_SPLIT[anexoFinal] || SN_SPLIT.default;
  const breakdown=[];
  let fatorNotePend=fatorRAplicado;
  Object.entries(split).forEach(([trib,share])=>{
    const valor=das*share;
    const aliqComp=efetiva*share;
    const note=fatorNotePend? 'Fator R ≥28% aplicado.' : '';
    breakdown.push({nome:trib,key:trib,value:valor,base:receitaPeriodo,aliq:aliqComp,share,note});
    fatorNotePend=false;
  });

  lastSNCalc={
    total:das,
    breakdown,
    fatorR:usaFR?28:null,
    anexo:anexoFinal,
    faixa:dados.faixa,
    efetiva,
    rbt12,
    receita:receitaPeriodo,
    folha:0,
    aliqNominal:dados.aliq,
    parcelaDedutivel:dados.pd,
    fatorRAplicado,
    anexoOriginal:axSel
  };
  applySNRateFields(split,efetiva);
};

const applyContextUI=()=>{ aplicaRegime(); aplicaCenarioNovo(); const regimeEl=el('regimeTrib'); if(!regimeEl) return; const regime=regimeEl.value; const c=currentScenario(); const cfg=SCENARIO_CONFIG[c]||SCENARIO_CONFIG.regime2033; const isSN=regime==='simples'; const atividadeSel=el('atividadeOper'); if(atividadeSel && !suppressActivityPreset) applyActivityPreset(atividadeSel.value||DEFAULT_ACTIVITY_ID,{silent:true}); setScenarioDisabled(false); showHideSN();
  Object.keys(reductionOverrides).forEach(k=>reductionOverrides[k]=false);
  if(isSN){
    setDisMany(['pis','cofins','iss','icms','ipi','cbs','ibs','seletivo','irpj','csll','cpp','comprasNovo','comprasAtual','comprasICMS','baseSeletivo','despesasLucroReal','consideraCredAtual','consideraCredICMS','consideraCredNovo'],true);
    refreshReductionUI(true);
    ensureSNAnexo();
    updateSNControls();
    setDis('receita',false);
  } else {
    setDisMany(['pis','cofins','iss','icms','ipi','irpj','csll','cpp','comprasNovo','comprasAtual','comprasICMS','baseSeletivo','despesasLucroReal','consideraCredAtual','consideraCredICMS','consideraCredNovo','cbs','ibs','seletivo'],false);
    if(c==='piloto2026'){ reductionOverrides.cbsIbs=true; reductionOverrides.seletivo=true; }
    refreshReductionUI(false);
    if(c==='piloto2026'){ setDisMany(['cbs','ibs','seletivo','comprasNovo','consideraCredNovo','baseSeletivo'],true); if(el('consideraCredNovo')) el('consideraCredNovo').checked=false; }
    else if(c==='cbs2027'){ setDis('ibs',true); setDis('cbs',false); setDis('baseSeletivo',false); setDis('comprasNovo',false); setDis('consideraCredNovo',false); }
    else { setDis('cbs',false); setDis('ibs',false); setDis('baseSeletivo',false); setDis('comprasNovo',false); setDis('consideraCredNovo',false); setDis('seletivo',false); }
    if(regime==='presumido'){ if(el('consideraCredAtual')) el('consideraCredAtual').checked=false; setDis('consideraCredAtual',true); setDis('comprasAtual',true); setDis('despesasLucroReal',true);} else if(regime==='real'){ setDis('consideraCredAtual',false); setDis('comprasAtual',false); setDis('despesasLucroReal',false);} else { setDis('despesasLucroReal',true);}        
    updateSNControls();
  }
  toggleImpostos(); updatePresumidoInfo(); updateReceitasComprasVisibility();

  const showCompras=!isSN;
  safe('blockCompras').toggle('hidden',!showCompras);

  const scenariosSeletivo=new Set(['cbs2027','ibs2029','ibs2030','ibs2031','ibs2032','regime2033']);
  const showBases=(regime==='real') || (scenariosSeletivo.has(c) && !isSN);
  safe('blockBases').toggle('hidden',!showBases);
  updateQuickStats();
};

    const calcula = () => {
      const statusEl = el('status');
      if(statusEl) statusEl.textContent = 'Calculando…';
      const entradas = baseDataset.length ? baseDataset : [];
      if(!entradas.length){
        clearSimulationOutputs();
        // Oculta relatórios/gráficos enquanto não há simulações
        safe('cardsPadrao').toggle('hidden', true);
        safe('comparativoWrap').toggle('hidden', true);
        safe('reportsEmpty').toggle('hidden', false);
        if(statusEl) statusEl.textContent = 'Adicione dados para calcular.';
        try{ localStorage.setItem('fiscalflash:last', JSON.stringify(snapshot())); }catch(_){ }
        updateQuickStats();
        hasSimulated = false;
        lockGlobalConfigIfHasItems();
        return;
      }
      const data = aggregateEntries(entradas);
      renderSimulationOutputs(data);
      // Exibe relatórios/gráficos quando houver simulações
      safe('cardsPadrao').toggle('hidden', false);
      safe('comparativoWrap').toggle('hidden', false);
      safe('reportsEmpty').toggle('hidden', true);
      if(statusEl) statusEl.textContent = 'Pronto';
      try{ localStorage.setItem('fiscalflash:last', JSON.stringify(snapshot())); }catch(_){ }
      updateQuickStats();
  hasSimulated = true;
  lockGlobalConfigIfHasItems();
    };

initReductions();

const init=()=>{ initReceitasTabs(); initAlqTabs(); initBaseDataset(); initOperationActivity(); applyContextUI(); calcula(); };

document.getElementById('btnCalcular')?.addEventListener('click',()=>{
  captureBaseDatasetEntry();
  calcula();
  const statusEl = el('status');
  if(statusEl){
    statusEl.textContent = `Base atualizada (${baseDataset.length} itens)`;
    setTimeout(()=>{ if(statusEl.textContent?.startsWith('Base atualizada')) statusEl.textContent='Pronto'; }, 2500);
  }
});

document.getElementById('btnReset')?.addEventListener('click',()=>{
  if(!el('receita')) return;
  const ok = confirm('Limpar todos os campos e remover itens da base?');
  if(!ok) return;
  el('receita').value='100.000,00';
  el('meses').value='1';
  el('comprasAtual').value='50.000,00';
  el('comprasNovo').value='50.000,00';
  if(el('comprasICMS')) el('comprasICMS').value='50.000,00';
  el('baseSeletivo').value='0,00';
  el('despesasLucroReal').value='80.000,00';
  if(el('presAtividade')){ el('presAtividade').dataset.userChoice='false'; el('presAtividade').value=defaultPresAtividade(); }
  el('pis').value=1.65; el('cofins').value=7.6; el('iss').value=5; el('icms').value=20; el('ipi').value=0; el('cbs').value=12; el('ibs').value=13; el('seletivo').value=0; el('irpj').value=15; el('csll').value=9;
  if(el('cpp')) el('cpp').value='0';
  if(el('snRbt12')) el('snRbt12').value='0,00';
  if(el('snAnexo')){ el('snAnexo').value=defaultSNAnexo(); el('snAnexo').dataset.userChoice='false'; }
  if(el('snFatorToggle')) el('snFatorToggle').checked=false;
  if(el('regimeTrib')) el('regimeTrib').value='real';
  const sel=el('cenario'); if(sel) sel.value='piloto2026';
  baseDataset.length=0; renderBaseDataset(); aplicaCenarioNovo(); applyContextUI(); clearSimulationOutputs(); hasSimulated=false; lockGlobalConfigIfHasItems(); calcula();
  const statusEl=el('status'); if(statusEl) statusEl.textContent='Base limpa';
  try{ localStorage.removeItem('taxasim:last'); localStorage.removeItem('fiscalflash:last'); }catch(_){ }
  updateQuickStats();
});

// Ações rápidas: selecionar/limpar impostos incluídos
const setIncAll = (val) => {
  const ids = ['incPisCof','incIssIcms','incIpi','incCbsIbs','incSeletivo','incIrpj','incCsll','incOutros'];
  ids.forEach(id => { const elx = document.getElementById(id); if (elx) elx.checked = !!val; });
  calcula();
};
document.getElementById('btnIncAll')?.addEventListener('click', ()=> setIncAll(true));
document.getElementById('btnIncNone')?.addEventListener('click', ()=> setIncAll(false));

// tipoOper é derivado automaticamente do Segmento/Atividade; sem evento manual
el('regimeTrib')?.addEventListener('change',()=>{ applyContextUI(); updateReceitasComprasVisibility(); updatePresumidoInfo(); calcula(); });
// Presunção é ajustada pelo Segmento/Atividade; não há seletor dedicado
el('cenario')?.addEventListener('change',()=>{ applyContextUI(); updateReceitasComprasVisibility(); calcula(); });
el('snAnexo')?.addEventListener('change',()=>{ const sel=el('snAnexo'); if(sel) sel.dataset.userChoice='true'; updateSNControls(); calcula(); });
el('snFatorToggle')?.addEventListener('change',()=>{ updateSNControls(); calcula(); });
el('snCompararFora')?.addEventListener('change',()=>{ calcula(); });

// Ativação não é necessária; campos de redução ficam sempre disponíveis

['input','change'].forEach(evt=>{
  document.body.addEventListener(evt,e=>{
    if(e.target && (e.target.matches('input')||e.target.matches('select'))){
      clearTimeout(window.__deb);
      window.__deb=setTimeout(()=>{
        const id=e.target.id||'';
        if(id==='snRbt12'){ calculaSN(); }
        calcula();
        updateQuickStats();
      },120);
    }
  });
});

const snapshot=()=>({
  receita:el('receita')?.value,
  meses:el('meses')?.value,
  comprasAtual:el('comprasAtual')?.value,
  comprasNovo:el('comprasNovo')?.value,
  comprasICMS:el('comprasICMS')?.value,
  baseSeletivo:el('baseSeletivo')?.value,
  despesasReal:el('despesasLucroReal')?.value,
  presAt:el('presAtividade')?.value,
  pis:el('pis')?.value,
  cofins:el('cofins')?.value,
  iss:el('iss')?.value,
  icms:el('icms')?.value,
  ipi:el('ipi')?.value,
  cbs:el('cbs')?.value,
  ibs:el('ibs')?.value,
  seletivo:el('seletivo')?.value,
  irpj:el('irpj')?.value,
  csll:el('csll')?.value,
  cpp:el('cpp')?.value,
  aliqOutros:el('aliqOutros')?.value,
  presAliqIrpj:el('presAliqIrpj')?.value,
  presAliqCsll:el('presAliqCsll')?.value,
  credA:el('consideraCredAtual')?.checked,
  credIcms:el('consideraCredICMS')?.checked,
  credN:el('consideraCredNovo')?.checked,
  tipo:el('tipoOper')?.value,
  atividade:el('atividadeOper')?.value,
  regime:el('regimeTrib')?.value,
  cenario:el('cenario')?.value,
  optPisCof:el('optRedPisCof')?.value,
  optIssIcms:el('optRedIssIcms')?.value,
  optIPI:el('optRedIPI')?.value,
  optCBSIBS:el('optRedCBSIBS')?.value,
  optSeletivo:el('optRedSeletivo')?.value,
  optIRPJ:el('optRedIRPJ')?.value,
  redPC:el('redPisCof')?.value,
  redII:el('redISSICMS')?.value,
  redIPI:el('redIPI')?.value,
  redCB:el('redCBSIBS')?.value,
  redSE:el('redSeletivo')?.value,
  redIR:el('redIRPJ')?.value,
  snRbt:el('snRbt12')?.value,
  snAnexo:el('snAnexo')?.value,
  snFator:el('snFatorToggle')?.checked,
  dataset: baseDataset.map(item=>({
    ...item,
    addedAt: item.addedAt instanceof Date ? item.addedAt.toISOString() : item.addedAt
  }))
});

const restore=s=>{ if(!s) return; if(el('receita')) el('receita').value=s.receita; if(el('meses') && s.meses!==undefined) el('meses').value=s.meses; if(el('comprasAtual')) el('comprasAtual').value=s.comprasAtual; if(el('comprasNovo')) el('comprasNovo').value=s.comprasNovo; if(el('comprasICMS') && s.comprasICMS!==undefined) el('comprasICMS').value=s.comprasICMS; if(el('baseSeletivo')) el('baseSeletivo').value=s.baseSeletivo; if(el('despesasLucroReal')) el('despesasLucroReal').value=s.despesasReal||'0,00'; if(el('presAtividade') && s.presAt){ el('presAtividade').value=s.presAt; el('presAtividade').dataset.userChoice='true'; }
  const atividadeRestore = s.atividade || DEFAULT_ACTIVITY_ID;
  if(el('atividadeOper')){
    suppressActivitySync=true;
    el('atividadeOper').value=atividadeRestore;
    suppressActivitySync=false;
    applyActivityPreset(atividadeRestore,{silent:true});
  }
  if(el('pis')) el('pis').value=s.pis;
  if(el('cofins')) el('cofins').value=s.cofins;
  if(el('iss')) el('iss').value=s.iss;
  if(el('icms')) el('icms').value=s.icms;
  if(el('ipi')) el('ipi').value=s.ipi;
  if(el('cbs')) el('cbs').value=s.cbs;
  if(el('ibs')) el('ibs').value=s.ibs;
  if(el('seletivo')) el('seletivo').value=s.seletivo;
  if(el('irpj')) el('irpj').value=s.irpj;
  if(el('csll')) el('csll').value=s.csll;
  if(el('cpp') && s.cpp!==undefined) el('cpp').value=s.cpp;
  if(el('aliqOutros') && s.aliqOutros!==undefined) el('aliqOutros').value=s.aliqOutros;
  if(el('presAliqIrpj') && s.presAliqIrpj!==undefined) el('presAliqIrpj').value=s.presAliqIrpj;
  if(el('presAliqCsll') && s.presAliqCsll!==undefined) el('presAliqCsll').value=s.presAliqCsll;
  if(el('consideraCredAtual')) el('consideraCredAtual').checked=!!s.credA;
  if(el('consideraCredNovo')) el('consideraCredNovo').checked=!!s.credN; if(el('consideraCredICMS')) el('consideraCredICMS').checked=!!s.credIcms;
  if(el('tipoOper')){
    suppressTipoOperSync=true;
    el('tipoOper').value=s.tipo;
    suppressTipoOperSync=false;
  }
  if(el('regimeTrib')) el('regimeTrib').value=s.regime;
  if(el('cenario') && s.cenario) el('cenario').value=s.cenario;
  if(el('snRbt12') && s.snRbt!==undefined) el('snRbt12').value=s.snRbt;
  if(el('snAnexo') && s.snAnexo!==undefined) el('snAnexo').value=s.snAnexo;
  if(el('snFatorToggle') && s.snFator!==undefined) el('snFatorToggle').checked=!!s.snFator;
  updateSNControls();
  if(el('optRedPisCof') && s.optPisCof!==undefined){ el('optRedPisCof').value=s.optPisCof; el('optRedPisCof').dispatchEvent(new Event('change')); }
  if(el('optRedIssIcms') && s.optIssIcms!==undefined){ el('optRedIssIcms').value=s.optIssIcms; el('optRedIssIcms').dispatchEvent(new Event('change')); }
  if(el('optRedIPI') && s.optIPI!==undefined){ el('optRedIPI').value=s.optIPI; el('optRedIPI').dispatchEvent(new Event('change')); }
  if(el('optRedCBSIBS') && s.optCBSIBS!==undefined){ el('optRedCBSIBS').value=s.optCBSIBS; el('optRedCBSIBS').dispatchEvent(new Event('change')); }
  if(el('optRedSeletivo') && s.optSeletivo!==undefined){ el('optRedSeletivo').value=s.optSeletivo; el('optRedSeletivo').dispatchEvent(new Event('change')); }
  if(el('optRedIRPJ') && s.optIRPJ!==undefined){ el('optRedIRPJ').value=s.optIRPJ; el('optRedIRPJ').dispatchEvent(new Event('change')); }
  if(el('redPisCof') && s.redPC!==undefined) el('redPisCof').value=s.redPC;
  if(el('redISSICMS') && s.redII!==undefined) el('redISSICMS').value=s.redII;
  if(el('redIPI') && s.redIPI!==undefined) el('redIPI').value=s.redIPI;
  if(el('redCBSIBS') && s.redCB!==undefined) el('redCBSIBS').value=s.redCB;
  if(el('redSeletivo') && s.redSE!==undefined) el('redSeletivo').value=s.redSE;
  if(el('redIRPJ') && s.redIR!==undefined) el('redIRPJ').value=s.redIR;
  refreshReductionUI();
  aplicaCenarioNovo();
  updatePresumidoInfo();
  baseDataset.length=0;
  if(Array.isArray(s.dataset)){
    s.dataset.forEach(item=>{
      const clone={...item};
      if(clone.addedAt) clone.addedAt=new Date(clone.addedAt);
      baseDataset.push(clone);
    });
  }
  renderBaseDataset();
  if(typeof lockGlobalConfigIfHasItems==='function') lockGlobalConfigIfHasItems();
  suppressActivityPreset = true;
  applyContextUI();
  suppressActivityPreset = false;
  calcula();
};


document.getElementById('btnExport')?.addEventListener('click', ()=>window.print());
document.getElementById('btnSimularAgora')?.addEventListener('click', ()=>{
  captureBaseDatasetEntry();
  calcula();
  document.getElementById('comparativoWrap')?.scrollIntoView({behavior:'smooth', block:'start'});
});
document.getElementById('btnSimularAgoraAlt')?.addEventListener('click', ()=>{
  captureBaseDatasetEntry();
  calcula();
  document.getElementById('comparativoWrap')?.scrollIntoView({behavior:'smooth', block:'start'});
});
// Validation helper for activity presets
window.runActivityPresetValidation = () => {
  const out = { ok:true, issues:[] };
  const toPct = n => Math.round(Number(n||0));
  Object.values(OPERATION_ACTIVITIES).forEach(cfg=>{
    if(!cfg || !cfg.id || cfg.id==='custom') return;
    const pk = cfg.presKey && PRES_ATIVIDADES[cfg.presKey];
    if(pk){
      const expectIR = toPct(pk.irpj*100);
      const expectCS = toPct(pk.csll*100);
      const gotIR = toPct(cfg.presAliqIrpj);
      const gotCS = toPct(cfg.presAliqCsll);
      if(expectIR!==gotIR || expectCS!==gotCS){
        out.ok=false; out.issues.push({ id:cfg.id, field:'pres', expected:{ irpj:expectIR, csll:expectCS }, got:{ irpj:gotIR, csll:gotCS } });
      }
    }
    const validTipo = ['servico','mercadoria','none',null,undefined];
    if(!validTipo.includes(cfg.tipoOper)){
      out.ok=false; out.issues.push({ id:cfg.id, field:'tipoOper', expected:'servico/mercadoria/none', got:String(cfg.tipoOper) });
    }
  });
  if(!out.ok) console.warn('Activity preset validation issues:', out.issues);
  else console.log('Activity preset validation: OK');
  try{ const m=out.ok?'Validação de segmentos: OK':'Validação: itens com divergência (veja o console)'; const ok=out.ok; const elx=document.createElement('div'); elx.style.position='fixed'; elx.style.right='1rem'; elx.style.bottom='1rem'; elx.style.zIndex='9999'; elx.style.background= ok? 'rgba(16,185,129,.95)':'rgba(239,68,68,.95)'; elx.style.color='#fff'; elx.style.padding='.65rem .9rem'; elx.style.borderRadius='.65rem'; elx.textContent=m; document.body.appendChild(elx); setTimeout(()=>{ try{ elx.remove(); }catch(_){ } }, 3200); }catch(_){ }
  return out;
};
// Auto-run validation with ?qaAct=1
try{ const u = new URL(location.href); if(u.searchParams.get('qaAct')==='1'){ setTimeout(()=>window.runActivityPresetValidation(), 250); } }catch(_){ }
// (mantendo layout original; sem reordenação dinâmica)
// Remover Service Worker para evitar problemas de cache em viewers restritivos (MCP)
(async () => {
  try{
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister().catch(()=>{})));
    }
    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k).catch(()=>{})));
    }
  }catch(_){ /* ignore */ }
})();
init();
// Restore last snapshot (if any)
try{
  const saved = localStorage.getItem('fiscalflash:last') || localStorage.getItem('taxasim:last');
  if(saved){
    const parsed = JSON.parse(saved);
    if(parsed) restore(parsed);
  }
}catch(_){ }
updateQuickStats();
// Fallback: se a CDN do Chart.js falhar, tenta carregar a cópia local e recalcular
(function(){
  if(typeof Chart==='undefined'){
    try{
      var s=document.createElement('script');
      s.src='vendor/chart.umd.min.js';
      s.defer=true;
      s.onload=function(){ try{ window.applyChartTheme(); calcula(); }catch(_){} };
      document.head.appendChild(s);
    }catch(_){ }
  }
})();

// UX smoke test runner (optional): run with ?qa=1 or call window.runUXSmokeTest()
const __makeToast = (html, ok=true) => {
  const elx = document.createElement('div');
  elx.setAttribute('role','status');
  elx.style.position='fixed'; elx.style.right='1rem'; elx.style.bottom='1rem'; elx.style.zIndex='9999';
  elx.style.background = ok ? 'rgba(16,185,129,.95)' : 'rgba(239,68,68,.95)';
  elx.style.color = '#fff'; elx.style.padding='.75rem 1rem'; elx.style.borderRadius='.75rem'; elx.style.boxShadow='var(--shadow-md)';
  elx.innerHTML = html;
  document.body.appendChild(elx);
  setTimeout(()=>{ try{ elx.remove(); }catch(_){} }, 3500);
  return elx;
};
window.runUXSmokeTest = async () => {
  const out = { steps:[], pass:true };
  const step = (name, fn) => {
    try{ const r = fn(); out.steps.push({ name, ok:true, info:r }); return r; }
    catch(e){ out.steps.push({ name, ok:false, error:String(e&&e.message||e) }); out.pass=false; }
  };
  step('Chart.js loaded', ()=> typeof Chart !== 'undefined');
  step('Capture item', ()=>{ const before = baseDataset.length; captureBaseDatasetEntry(); calcula(); return baseDataset.length>before; });
  step('Item card present', ()=>{ const card = document.querySelector('#baseDatasetLista article.card'); if(!card) throw new Error('card not found'); return true; });
  step('Section blocks present', ()=>{ const card = document.querySelector('#baseDatasetLista article.card'); const labels = [...card.querySelectorAll('.section-block__label')].map(x=>x.textContent.trim()); const need=['Cenário & Config','Valores','Alíquotas','Opções','Deduções']; const miss=need.filter(x=>!labels.includes(x)); if(miss.length) throw new Error('missing sections: '+miss.join(', ')); return true; });
  step('Toggle edit on', ()=>{ const btn = document.querySelector('#baseDatasetLista [data-entry-edit]'); if(!btn) throw new Error('edit button not found'); btn.click(); return true; });
  step('Inputs editable', ()=>{ const card = document.querySelector('#baseDatasetLista article.card'); const anyDisabled = !!card.querySelector('.w-input:disabled'); if(anyDisabled) throw new Error('some inputs remain disabled'); return true; });
  step('Toggle edit off', ()=>{ const btn = document.querySelector('#baseDatasetLista [data-entry-edit]'); if(!btn) throw new Error('edit button not found'); btn.click(); return true; });
  step('Inputs readonly style', ()=>{ const card = document.querySelector('#baseDatasetLista article.card'); const ro = card.querySelector('.w-input.opacity-60.bg-slate-100'); if(!ro) throw new Error('readonly style not applied'); return true; });
  console.log('UX smoke test:', out);
  __makeToast(out.pass? 'Teste UX: OK' : 'Teste UX: falhas — ver console', out.pass);
  return out;
};
try{ const url = new URL(location.href); if(url.searchParams.get('qa')==='1'){ setTimeout(()=>window.runUXSmokeTest(), 300); } }catch(_){ }
  

(function(){
  const toggleBtn = document.getElementById('themeToggle');
  if(!toggleBtn) return;
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    // Atualiza o ícone: lua (🌙) para modo claro, sol (☀️) para modo escuro
    toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    // Atualiza a cor do tema para a barra do navegador
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if(themeMeta){ themeMeta.setAttribute('content', theme === 'dark' ? '#1A2F4A' : '#1E3A8A'); }
    // Atualiza atributos de acessibilidade do botão de tema
    const toLabel = theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    toggleBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', toLabel);
    toggleBtn.setAttribute('title', toLabel);
    try{ window.applyChartTheme(theme); }catch(_){ }
  };
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);
  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });
})();
  
