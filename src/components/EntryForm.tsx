import { ChangeEvent } from 'react';
import { fmtMon } from '../lib/format';
import { OPERATION_ACTIVITIES } from '../lib/scenario';
import { useAppStore } from '../state/store';

const numberValue = (value: number) => Number.isFinite(value) ? value : 0;

const anexoOptions = [
  { value: 'I', label: 'Anexo I (Comércio)' },
  { value: 'II', label: 'Anexo II (Indústria)' },
  { value: 'III', label: 'Anexo III (Serviços)' },
  { value: 'IV', label: 'Anexo IV (Serviços c/ CPP fora)' },
  { value: 'V', label: 'Anexo V (Serviços — Fator R)' }
];

export const EntryForm = () => {
  const entrada = useAppStore((state) => state.entrada);
  const updateEntrada = useAppStore((state) => state.updateEntrada);

  const handleNumber = (key: keyof typeof entrada) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === '') {
      updateEntrada(key, 0 as never);
      return;
    }
    const parsed = Number(raw);
    updateEntrada(key, (Number.isFinite(parsed) ? parsed : 0) as never);
  };

  const handleOptionalNumber = (key: keyof typeof entrada) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.trim();
    if (raw === '') {
      updateEntrada(key, null as never);
      return;
    }
    const parsed = Number(raw);
    updateEntrada(key, (Number.isFinite(parsed) ? parsed : null) as never);
  };

  const handleCheckbox = (key: keyof typeof entrada) => (event: ChangeEvent<HTMLInputElement>) => {
    updateEntrada(key, event.target.checked as never);
  };

  const handleSelect = (key: keyof typeof entrada) => (event: ChangeEvent<HTMLSelectElement>) => {
    updateEntrada(key, event.target.value as never);
  };

  const handleAtividade = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    const cfg = OPERATION_ACTIVITIES[next] || OPERATION_ACTIVITIES.custom;
    updateEntrada('atividade', next);
    if (cfg.tipoOper) {
      updateEntrada('tipo', cfg.tipoOper);
    }
    if (cfg.presKey) {
      updateEntrada('presAtividade', cfg.presKey);
    }
    if (cfg.presAliqIrpj !== undefined) {
      updateEntrada('presAliqIrpj', cfg.presAliqIrpj);
    }
    if (cfg.presAliqCsll !== undefined) {
      updateEntrada('presAliqCsll', cfg.presAliqCsll);
    }
    if (cfg.aliqOutros !== undefined) {
      // optional adjustments handled at aliquotas level
    }
  };

  return (
    <div className="card">
      <h2>Dados da operação</h2>
      <div className="grid two" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label htmlFor="tipo">Tipo de operação</label>
          <select id="tipo" value={entrada.tipo} onChange={handleSelect('tipo')}>
            <option value="servico">Serviço (ISS)</option>
            <option value="mercadoria">Mercadoria (ICMS)</option>
            <option value="none">Sem incidência</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="atividade">Segmento</label>
          <select id="atividade" value={entrada.atividade} onChange={handleAtividade}>
            {Object.values(OPERATION_ACTIVITIES).map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="receita">Receita (período)</label>
          <input id="receita" type="number" min={0} value={numberValue(entrada.receita)} onChange={handleNumber('receita')} />
        </div>
        <div className="field">
          <label htmlFor="comprasNovo">Compras – CBS/IBS</label>
          <input id="comprasNovo" type="number" min={0} value={numberValue(entrada.comprasNovo)} onChange={handleNumber('comprasNovo')} />
        </div>
        <div className="field">
          <label htmlFor="comprasAtual">Compras – PIS/COFINS</label>
          <input id="comprasAtual" type="number" min={0} value={numberValue(entrada.comprasAtual)} onChange={handleNumber('comprasAtual')} />
        </div>
        <div className="field">
          <label htmlFor="comprasICMS">Compras – ICMS</label>
          <input id="comprasICMS" type="number" min={0} value={numberValue(entrada.comprasICMS)} onChange={handleNumber('comprasICMS')} />
        </div>
        <div className="field">
          <label htmlFor="baseSeletivo">Base Imposto Seletivo</label>
          <input id="baseSeletivo" type="number" min={0} value={numberValue(entrada.baseSeletivo)} onChange={handleNumber('baseSeletivo')} />
        </div>
        <div className="field">
          <label htmlFor="despesas">Despesas (Lucro Real)</label>
          <input id="despesas" type="number" min={0} value={numberValue(entrada.despesasLucroReal)} onChange={handleNumber('despesasLucroReal')} />
        </div>
        <div className="field">
          <label htmlFor="meses">Meses acumulados</label>
          <input id="meses" type="number" min={1} value={numberValue(entrada.meses)} onChange={handleNumber('meses')} />
        </div>
        <div className="field">
          <label htmlFor="snRbt12">RBT12 (Simples)</label>
          <input id="snRbt12" type="number" min={0} value={numberValue(entrada.snRbt12 ?? 0)} onChange={handleNumber('snRbt12')} />
        </div>
        <div className="field">
          <label htmlFor="snAnexo">Anexo Simples</label>
          <select id="snAnexo" value={entrada.snAnexo} onChange={handleSelect('snAnexo')}>
            {anexoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="presAliqIrpj">Pres. IRPJ (%)</label>
          <input id="presAliqIrpj" type="number" step="0.01" value={entrada.presAliqIrpj ?? ''} onChange={handleOptionalNumber('presAliqIrpj')} />
        </div>
        <div className="field">
          <label htmlFor="presAliqCsll">Pres. CSLL (%)</label>
          <input id="presAliqCsll" type="number" step="0.01" value={entrada.presAliqCsll ?? ''} onChange={handleOptionalNumber('presAliqCsll')} />
        </div>
      </div>

      <div className="grid two" style={{ marginTop: '1.5rem' }}>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.consideraCredAtual} onChange={handleCheckbox('consideraCredAtual')} /> Créditos PIS/COFINS
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.consideraCredNovo} onChange={handleCheckbox('consideraCredNovo')} /> Créditos CBS/IBS
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.consideraCredICMS} onChange={handleCheckbox('consideraCredICMS')} /> Créditos ICMS
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.snFatorToggle} onChange={handleCheckbox('snFatorToggle')} /> Aplicar Fator R
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.snCompararFora} onChange={handleCheckbox('snCompararFora')} /> Comparar Simples fora do CBS/IBS
          </label>
        </div>
      </div>

      <div className="grid two" style={{ marginTop: '1.5rem' }}>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.incPisCof} onChange={handleCheckbox('incPisCof')} /> Incluir PIS/COFINS
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.incIssIcms} onChange={handleCheckbox('incIssIcms')} /> Incluir ISS/ICMS
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.incCbsIbs} onChange={handleCheckbox('incCbsIbs')} /> Incluir CBS/IBS
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.incSeletivo} onChange={handleCheckbox('incSeletivo')} /> Incluir Imposto Seletivo
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.incIrpj} onChange={handleCheckbox('incIrpj')} /> Incluir IRPJ
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.incCsll} onChange={handleCheckbox('incCsll')} /> Incluir CSLL
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={entrada.incOutros} onChange={handleCheckbox('incOutros')} /> Incluir outros tributos
          </label>
        </div>
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--muted, #475569)' }}>
        Totais atuais: <strong>{fmtMon(entrada.receita)}</strong> de receita com {entrada.meses} mês(es) acumulados.
      </p>
    </div>
  );
};

export default EntryForm;
