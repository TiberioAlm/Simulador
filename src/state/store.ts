import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { aggregateEntries, SimulationEntry, simulateEntries } from '../lib/calc';
import { DEFAULT_ACTIVITY_ID, OPERATION_ACTIVITIES, SimplesAnexo } from '../lib/scenario';

export type ThemeMode = 'light' | 'dark';

export interface EntradaState {
  receita: number;
  comprasNovo: number;
  comprasAtual: number;
  comprasICMS: number;
  baseSeletivo: number;
  despesasLucroReal: number;
  meses: number;
  tipo: 'servico' | 'mercadoria' | 'none';
  atividade: string;
  consideraCredAtual: boolean;
  consideraCredNovo: boolean;
  consideraCredICMS: boolean;
  incPisCof: boolean;
  incIssIcms: boolean;
  incIpi: boolean;
  incCbsIbs: boolean;
  incSeletivo: boolean;
  incIrpj: boolean;
  incCsll: boolean;
  incOutros: boolean;
  presAliqIrpj: number | null;
  presAliqCsll: number | null;
  presAtividade: string;
  reducoes: SimulationEntry['reducoes'];
  snAnexo?: SimplesAnexo;
  snFatorToggle?: boolean;
  snCompararFora?: boolean;
  snRbt12?: number;
}

export interface AliquotaState {
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
  cpp: number;
  aliqOutros: number;
}

export interface SimulationSnapshot {
  totalAtual: number;
  totalNovo: number;
  tituloNovo: string;
  tituloAtual: string;
  rotuloNovo: string;
}

export interface AppState {
  tema: ThemeMode;
  cenario: string;
  regime: 'simples' | 'presumido' | 'real';
  entrada: EntradaState;
  aliquotas: AliquotaState;
  baseDataset: SimulationEntry[];
  resultado: ReturnType<typeof aggregateEntries> | null;
  snapshot: SimulationSnapshot | null;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setCenario: (cenario: string) => void;
  setRegime: (regime: 'simples' | 'presumido' | 'real') => void;
  updateEntrada: <K extends keyof EntradaState>(key: K, value: EntradaState[K]) => void;
  updateAliquota: <K extends keyof AliquotaState>(key: K, value: AliquotaState[K]) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  simulate: () => void;
  reset: () => void;
}

const defaultAliquotas = (): AliquotaState => ({
  pis: 1.65,
  cofins: 7.6,
  iss: 5,
  icms: 20,
  ipi: 0,
  cbs: 12,
  ibs: 13,
  seletivo: 0,
  irpj: 15,
  csll: 9,
  cpp: 20,
  aliqOutros: 0
});

const defaultEntrada = (): EntradaState => ({
  receita: 0,
  comprasNovo: 0,
  comprasAtual: 0,
  comprasICMS: 0,
  baseSeletivo: 0,
  despesasLucroReal: 0,
  meses: 1,
  tipo: 'servico',
  atividade: DEFAULT_ACTIVITY_ID,
  consideraCredAtual: true,
  consideraCredNovo: true,
  consideraCredICMS: true,
  incPisCof: true,
  incIssIcms: true,
  incIpi: true,
  incCbsIbs: true,
  incSeletivo: true,
  incIrpj: true,
  incCsll: true,
  incOutros: true,
  presAliqIrpj: null,
  presAliqCsll: null,
  presAtividade: OPERATION_ACTIVITIES[DEFAULT_ACTIVITY_ID].presKey || 'servicos',
  reducoes: { ativo: true, pisCof: { opt: '0', custom: 0 }, issIcms: { opt: '0', custom: 0 }, ipi: { opt: '0', custom: 0 }, cbsIbs: { opt: '0', custom: 0 }, seletivo: { opt: '0', custom: 0 }, irpj: { opt: '0', custom: 0 } },
  snAnexo: 'III',
  snFatorToggle: false,
  snCompararFora: false,
  snRbt12: 0
});

const cloneReducoes = (reducoes: SimulationEntry['reducoes']) => {
  if (!reducoes) return undefined;
  return JSON.parse(JSON.stringify(reducoes)) as SimulationEntry['reducoes'];
};

const buildEntry = (state: AppState): SimulationEntry => {
  const actCfg = OPERATION_ACTIVITIES[state.entrada.atividade] || OPERATION_ACTIVITIES.custom;
  const presKey = state.entrada.presAtividade || actCfg.presKey || 'servicos';
  return {
    id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    cenario: state.cenario,
    regime: state.regime,
    tipo: state.entrada.tipo,
    receita: state.entrada.receita,
    comprasNovo: state.entrada.comprasNovo,
    comprasAtual: state.entrada.comprasAtual,
    comprasICMS: state.entrada.comprasICMS,
    baseSeletivo: state.entrada.baseSeletivo,
    despesasLucroReal: state.entrada.despesasLucroReal,
    meses: state.entrada.meses,
    pis: state.aliquotas.pis,
    cofins: state.aliquotas.cofins,
    iss: state.aliquotas.iss,
    icms: state.aliquotas.icms,
    ipi: state.aliquotas.ipi,
    cbs: state.aliquotas.cbs,
    ibs: state.aliquotas.ibs,
    seletivo: state.aliquotas.seletivo,
    irpj: state.aliquotas.irpj,
    csll: state.aliquotas.csll,
    cpp: state.aliquotas.cpp,
    aliqOutros: state.aliquotas.aliqOutros,
    incPisCof: state.entrada.incPisCof,
    incIssIcms: state.entrada.incIssIcms,
    incIpi: state.entrada.incIpi,
    incCbsIbs: state.entrada.incCbsIbs,
    incSeletivo: state.entrada.incSeletivo,
    incIrpj: state.entrada.incIrpj,
    incCsll: state.entrada.incCsll,
    incOutros: state.entrada.incOutros,
    consideraCredAtual: state.entrada.consideraCredAtual,
    consideraCredICMS: state.entrada.consideraCredICMS,
    consideraCredNovo: state.entrada.consideraCredNovo,
    presAliqIrpj: state.entrada.presAliqIrpj,
    presAliqCsll: state.entrada.presAliqCsll,
    presAtividade: presKey,
    reducoes: cloneReducoes(state.entrada.reducoes),
    snAnexo: state.entrada.snAnexo,
    snFatorToggle: state.entrada.snFatorToggle,
    snCompararFora: state.entrada.snCompararFora,
    snRbt12: state.entrada.snRbt12
  };
};

export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
    tema: 'light',
    cenario: 'piloto2026',
    regime: 'real',
    entrada: defaultEntrada(),
    aliquotas: defaultAliquotas(),
    baseDataset: [],
    resultado: null,
    snapshot: null,
    setTheme: (mode) => set((state) => {
      state.tema = mode;
    }),
    toggleTheme: () => set((state) => {
      state.tema = state.tema === 'dark' ? 'light' : 'dark';
    }),
    setCenario: (cenario) => set((state) => {
      state.cenario = cenario;
    }),
    setRegime: (regime) => set((state) => {
      state.regime = regime;
    }),
    updateEntrada: (key, value) => set((state) => {
      (state.entrada[key] as EntradaState[typeof key]) = value;
    }),
    updateAliquota: (key, value) => set((state) => {
      state.aliquotas[key] = value;
    }),
    addItem: () => {
      const currentState = get();
      const entry = buildEntry(currentState);
      set((state) => {
        state.baseDataset.push(entry);
      });
      get().simulate();
    },
    removeItem: (id) => {
      set((state) => {
        state.baseDataset = state.baseDataset.filter((item) => item.id !== id);
      });
      get().simulate();
    },
    simulate: () => {
      const { baseDataset } = get();
      if (!baseDataset.length) {
        set((state) => {
          state.resultado = null;
          state.snapshot = null;
        });
        return;
      }
      const resultado = simulateEntries(baseDataset);
      set((state) => {
        state.resultado = resultado;
        state.snapshot = {
          totalAtual: resultado.totalAtual,
          totalNovo: resultado.totalNovo,
          tituloAtual: resultado.tituloAtual,
          tituloNovo: resultado.tituloNovo,
          rotuloNovo: resultado.rotuloNovo
        };
      });
    },
    reset: () => {
      set((state) => {
        state.cenario = 'piloto2026';
        state.regime = 'real';
        state.entrada = defaultEntrada();
        state.aliquotas = defaultAliquotas();
        state.baseDataset = [];
        state.resultado = null;
        state.snapshot = null;
      });
    }
  })),
    {
      name: 'fiscalflash:last',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tema: s.tema,
        cenario: s.cenario,
        regime: s.regime,
        entrada: s.entrada,
        aliquotas: s.aliquotas,
        baseDataset: s.baseDataset,
        snapshot: s.snapshot
      })
    }
  )
);
