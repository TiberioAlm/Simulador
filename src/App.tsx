import ScenarioSelect from './components/ScenarioSelect';
import ThemeToggle from './components/ThemeToggle';
import EntryForm from './components/EntryForm';
import AliquotasForm from './components/AliquotasForm';
import DatasetList from './components/DatasetList';
import SimulationReport from './components/SimulationReport';
import MiniCharts from './components/MiniCharts';
import { useAppStore } from './state/store';
import { fmtMon, fmtPct } from './lib/format';

const App = () => {
  const addItem = useAppStore((state) => state.addItem);
  const simulate = useAppStore((state) => state.simulate);
  const reset = useAppStore((state) => state.reset);
  const snapshot = useAppStore((state) => state.snapshot);
  const datasetCount = useAppStore((state) => state.baseDataset.length);
  const regime = useAppStore((state) => state.regime);

  return (
    <div className="app-shell">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Fiscal Flash – Simulador CBS/IBS</h1>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.75 }}>
            Compare a carga tributária do modelo atual com diferentes cenários de CBS/IBS utilizando dados controlados.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <ScenarioSelect />
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="button" className="button" onClick={addItem}>
            Adicionar item à base
          </button>
          <button type="button" className="button secondary" onClick={simulate}>
            Recalcular cenário
          </button>
          <button type="button" className="button secondary" onClick={reset}>
            Limpar simulação
          </button>
        </div>
        {snapshot && (
          <div className="summary-callout">
            <div>
              <strong>Itens cadastrados</strong>
              <div>{datasetCount}</div>
            </div>
            <div>
              <strong>{snapshot.tituloAtual}</strong>
              <div>{fmtMon(snapshot.totalAtual)}</div>
            </div>
            <div>
              <strong>{snapshot.tituloNovo}</strong>
              <div>{fmtMon(snapshot.totalNovo)}</div>
            </div>
            <div>
              <strong>Variação</strong>
              <div>
                {fmtMon(snapshot.totalNovo - snapshot.totalAtual)} •{' '}
                {fmtPct(snapshot.totalAtual > 0 ? ((snapshot.totalNovo - snapshot.totalAtual) / snapshot.totalAtual) * 100 : 0)}
              </div>
            </div>
            <div>
              <strong>Regime predominante</strong>
              <div style={{ textTransform: 'capitalize' }}>{regime}</div>
            </div>
          </div>
        )}
      </section>

      <main style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
        <EntryForm />
        <AliquotasForm />
        <DatasetList />
        <SimulationReport />
        <MiniCharts />
      </main>
    </div>
  );
};

export default App;
