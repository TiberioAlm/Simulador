import { describe, expect, it } from 'vitest';
import { evaluateEntry } from '../calc';

const baseEntry = {
  cenario: 'regime2033',
  regime: 'real' as const,
  tipo: 'servico' as const,
  receita: 100_000,
  comprasNovo: 20_000,
  comprasAtual: 15_000,
  comprasICMS: 10_000,
  baseSeletivo: 5_000,
  despesasLucroReal: 40_000,
  meses: 1,
  pis: 1.65,
  cofins: 7.6,
  iss: 5,
  icms: 18,
  ipi: 4,
  cbs: 12,
  ibs: 13,
  seletivo: 2,
  irpj: 15,
  csll: 9,
  cpp: 20,
  aliqOutros: 1,
  incPisCof: true,
  incIssIcms: true,
  incIpi: true,
  incCbsIbs: true,
  incSeletivo: true,
  incIrpj: true,
  incCsll: true,
  incOutros: true,
  consideraCredAtual: true,
  consideraCredNovo: true,
  consideraCredICMS: true,
  presAliqIrpj: null,
  presAliqCsll: null,
  presAtividade: 'servicos',
  reducoes: {
    ativo: true,
    pisCof: { opt: '0', custom: 0 },
    issIcms: { opt: '0', custom: 0 },
    ipi: { opt: '0', custom: 0 },
    cbsIbs: { opt: '0', custom: 0 },
    seletivo: { opt: '0', custom: 0 },
    irpj: { opt: '0', custom: 0 }
  },
  snAnexo: 'III',
  snFatorToggle: false,
  snCompararFora: false,
  snRbt12: 0
};

describe('evaluateEntry', () => {
  it('computes totals for a representative configuration', () => {
    const result = evaluateEntry(baseEntry);
    expect(result.totalAtual).toBeCloseTo(36_262.5, 2);
    expect(result.totalNovo).toBeCloseTo(43_500, 2);
    const cbsRow = result.novoRows.find((row) => row.nome === 'CBS');
    expect(cbsRow?.valor).toBeCloseTo(9_600, 2);
  });
});
