export interface ScenarioConfig {
  title: string;
  total: string;
  legacyShare: number;
  ibsShare: number;
  auto?: {
    cbs?: number;
    ibs?: number;
    seletivo?: number;
  };
}

export const SCENARIO_CONFIG: Record<string, ScenarioConfig> = {
  piloto2026: {
    title: 'Piloto 2026 — IBS teste de 1% (compensado)',
    total: 'Total (Piloto 2026)',
    legacyShare: 1,
    ibsShare: 0,
    auto: { cbs: 0.9, ibs: 0.1, seletivo: 0 }
  },
  cbs2027: {
    title: 'CBS + tributos legados (2027–2028)',
    total: 'Total (2027–2028)',
    legacyShare: 1,
    ibsShare: 0,
    auto: { cbs: 8.7, ibs: 0.1, seletivo: 0 }
  },
  ibs2029: {
    title: 'Transição do IBS (2029 — 10%)',
    total: 'Total (2029)',
    legacyShare: 0.9,
    ibsShare: 0.1,
    auto: { cbs: 8.8, ibs: 1.77 }
  },
  ibs2030: {
    title: 'Transição do IBS (2030 — 20%)',
    total: 'Total (2030)',
    legacyShare: 0.8,
    ibsShare: 0.2,
    auto: { cbs: 8.8, ibs: 3.54 }
  },
  ibs2031: {
    title: 'Transição do IBS (2031 — 30%)',
    total: 'Total (2031)',
    legacyShare: 0.7,
    ibsShare: 0.3,
    auto: { cbs: 8.8, ibs: 5.31 }
  },
  ibs2032: {
    title: 'Transição do IBS (2032 — 40%)',
    total: 'Total (2032)',
    legacyShare: 0.6,
    ibsShare: 0.4,
    auto: { cbs: 8.8, ibs: 7.08 }
  },
  regime2033: {
    title: 'Regime definitivo (2033+ — CBS/IBS)',
    total: 'Total (2033+)',
    legacyShare: 0,
    ibsShare: 1,
    auto: { cbs: 8.8, ibs: 17.7 }
  }
};

export const DEFAULT_ACTIVITY_ID = 'servicos_gerais';

export interface OperationActivity {
  id: string;
  label: string;
  tipoOper: 'servico' | 'mercadoria' | 'none' | null;
  presKey?: keyof typeof PRES_ATIVIDADES;
  presAliqIrpj?: number;
  presAliqCsll?: number;
  aliqOutros?: number;
}

export const OPERATION_ACTIVITIES: Record<string, OperationActivity> = {
  servicos_gerais: {
    id: 'servicos_gerais',
    label: 'Serviços',
    tipoOper: 'servico',
    presKey: 'servicos',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  servicos_profissionais: {
    id: 'servicos_profissionais',
    label: 'Profissionais',
    tipoOper: 'servico',
    presKey: 'servicos',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  saude: {
    id: 'saude',
    label: 'Saúde',
    tipoOper: 'servico',
    presKey: 'hospitalar',
    presAliqIrpj: 8,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  ti_software: {
    id: 'ti_software',
    label: 'TI / Software',
    tipoOper: 'servico',
    presKey: 'servicos',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  educacao: {
    id: 'educacao',
    label: 'Educação',
    tipoOper: 'servico',
    presKey: 'servicos',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  transporte_cargas: {
    id: 'transporte_cargas',
    label: 'Transp. cargas',
    tipoOper: 'servico',
    presKey: 'transportes',
    presAliqIrpj: 8,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  transporte_passageiros: {
    id: 'transporte_passageiros',
    label: 'Transp. passageiros',
    tipoOper: 'servico',
    presKey: 'passageiros',
    presAliqIrpj: 16,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  alimentacao_bares_rest: {
    id: 'alimentacao_bares_rest',
    label: 'Alimentação',
    tipoOper: 'servico',
    presKey: 'servicos',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  construcao_empreitada: {
    id: 'construcao_empreitada',
    label: 'Construção',
    tipoOper: 'servico',
    presKey: 'servicos',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  locacao_imobiliaria: {
    id: 'locacao_imobiliaria',
    label: 'Locação imob.',
    tipoOper: 'none',
    presKey: 'locacao',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  locacao_moveis: {
    id: 'locacao_moveis',
    label: 'Locação bens',
    tipoOper: 'servico',
    presKey: 'servicos',
    presAliqIrpj: 32,
    presAliqCsll: 32,
    aliqOutros: 0
  },
  comercio_varejo: {
    id: 'comercio_varejo',
    label: 'Varejo',
    tipoOper: 'mercadoria',
    presKey: 'comercio',
    presAliqIrpj: 8,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  comercio_atacado: {
    id: 'comercio_atacado',
    label: 'Atacado',
    tipoOper: 'mercadoria',
    presKey: 'comercio',
    presAliqIrpj: 8,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  comercio_online: {
    id: 'comercio_online',
    label: 'E‑commerce',
    tipoOper: 'mercadoria',
    presKey: 'comercio',
    presAliqIrpj: 8,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  industria_fabricacao: {
    id: 'industria_fabricacao',
    label: 'Indústria',
    tipoOper: 'mercadoria',
    presKey: 'comercio',
    presAliqIrpj: 8,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  combustiveis_revenda: {
    id: 'combustiveis_revenda',
    label: 'Combustíveis',
    tipoOper: 'mercadoria',
    presKey: 'combustiveis',
    presAliqIrpj: 1.6,
    presAliqCsll: 12,
    aliqOutros: 0
  },
  construcao_ret: {
    id: 'construcao_ret',
    label: 'Construção – RET',
    tipoOper: 'servico',
    presKey: 'retpa',
    presAliqIrpj: 4,
    presAliqCsll: 4,
    aliqOutros: 4
  },
  custom: {
    id: 'custom',
    label: 'Personalizado',
    tipoOper: null
  }
};

export interface PresAtividadeConfig {
  irpj: number;
  csll: number;
  ref: string;
}

export const PRES_ATIVIDADES: Record<string, PresAtividadeConfig> = {
  comercio: { irpj: 0.08, csll: 0.12, ref: 'Lei 9.249/1995, art. 15, III “a” e Lei 7.689/1988, art. 20.' },
  transportes: { irpj: 0.08, csll: 0.12, ref: 'Lei 9.249/1995, art. 15, III “a”.' },
  passageiros: { irpj: 0.16, csll: 0.12, ref: 'Lei 9.249/1995, art. 15, §1º III.' },
  hospitalar: { irpj: 0.08, csll: 0.12, ref: 'Lei 9.249/1995, art. 15, §1º III “a”.' },
  combustiveis: { irpj: 0.016, csll: 0.12, ref: 'Lei 9.718/1998, art. 15.' },
  retpa: { irpj: 0.04, csll: 0.04, ref: 'Regime especial da construção civil – Lei 10.931/2004 (RET).' },
  locacao: { irpj: 0.32, csll: 0.32, ref: 'Locação de bens imóveis – Lei 9.249/1995, art. 15, §1º III “c”.' },
  servicos: { irpj: 0.32, csll: 0.32, ref: 'Lei 9.249/1995, art. 15, §1º III “c”.' }
};

export const IRPJ_EXTRA_THRESHOLD = 20000;

export type SimplesAnexo = 'I' | 'II' | 'III' | 'IV' | 'V';

export const SN_LIMITS = [180_000, 360_000, 720_000, 1_800_000, 3_600_000, 4_800_000];

export const SN: Record<SimplesAnexo, Array<[number, number]>> = {
  I: [
    [0.04, 0],
    [0.073, 5940],
    [0.095, 13860],
    [0.107, 22500],
    [0.143, 87300],
    [0.19, 378000]
  ],
  II: [
    [0.045, 0],
    [0.078, 5940],
    [0.1, 13860],
    [0.112, 22500],
    [0.147, 85500],
    [0.3, 720000]
  ],
  III: [
    [0.06, 0],
    [0.112, 9360],
    [0.135, 17640],
    [0.16, 35640],
    [0.21, 125640],
    [0.33, 648000]
  ],
  IV: [
    [0.045, 0],
    [0.09, 8100],
    [0.102, 12420],
    [0.14, 39780],
    [0.22, 183780],
    [0.33, 828000]
  ],
  V: [
    [0.155, 0],
    [0.18, 4500],
    [0.195, 9900],
    [0.205, 17100],
    [0.23, 62100],
    [0.305, 540000]
  ]
};

export const SN_SPLIT_FAIXA: Partial<Record<SimplesAnexo, Array<Record<string, number>>>> = {
  I: [
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.305 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.305 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.305 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.305 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.305 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.305 }
  ],
  II: [
    { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.3 },
    { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.3 },
    { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.3 },
    { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.3 },
    { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.3 },
    { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.3 }
  ],
  III: [
    { IRPJ: 0.0402, CSLL: 0.0351, COFINS: 0.1284, PIS: 0.0277, CPP: 0.434, ISS: 0.3346 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.133, PIS: 0.0289, CPP: 0.42, ISS: 0.3431 },
    { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.155, PIS: 0.035, CPP: 0.42, ISS: 0.31 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.1365, PIS: 0.0296, CPP: 0.434, ISS: 0.325 },
    { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.133, PIS: 0.029, CPP: 0.434, ISS: 0.329 },
    { IRPJ: 0.05, CSLL: 0.035, COFINS: 0.1173, PIS: 0.0275, CPP: 0.434, ISS: 0.3362 }
  ],
  IV: [
    { IRPJ: 0.07951, CSLL: 0.06184, COFINS: 0.21201, PIS: 0.0477, ISS: 0.59894 },
    { IRPJ: 0.07951, CSLL: 0.06184, COFINS: 0.21201, PIS: 0.0477, ISS: 0.59894 },
    { IRPJ: 0.07951, CSLL: 0.06184, COFINS: 0.21201, PIS: 0.0477, ISS: 0.59894 },
    { IRPJ: 0.07951, CSLL: 0.06184, COFINS: 0.21201, PIS: 0.0477, ISS: 0.59894 },
    { IRPJ: 0.07951, CSLL: 0.06184, COFINS: 0.21201, PIS: 0.0477, ISS: 0.59894 },
    { IRPJ: 0.07951, CSLL: 0.06184, COFINS: 0.21201, PIS: 0.0477, ISS: 0.59894 }
  ],
  V: [
    { IRPJ: 0.128, CSLL: 0.128, COFINS: 0.142, PIS: 0.034, CPP: 0.278, ISS: 0.29 },
    { IRPJ: 0.128, CSLL: 0.128, COFINS: 0.142, PIS: 0.034, CPP: 0.278, ISS: 0.29 },
    { IRPJ: 0.128, CSLL: 0.128, COFINS: 0.142, PIS: 0.034, CPP: 0.278, ISS: 0.29 },
    { IRPJ: 0.128, CSLL: 0.128, COFINS: 0.142, PIS: 0.034, CPP: 0.278, ISS: 0.29 },
    { IRPJ: 0.128, CSLL: 0.128, COFINS: 0.142, PIS: 0.034, CPP: 0.278, ISS: 0.29 },
    { IRPJ: 0.128, CSLL: 0.128, COFINS: 0.142, PIS: 0.034, CPP: 0.278, ISS: 0.29 }
  ]
};

export const SN_SPLIT: Record<SimplesAnexo | 'default', Record<string, number>> = {
  I: { IRPJ: 0.04, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.305 },
  II: { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.165, PIS: 0.035, CPP: 0.42, ICMS: 0.3 },
  III: { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.155, PIS: 0.035, CPP: 0.42, ISS: 0.31 },
  IV: { IRPJ: 0.07951, CSLL: 0.06184, COFINS: 0.21201, PIS: 0.0477, ISS: 0.59894 },
  V: { IRPJ: 0.128, CSLL: 0.128, COFINS: 0.142, PIS: 0.034, CPP: 0.278, ISS: 0.29 },
  default: { IRPJ: 0.045, CSLL: 0.035, COFINS: 0.155, PIS: 0.035, CPP: 0.42, ISS: 0.31 }
};
