import { fmtAliq, fmtBase, fmtMon, fmtPct } from '../lib/format';
import { useAppStore } from '../state/store';

export const SimulationReport = () => {
  const resultado = useAppStore((state) => state.resultado);

  if (!resultado) {
    return (
      <div className="card">
        <h2>Resumo comparativo</h2>
        <p style={{ marginTop: '1rem', color: 'var(--muted, #475569)' }}>
          Execute a simulação para visualizar o comparativo entre o modelo atual e o cenário CBS/IBS.
        </p>
      </div>
    );
  }

  const diff = resultado.totalNovo - resultado.totalAtual;
  const diffPct = resultado.totalAtual > 0 ? (diff / resultado.totalAtual) * 100 : 0;

  return (
    <div className="card">
      <h2>Resumo comparativo</h2>
      <div className="summary-callout" style={{ marginTop: '1rem' }}>
        <div>
          <strong>{resultado.tituloAtual}</strong>
          <div>{fmtMon(resultado.totalAtual)}</div>
        </div>
        <div>
          <strong>{resultado.tituloNovo}</strong>
          <div>{fmtMon(resultado.totalNovo)}</div>
        </div>
        <div>
          <strong>Diferença absoluta</strong>
          <div>{fmtMon(diff)}</div>
        </div>
        <div>
          <strong>Variação percentual</strong>
          <div>{fmtPct(diffPct)}</div>
        </div>
      </div>

      <div className="report-grid" style={{ marginTop: '1.5rem' }}>
        <section className="report-panel">
          <h3 style={{ marginTop: 0 }}>{resultado.tituloAtual}</h3>
          <table className="table-like">
            <thead>
              <tr>
                <th>Tributo</th>
                <th>Base</th>
                <th>Alíquota</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {resultado.atualRows.length ? (
                resultado.atualRows.map((row) => (
                  <tr key={row.nome}>
                    <td>{row.nome}</td>
                    <td>{row.hasBase ? fmtBase(row.baseValue) : '—'}</td>
                    <td>{row.aliq != null ? fmtAliq(row.aliq) : '—'}</td>
                    <td>{fmtMon(row.valor)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', opacity: 0.6 }}>
                    Nenhum tributo calculado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        <section className="report-panel">
          <h3 style={{ marginTop: 0 }}>{resultado.tituloNovo}</h3>
          <table className="table-like">
            <thead>
              <tr>
                <th>Tributo</th>
                <th>Base</th>
                <th>Alíquota</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {resultado.novoRows.length ? (
                resultado.novoRows.map((row) => (
                  <tr key={row.nome}>
                    <td>{row.nome}</td>
                    <td>{row.hasBase ? fmtBase(row.baseValue) : '—'}</td>
                    <td>{row.aliq != null ? fmtAliq(row.aliq) : '—'}</td>
                    <td>{fmtMon(row.valor)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', opacity: 0.6 }}>
                    Nenhum tributo calculado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default SimulationReport;
