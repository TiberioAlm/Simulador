import { clamp01 } from './format';
import {
  IRPJ_EXTRA_THRESHOLD,
  PRES_ATIVIDADES,
  SCENARIO_CONFIG,
  SN,
  SN_LIMITS,
  SN_SPLIT,
  SN_SPLIT_FAIXA,
  SimplesAnexo
} from './scenario';

export type ReductionKey = 'pisCof' | 'issIcms' | 'ipi' | 'cbsIbs' | 'seletivo' | 'irpj';

export interface ReductionOption {
  opt?: string | number | null;
  custom?: number | null;
}

export interface EntryReductions {
  ativo?: boolean;
  pisCof?: ReductionOption;
  issIcms?: ReductionOption;
  ipi?: ReductionOption;
  cbsIbs?: ReductionOption;
  seletivo?: ReductionOption;
  irpj?: ReductionOption;
}

export interface SimulationEntry {
  id?: string;
  cenario: string;
  regime: 'simples' | 'presumido' | 'real';
  tipo: 'servico' | 'mercadoria' | 'none';
  receita: number;
  comprasNovo: number;
  comprasAtual: number;
  comprasICMS: number;
  baseSeletivo: number;
  despesasLucroReal: number;
  meses?: number;
  pis: number;
  cofins: number;
  iss: number;
  icms: number;
  ipi: number;
  cbs: number;
  ibs: number;
  seletivo: number;
  irpj: number;
  csll: number;
  cpp?: number;
  aliqOutros?: number;
  incPisCof?: boolean;
  incIssIcms?: boolean;
  incIpi?: boolean;
  incCbsIbs?: boolean;
  incSeletivo?: boolean;
  incIrpj?: boolean;
  incCsll?: boolean;
  incOutros?: boolean;
  consideraCredAtual?: boolean;
  consideraCredICMS?: boolean;
  consideraCredNovo?: boolean;
  presAliqIrpj?: number | null;
  presAliqCsll?: number | null;
  presAtividade?: string;
  reducoes?: EntryReductions;
  snAnexo?: SimplesAnexo;
  snFatorToggle?: boolean;
  snCompararFora?: boolean;
  snRbt12?: number;
}

export interface SimulationRow {
  nome: string;
  base: number | '—';
  baseValue: number;
  aliq: number | null;
  valor: number;
  hasBase: boolean;
}

export interface SimulationSummaryItem {
  nome: string;
  key: string;
  value: number;
  base: number;
  aliq: number | null;
  note?: string;
}

export interface SimplesResult {
  total: number;
  breakdown: SimulationSummaryItem[];
  receita: number;
  efetiva: number;
  faixa: number;
  aliqNominal: number;
  parcelaDedutivel: number;
  anexoFinal: SimplesAnexo;
  anexoOriginal: SimplesAnexo;
  fatorRAplicado: boolean;
}

export interface EvaluationResult {
  totalAtual: number;
  totalNovo: number;
  arrAtual: SimulationSummaryItem[];
  arrCenario: SimulationSummaryItem[];
  atualRows: SimulationRow[];
  novoRows: SimulationRow[];
  baseEfetivaAtual: number;
  baseEfetivaNovo: number;
  tituloNovo: string;
  rotuloNovo: string;
  visLabelAtual: string;
}

export interface AggregateResult {
  totalAtual: number;
  totalNovo: number;
  arrAtual: SimulationSummaryItem[];
  arrCenario: SimulationSummaryItem[];
  atualRows: SimulationRow[];
  novoRows: SimulationRow[];
  baseEfetivaAtual: number;
  baseEfetivaNovo: number;
  tituloNovo: string;
  rotuloNovo: string;
  tituloAtual: string;
}

const nearlyZero = (value: number) => Math.abs(value) < 1e-9;

const reductionRatio = (cfg?: ReductionOption | null): number => {
  if (!cfg) {
    return 0;
  }
  if (cfg.opt === 'custom') {
    const custom = Number(cfg.custom ?? 0);
    return clamp01(custom / 100);
  }
  const optNum = typeof cfg.opt === 'string' ? parseFloat(cfg.opt) : Number(cfg.opt ?? 0);
  if (!Number.isFinite(optNum)) {
    return 0;
  }
  return clamp01(optNum);
};

export const getReductionForEntry = (entry: SimulationEntry, key: ReductionKey): number => {
  if (!entry.reducoes?.ativo) {
    return 0;
  }
  return reductionRatio(entry.reducoes[key]);
};

const pushComp = (
  arr: SimulationSummaryItem[],
  nome: string,
  valor: number,
  base: number,
  aliq: number | null,
  opts: { key?: string; note?: string } = {}
) => {
  if (valor === null || valor === undefined || nearlyZero(valor)) {
    return;
  }
  arr.push({
    nome,
    key: opts.key ?? nome,
    value: valor,
    base,
    aliq,
    note: opts.note ?? ''
  });
};

const snFaixaInfo = (anexo: SimplesAnexo, rbt12: number) => {
  const tabela = SN[anexo];
  let idx = 0;
  for (let i = 0; i < SN_LIMITS.length; i += 1) {
    if (rbt12 > SN_LIMITS[i]) {
      idx = i + 1;
    }
  }
  if (idx >= tabela.length) {
    idx = tabela.length - 1;
  }
  if (idx < 0) {
    idx = 0;
  }
  const slot = tabela[idx] ?? tabela[tabela.length - 1] ?? [0, 0];
  const [aliq, pd] = slot;
  return { faixa: idx + 1, aliq, pd };
};

export const computeSNForEntry = (entry: SimulationEntry, receita: number): SimplesResult | null => {
  if (!entry) {
    return null;
  }
  const receitaPeriodo = Math.max(receita || 0, 0);
  const rbt12Raw = entry.snRbt12 ?? 0;
  const rbt12 = rbt12Raw > 0 ? rbt12Raw : receitaPeriodo;
  const defaultAnexo: SimplesAnexo = entry.tipo === 'mercadoria' ? 'I' : 'III';
  const anexoOriginal = entry.snAnexo ?? defaultAnexo;
  const usaFR = anexoOriginal === 'V' && !!entry.snFatorToggle;
  const anexoFinal: SimplesAnexo = usaFR ? 'III' : anexoOriginal;
  const faixaInfo = snFaixaInfo(anexoFinal, rbt12);
  const efetiva = rbt12 > 0 ? Math.max((rbt12 * faixaInfo.aliq - faixaInfo.pd) / rbt12, 0) : Math.max(faixaInfo.aliq, 0);
  const das = receitaPeriodo * efetiva;
  const split = SN_SPLIT_FAIXA[anexoFinal]?.[faixaInfo.faixa - 1] ?? SN_SPLIT[anexoFinal] ?? SN_SPLIT.default;
  const note = usaFR && anexoOriginal === 'V' ? 'Fator R ≥28% aplicado.' : '';
  const breakdown: SimulationSummaryItem[] = Object.entries(split).map(([trib, share]) => ({
    nome: trib,
    key: trib,
    value: das * share,
    base: receitaPeriodo,
    aliq: efetiva * share,
    note
  }));
  return {
    total: das,
    breakdown,
    receita: receitaPeriodo,
    efetiva,
    faixa: faixaInfo.faixa,
    aliqNominal: faixaInfo.aliq,
    parcelaDedutivel: faixaInfo.pd,
    anexoFinal,
    anexoOriginal,
    fatorRAplicado: usaFR
  };
};

const monthsOrDefault = (meses?: number): number => {
  const parsed = Number.isFinite(meses) ? Number(meses) : 0;
  const normalized = Math.max(Math.trunc(parsed) || 1, 1);
  return normalized;
};

export const evaluateEntry = (entry: SimulationEntry): EvaluationResult => {
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
  const p = (entry.pis || 0) / 100;
  const f = (entry.cofins || 0) / 100;
  const alIss = (entry.iss || 0) / 100;
  const alIcms = (entry.icms || 0) / 100;
  const alIpi = (entry.ipi || 0) / 100;
  const alCbs = (entry.cbs || 0) / 100;
  const alIbs = (entry.ibs || 0) / 100;
  const alSel = (entry.seletivo || 0) / 100;
  const alIrpj = (entry.irpj || 0) / 100;
  const alCsll = (entry.csll || 0) / 100;
  const aliqOutrosRate = ((entry.aliqOutros ?? 0) || 0) / 100;
  const presAliqEntryIrpj = entry.presAliqIrpj != null ? entry.presAliqIrpj / 100 : null;
  const presAliqEntryCsll = entry.presAliqCsll != null ? entry.presAliqCsll / 100 : null;
  const credAtual = !!entry.consideraCredAtual;
  const credICMS = !!entry.consideraCredICMS;
  const credNovo = !!entry.consideraCredNovo;
  const redPisCof = clamp01(getReductionForEntry(entry, 'pisCof'));
  const redIssIcms = clamp01(getReductionForEntry(entry, 'issIcms'));
  const redIpi = clamp01(getReductionForEntry(entry, 'ipi'));
  const fatorAliqCbsIbs = 1 - clamp01(getReductionForEntry(entry, 'cbsIbs'));
  const redSel = clamp01(getReductionForEntry(entry, 'seletivo'));
  const redIrpj = clamp01(getReductionForEntry(entry, 'irpj'));

  const basePisCof0 = Math.max(rc - (credAtual ? compA : 0), 0);
  const basePisCof = basePisCof0 * (1 - redPisCof);
  const valPis = regime === 'simples' || entry.incPisCof === false ? 0 : basePisCof * p;
  const valCof = regime === 'simples' || entry.incPisCof === false ? 0 : basePisCof * f;

  const baseIss = rc * (1 - redIssIcms);
  const baseIcms0 = Math.max(rc - (tipoOper === 'mercadoria' && credICMS ? compICMS : 0), 0);
  const baseIcms = baseIcms0 * (1 - redIssIcms);
  const valIss = tipoOper === 'servico' && entry.incIssIcms !== false ? baseIss * alIss : 0;
  const valIcms = tipoOper === 'mercadoria' && entry.incIssIcms !== false ? baseIcms * alIcms : 0;

  const baseIpi = rc * (1 - redIpi);
  const valIpi = entry.incIpi === false ? 0 : baseIpi * alIpi;

  const aliqPisEff = basePisCof > 0 ? valPis / basePisCof : null;
  const aliqCofEff = basePisCof > 0 ? valCof / basePisCof : null;
  const aliqIssEff = baseIss > 0 ? valIss / baseIss : null;
  const aliqIcmsEff = baseIcms > 0 ? valIcms / baseIcms : null;
  const aliqIpiEff = baseIpi > 0 ? valIpi / baseIpi : null;

  const defaultPres = tipoOper === 'mercadoria' ? 'comercio' : 'servicos';
  const presCfg = PRES_ATIVIDADES[entry.presAtividade || ''] || PRES_ATIVIDADES[defaultPres];

  let baseIrpj = 0;
  let baseCsll = 0;
  let valIrpjBase = 0;
  let valIrpjExtra = 0;
  let valCsll = 0;
  const mesesApur = monthsOrDefault(entry.meses);
  const extraTh = IRPJ_EXTRA_THRESHOLD * mesesApur;

  if (regime === 'presumido' && presCfg) {
    const presIrpjRate = presAliqEntryIrpj ?? presCfg.irpj ?? 0;
    const presCsllRate = presAliqEntryCsll ?? presCfg.csll ?? 0;
    baseIrpj = rc * presIrpjRate;
    baseCsll = rc * presCsllRate;
    valIrpjBase = baseIrpj * alIrpj;
    valIrpjExtra = alIrpj > 0 ? Math.max(baseIrpj - extraTh, 0) * 0.1 : 0;
    valCsll = baseCsll * alCsll;
  } else if (regime === 'real') {
    const lucroTributavel = Math.max(rc - despesasReal, 0);
    baseIrpj = lucroTributavel;
    baseCsll = lucroTributavel;
    valIrpjBase = baseIrpj * alIrpj;
    valIrpjExtra = alIrpj > 0 ? Math.max(baseIrpj - extraTh, 0) * 0.1 : 0;
    valCsll = baseCsll * alCsll;
  }

  if (redIrpj > 0) {
    valIrpjBase = valIrpjBase * (1 - redIrpj);
  }
  const valIrpj = entry.incIrpj === false ? 0 : valIrpjBase + valIrpjExtra;
  const valOutros = aliqOutrosRate > 0 && entry.incOutros !== false ? rc * aliqOutrosRate : 0;

  const snCalc = regime === 'simples' ? computeSNForEntry(entry, rc) : null;
  const arrAtual: SimulationSummaryItem[] = [];
  const arrCenario: SimulationSummaryItem[] = [];
  const atualRows: SimulationRow[] = [];
  const novoRows: SimulationRow[] = [];

  const pushRow = (rows: SimulationRow[], nome: string, base: number | null, aliq: number | null, valor: number) => {
    if (!rows || nearlyZero(valor)) {
      return;
    }
    const hasBase = !(base === null || base === undefined || base === '—');
    const numericBase = hasBase ? (base as number) : 0;
    rows.push({ nome, base: hasBase ? numericBase : '—', baseValue: numericBase, aliq, valor, hasBase });
  };

  const pushResumo = (
    arr: SimulationSummaryItem[],
    nome: string,
    valor: number,
    base: number | null,
    aliq: number | null,
    opts: { key?: string; note?: string } = {}
  ) => {
    const numericBase = base == null || base === '—' ? 0 : base;
    pushComp(arr, nome, valor, numericBase, aliq, opts);
  };

  let totalAtual = 0;
  const baseEfetivaAtual = regime === 'simples' ? snCalc?.receita ?? rc : rc;

  if (regime === 'simples') {
    const baseSN = snCalc?.receita ?? rc;
    snCalc?.breakdown.forEach((item) => {
      pushRow(atualRows, item.nome, baseSN, item.aliq, item.value);
      pushResumo(arrAtual, item.nome, item.value, baseSN, item.aliq, {
        key: item.key || item.nome,
        note: item.note || 'Simples (DAS)'
      });
      totalAtual += item.value || 0;
    });
  } else {
    if (valPis > 0) {
      totalAtual += valPis;
      pushRow(atualRows, 'PIS', basePisCof, aliqPisEff, valPis);
      pushResumo(arrAtual, 'PIS', valPis, basePisCof, aliqPisEff, { key: 'PIS' });
    }
    if (valCof > 0) {
      totalAtual += valCof;
      pushRow(atualRows, 'COFINS', basePisCof, aliqCofEff, valCof);
      pushResumo(arrAtual, 'COFINS', valCof, basePisCof, aliqCofEff, { key: 'COFINS' });
    }
    if (valIss > 0) {
      totalAtual += valIss;
      pushRow(atualRows, 'ISS', baseIss, aliqIssEff, valIss);
      pushResumo(arrAtual, 'ISS', valIss, baseIss, aliqIssEff, { key: 'ISS' });
    }
    if (valIcms > 0) {
      totalAtual += valIcms;
      pushRow(atualRows, 'ICMS', baseIcms, aliqIcmsEff, valIcms);
      pushResumo(arrAtual, 'ICMS', valIcms, baseIcms, aliqIcmsEff, { key: 'ICMS' });
    }
    if (valIpi > 0) {
      totalAtual += valIpi;
      pushRow(atualRows, 'IPI', baseIpi, aliqIpiEff, valIpi);
      pushResumo(arrAtual, 'IPI', valIpi, baseIpi, aliqIpiEff, { key: 'IPI' });
    }
    const valIrpjTotalAtual = (valIrpjBase || 0) + (valIrpjExtra || 0);
    if (valIrpjTotalAtual > 0 && entry.incIrpj !== false) {
      totalAtual += valIrpjTotalAtual;
      const aliqIrpjTotal = baseIrpj > 0 ? valIrpjTotalAtual / baseIrpj : null;
      pushRow(atualRows, 'IRPJ', baseIrpj, aliqIrpjTotal, valIrpjTotalAtual);
      pushResumo(arrAtual, 'IRPJ', valIrpjTotalAtual, baseIrpj, aliqIrpjTotal, { key: 'IRPJ' });
    }
    if (valCsll > 0 && entry.incCsll !== false) {
      totalAtual += valCsll;
      const aliqCsll = baseCsll > 0 ? valCsll / baseCsll : null;
      pushRow(atualRows, 'CSLL', baseCsll, aliqCsll, valCsll);
      pushResumo(arrAtual, 'CSLL', valCsll, baseCsll, aliqCsll, { key: 'CSLL' });
    }
  }

  if (valOutros > 0) {
    totalAtual += valOutros;
    pushRow(atualRows, 'Outros tributos', rc, aliqOutrosRate, valOutros);
    pushResumo(arrAtual, 'Outros tributos', valOutros, rc, aliqOutrosRate, { key: 'Outros tributos' });
  }

  const snCompararFora = regime === 'simples' && !!entry.snCompararFora;
  let totalNovo = 0;
  const baseEfetivaNovo = regime === 'simples' && !snCompararFora ? snCalc?.receita ?? rc : rc;

  const appendSNToNovo = () => {
    if (!snCalc) {
      return;
    }
    const baseSN = snCalc.receita ?? rc;
    snCalc.breakdown.forEach((item) => {
      pushRow(novoRows, item.nome, baseSN, item.aliq, item.value);
      pushResumo(arrCenario, item.nome, item.value, baseSN, item.aliq, {
        key: item.key || item.nome,
        note: item.note || 'Simples (DAS)'
      });
    });
  };

  if (regime === 'simples' && !snCompararFora) {
    appendSNToNovo();
    totalNovo = snCalc?.total || 0;
  } else if (entry.cenario === 'piloto2026') {
    if (snCompararFora) {
      appendSNToNovo();
      totalNovo += snCalc?.total || 0;
    }
    const baseGenerica = Math.max(rc - (credNovo ? compN : 0), 0);
    const baseTestes = Math.max(baseGenerica, 0);
    const aliqCbsPiloto = 0.009 * fatorAliqCbsIbs;
    const aliqIbsPiloto = 0.001 * fatorAliqCbsIbs;
    const valCbsPiloto = baseTestes * aliqCbsPiloto;
    const valIbsPiloto = baseTestes * aliqIbsPiloto;
    const devidoPisCof = regime === 'simples' ? 0 : basePisCof * (p + f);
    const comp = Math.min(devidoPisCof, valCbsPiloto + valIbsPiloto);
    const pisCofApos = Math.max(devidoPisCof - comp, 0);
    const aliqCbsReal = baseTestes > 0 ? valCbsPiloto / baseTestes : null;
    const aliqIbsReal = baseTestes > 0 ? valIbsPiloto / baseTestes : null;

    pushRow(novoRows, 'CBS (0,9%) – teste', baseTestes, aliqCbsReal, valCbsPiloto);
    pushRow(novoRows, 'IBS (0,1%) – teste', baseTestes, aliqIbsReal, valIbsPiloto);
    pushRow(novoRows, 'Compensação CBS/IBS × PIS/COFINS', null, null, -comp);
    if (pisCofApos > 0) {
      const aliqPisComp = basePisCof > 0 ? pisCofApos / basePisCof : null;
      pushRow(novoRows, 'PIS+COFINS após compensação', basePisCof, aliqPisComp, pisCofApos);
    }

    const extraSN = valCbsPiloto + valIbsPiloto;
    totalNovo = snCompararFora ? totalNovo + extraSN : devidoPisCof + valIss + valIcms + valIpi + valIrpj + valCsll;

    pushResumo(arrCenario, 'CBS (0,9%) – teste', valCbsPiloto, baseTestes, aliqCbsReal, {
      key: 'CBS_piloto',
      note: 'Piloto 2026'
    });
    pushResumo(arrCenario, 'IBS (0,1%) – teste', valIbsPiloto, baseTestes, aliqIbsReal, {
      key: 'IBS_piloto',
      note: 'Piloto 2026'
    });
    pushResumo(arrCenario, 'Compensação CBS/IBS × PIS/COFINS', -comp, 0, null, {
      key: 'COMP',
      note: 'Crédito compensatório'
    });

    if (pisCofApos > 0 && p + f > 0) {
      const somaAliq = p + f;
      const valPisNovo = pisCofApos * (p / somaAliq);
      const valCofNovo = pisCofApos * (f / somaAliq);
      const aliqPisNovo = basePisCof > 0 ? valPisNovo / basePisCof : null;
      const aliqCofNovo = basePisCof > 0 ? valCofNovo / basePisCof : null;
      if (valPisNovo > 0) {
        pushResumo(arrCenario, 'PIS', valPisNovo, basePisCof, aliqPisNovo, {
          key: 'PIS',
          note: 'Após compensação CBS/IBS'
        });
      }
      if (valCofNovo > 0) {
        pushResumo(arrCenario, 'COFINS', valCofNovo, basePisCof, aliqCofNovo, {
          key: 'COFINS',
          note: 'Após compensação CBS/IBS'
        });
      }
    }

    if (!snCompararFora) {
      if (valIss > 0) {
        pushResumo(arrCenario, 'ISS', valIss, baseIss, aliqIssEff, { key: 'ISS' });
        pushRow(novoRows, 'ISS', baseIss, aliqIssEff, valIss);
      }
      if (valIcms > 0) {
        pushResumo(arrCenario, 'ICMS', valIcms, baseIcms, aliqIcmsEff, { key: 'ICMS' });
        pushRow(novoRows, 'ICMS', baseIcms, aliqIcmsEff, valIcms);
      }
      if (valIpi > 0) {
        pushResumo(arrCenario, 'IPI', valIpi, baseIpi, aliqIpiEff, { key: 'IPI' });
        pushRow(novoRows, 'IPI', baseIpi, aliqIpiEff, valIpi);
      }
      const valIrpjTotalNovo = (valIrpjBase || 0) + (valIrpjExtra || 0);
      if (valIrpjTotalNovo > 0 && entry.incIrpj !== false) {
        const aliqIrpjTotal = baseIrpj > 0 ? valIrpjTotalNovo / baseIrpj : null;
        pushResumo(arrCenario, 'IRPJ', valIrpjTotalNovo, baseIrpj, aliqIrpjTotal, { key: 'IRPJ' });
        pushRow(novoRows, 'IRPJ', baseIrpj, aliqIrpjTotal, valIrpjTotalNovo);
      }
      if (valCsll > 0 && entry.incCsll !== false) {
        const aliqCsll = baseCsll > 0 ? valCsll / baseCsll : null;
        pushResumo(arrCenario, 'CSLL', valCsll, baseCsll, aliqCsll, { key: 'CSLL' });
        pushRow(novoRows, 'CSLL', baseCsll, aliqCsll, valCsll);
      }
    }
  } else {
    if (snCompararFora) {
      appendSNToNovo();
      totalNovo += snCalc?.total || 0;
    }
    const baseCbs0 = Math.max(rc - (credNovo ? compN : 0), 0);
    const aliqCbsNom = alCbs * fatorAliqCbsIbs;
    const aliqIbsNom = alIbs * fatorAliqCbsIbs;
    const valCbs = entry.incCbsIbs === false ? 0 : baseCbs0 * aliqCbsNom;
    const valIbs = entry.incCbsIbs === false ? 0 : baseCbs0 * aliqIbsNom;
    const baseSelAdj = baseSel * (1 - redSel);
    const valSel = entry.incSeletivo === false ? 0 : baseSelAdj * alSel;
    const valIssLegacy = snCompararFora ? 0 : valIss * legacyShare;
    const valIcmsLegacy = snCompararFora ? 0 : valIcms * legacyShare;
    const seletivoTotal = entry.seletivo > 0 && baseSel > 0 ? valSel : 0;
    const valIpiNovo = valIpi;

    const aliqCbsReal = baseCbs0 > 0 ? valCbs / baseCbs0 : null;
    const aliqIbsReal = baseCbs0 > 0 ? valIbs / baseCbs0 : null;
    const aliqSelReal = baseSelAdj > 0 ? valSel / baseSelAdj : null;
    const aliqIssLegacyEff = baseIss > 0 ? valIssLegacy / baseIss : null;
    const aliqIcmsLegacyEff = baseIcms > 0 ? valIcmsLegacy / baseIcms : null;
    const aliqIpiNovo = baseIpi > 0 ? valIpiNovo / baseIpi : null;

    pushRow(novoRows, 'CBS', baseCbs0, aliqCbsReal, valCbs);
    pushResumo(arrCenario, 'CBS', valCbs, baseCbs0, aliqCbsReal);

    const noteIbs = ibsShare > 0 && ibsShare < 1 ? `Quota IBS ${Math.round(ibsShare * 100)}%` : '';
    pushRow(novoRows, 'IBS', baseCbs0, aliqIbsReal, valIbs);
    pushResumo(arrCenario, 'IBS', valIbs, baseCbs0, aliqIbsReal, { note: noteIbs });

    if (seletivoTotal > 0) {
      pushRow(novoRows, 'Imposto Seletivo', baseSelAdj, aliqSelReal, valSel);
      pushResumo(arrCenario, 'Imposto Seletivo', valSel, baseSelAdj, aliqSelReal);
    }

    if (valIssLegacy > 0 && tipoOper === 'servico') {
      const labelIss = legacyShare === 1 ? 'ISS' : 'ISS (legado)';
      const noteIss = legacyShare < 1 ? `Legado ${Math.round(legacyShare * 100)}% da base` : '';
      pushRow(novoRows, labelIss, baseIss, aliqIssLegacyEff, valIssLegacy);
      pushResumo(arrCenario, labelIss, valIssLegacy, baseIss, aliqIssLegacyEff, { key: 'ISS', note: noteIss });
    }
    if (valIcmsLegacy > 0 && tipoOper === 'mercadoria') {
      const labelIcms = legacyShare === 1 ? 'ICMS' : 'ICMS (legado)';
      const noteIcms = legacyShare < 1 ? `Legado ${Math.round(legacyShare * 100)}% da base` : '';
      pushRow(novoRows, labelIcms, baseIcms, aliqIcmsLegacyEff, valIcmsLegacy);
      pushResumo(arrCenario, labelIcms, valIcmsLegacy, baseIcms, aliqIcmsLegacyEff, { key: 'ICMS', note: noteIcms });
    }
    if (valIpiNovo > 0) {
      pushRow(novoRows, 'IPI', baseIpi, aliqIpiNovo, valIpiNovo);
      pushResumo(arrCenario, 'IPI', valIpiNovo, baseIpi, aliqIpiNovo);
    }

    const extraSN = valCbs + valIbs + seletivoTotal + valIpiNovo;
    if (snCompararFora) {
      totalNovo += extraSN;
    } else {
      totalNovo = valCbs + valIbs + seletivoTotal + valIssLegacy + valIcmsLegacy + valIpiNovo + valIrpj + valCsll;
    }

    if (!snCompararFora) {
      const valIrpjTotalNovo2 = (valIrpjBase || 0) + (valIrpjExtra || 0);
      if (valIrpjTotalNovo2 > 0) {
        const aliqIrpjTotal2 = baseIrpj > 0 ? valIrpjTotalNovo2 / baseIrpj : null;
        pushRow(novoRows, 'IRPJ', baseIrpj, aliqIrpjTotal2, valIrpjTotalNovo2);
        pushResumo(arrCenario, 'IRPJ', valIrpjTotalNovo2, baseIrpj, aliqIrpjTotal2, { key: 'IRPJ' });
      }
      if (valCsll > 0) {
        const aliqCsll = baseCsll > 0 ? valCsll / baseCsll : null;
        pushRow(novoRows, 'CSLL', baseCsll, aliqCsll, valCsll);
        pushResumo(arrCenario, 'CSLL', valCsll, baseCsll, aliqCsll, { key: 'CSLL' });
      }
    }
  }

  if (valOutros > 0) {
    totalNovo += valOutros;
    pushRow(novoRows, 'Outros tributos', rc, aliqOutrosRate, valOutros);
    pushResumo(arrCenario, 'Outros tributos', valOutros, rc, aliqOutrosRate, { key: 'Outros tributos' });
  }

  return {
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
    visLabelAtual: regime === 'simples' && !snCompararFora ? 'Simples Nacional' : 'Modelo atual'
  };
};

export const aggregateEntries = (entries: SimulationEntry[]): AggregateResult => {
  const rowsAtual = new Map<string, { nome: string; base: number; valor: number; hasBase: boolean }>();
  const orderRowsAtual: string[] = [];
  const rowsNovo = new Map<string, { nome: string; base: number; valor: number; hasBase: boolean }>();
  const orderRowsNovo: string[] = [];
  const resumoAtual = new Map<string, { nome: string; key: string; value: number; base: number; note: string }>();
  const resumoNovo = new Map<string, { nome: string; key: string; value: number; base: number; note: string }>();
  const orderResumoAtual: string[] = [];
  const orderResumoNovo: string[] = [];

  const mergeRow = (
    map: Map<string, { nome: string; base: number; valor: number; hasBase: boolean }>,
    order: string[],
    row: SimulationRow
  ) => {
    const key = row.nome;
    if (!map.has(key)) {
      map.set(key, { nome: row.nome, base: 0, valor: 0, hasBase: false });
      order.push(key);
    }
    const acc = map.get(key)!;
    acc.valor += row.valor || 0;
    if (row.hasBase) {
      acc.base += row.baseValue || 0;
    }
    acc.hasBase = acc.hasBase || !!row.hasBase;
  };

  const mergeResumo = (
    map: Map<string, { nome: string; key: string; value: number; base: number; note: string }>,
    order: string[],
    item: SimulationSummaryItem
  ) => {
    const key = item.key || item.nome;
    if (!map.has(key)) {
      map.set(key, { nome: item.nome, key, value: 0, base: 0, note: item.note || '' });
      order.push(key);
    }
    const acc = map.get(key)!;
    acc.value += item.value || 0;
    acc.base += item.base || 0;
    if (!acc.note && item.note) {
      acc.note = item.note;
    }
  };

  let totalAtual = 0;
  let totalNovo = 0;
  let baseEfetivaAtual = 0;
  let baseEfetivaNovo = 0;
  const titulosNovos = new Set<string>();
  const rotulosNovos = new Set<string>();
  const rotulosAtuais = new Set<string>();

  entries.forEach((entry) => {
    const res = evaluateEntry(entry);
    titulosNovos.add(res.tituloNovo);
    rotulosNovos.add(res.rotuloNovo);
    rotulosAtuais.add(res.visLabelAtual);
    totalAtual += res.totalAtual;
    totalNovo += res.totalNovo;
    baseEfetivaAtual += res.baseEfetivaAtual;
    baseEfetivaNovo += res.baseEfetivaNovo;
    res.atualRows.forEach((row) => mergeRow(rowsAtual, orderRowsAtual, row));
    res.novoRows.forEach((row) => mergeRow(rowsNovo, orderRowsNovo, row));
    res.arrAtual.forEach((item) => mergeResumo(resumoAtual, orderResumoAtual, item));
    res.arrCenario.forEach((item) => mergeResumo(resumoNovo, orderResumoNovo, item));
  });

  const finalizeRows = (
    map: Map<string, { nome: string; base: number; valor: number; hasBase: boolean }>,
    order: string[]
  ): SimulationRow[] =>
    order.map((key) => {
      const acc = map.get(key)!;
      const baseValue = acc.base || 0;
      const hasBase = !!acc.hasBase;
      const aliq = hasBase && baseValue > 0 ? acc.valor / baseValue : null;
      return { nome: acc.nome, base: hasBase ? baseValue : '—', baseValue, aliq, valor: acc.valor, hasBase };
    });

  const finalizeResumo = (
    map: Map<string, { nome: string; key: string; value: number; base: number; note: string }>,
    order: string[]
  ): SimulationSummaryItem[] =>
    order.map((key) => {
      const acc = map.get(key)!;
      const base = acc.base || 0;
      const aliq = base > 0 ? acc.value / base : null;
      return { nome: acc.nome, key: acc.key, value: acc.value, base, aliq, note: acc.note };
    });

  const atualRows = finalizeRows(rowsAtual, orderRowsAtual);
  const novoRows = finalizeRows(rowsNovo, orderRowsNovo);
  const arrAtual = finalizeResumo(resumoAtual, orderResumoAtual);
  const arrCenario = finalizeResumo(resumoNovo, orderResumoNovo);

  const tituloNovo = entries.length === 1 ? [...titulosNovos][0] : 'Simulação consolidada (CBS/IBS)';
  const rotuloNovo = entries.length === 1 ? [...rotulosNovos][0] : 'Total consolidado';
  const tituloAtual = entries.length === 1 ? [...rotulosAtuais][0] : 'Modelo atual';

  return {
    totalAtual,
    totalNovo,
    arrAtual,
    arrCenario,
    atualRows,
    novoRows,
    baseEfetivaAtual,
    baseEfetivaNovo,
    tituloNovo,
    rotuloNovo,
    tituloAtual
  };
};

export const simulateEntries = (entries: SimulationEntry[]): AggregateResult => aggregateEntries(entries);
