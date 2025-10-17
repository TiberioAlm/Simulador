import { fmtMon, fmtPct } from '../lib/format';
import { SCENARIO_CONFIG } from '../lib/scenario';
import { useAppStore } from '../state/store';

const regimeLabel = (regime: string) => {
  if (regime === 'simples') return 'Simples Nacional';
  if (regime === 'presumido') return 'Lucro Presumido';
  if (regime === 'real') return 'Lucro Real';
  return regime;
};

const tipoLabel = (tipo: string) => {
  if (tipo === 'servico') return 'Serviço (ISS)';
  if (tipo === 'mercadoria') return 'Mercadoria (ICMS)';
  if (tipo === 'none') return 'Sem incidência';
  return tipo;
};

export const DatasetList = () => {
  const dataset = useAppStore((state) => state.baseDataset);
  const removeItem = useAppStore((state) => state.removeItem);

  if (!dataset.length) {
    return (
      <div className="card">
        <h2>Itens simulados</h2>
        <p style={{ marginTop: '1rem', color: 'var(--muted, #475569)' }}>
          Nenhum item na base de comparação ainda. Adicione um item para iniciar a simulação.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Itens simulados</h2>
      <div className="dataset-list" style={{ marginTop: '1rem' }}>
        {dataset.map((item) => {
          const scenario = SCENARIO_CONFIG[item.cenario];
          return (
            <article className="dataset-card" key={item.id}>
              <header>
                <div>
                  <strong>{scenario?.title ?? item.cenario}</strong>
                  <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                    {regimeLabel(item.regime)} • {tipoLabel(item.tipo)}
                  </div>
                </div>
                <button type="button" className="button secondary" onClick={() => removeItem(item.id!)}>
                  Remover
                </button>
              </header>
              <div className="chip-list" style={{ marginBottom: '0.75rem' }}>
                <span className="chip">Receita: {fmtMon(item.receita)}</span>
                <span className="chip">Compras CBS/IBS: {fmtMon(item.comprasNovo)}</span>
                <span className="chip">Compras PIS/COFINS: {fmtMon(item.comprasAtual)}</span>
                <span className="chip">Compras ICMS: {fmtMon(item.comprasICMS)}</span>
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', margin: 0 }}>
                <div>
                  <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>Meses</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{item.meses}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>IRPJ</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{fmtPct(item.irpj)}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>CSLL</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{fmtPct(item.csll)}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>CBS</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{fmtPct(item.cbs)}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>IBS</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{fmtPct(item.ibs)}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default DatasetList;
