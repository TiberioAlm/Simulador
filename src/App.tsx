import { useState } from 'react';
import ScenarioSelect from './components/ScenarioSelect';
import ThemeToggle from './components/ThemeToggle';
import EntryForm from './components/EntryForm';
import AliquotasForm from './components/AliquotasForm';
import DatasetList from './components/DatasetList';
import SimulationReport from './components/SimulationReport';
import MiniCharts from './components/MiniCharts';
import { useAppStore } from './state/store';
import { fmtMon, fmtPct } from './lib/format';
import {
  AddIcon,
  AppLogoIcon,
  ClipboardIcon,
  DatasetIcon,
  PercentIcon,
  RefreshIcon,
  ReportIcon,
  ResetIcon,
  ScenarioIcon,
  SparklineIcon
} from './components/icons';

const controlTabs = [
  { id: 'entrada', label: 'Operação', helper: 'Dados da receita e compras', icon: ClipboardIcon },
  { id: 'aliquotas', label: 'Alíquotas', helper: 'Percentuais por tributo', icon: PercentIcon }
] as const;

type ControlTab = (typeof controlTabs)[number]['id'];

const insightTabs = [
  { id: 'dataset', label: 'Base cadastrada', icon: DatasetIcon },
  { id: 'charts', label: 'Mini gráficos', icon: SparklineIcon }
] as const;

type InsightTab = (typeof insightTabs)[number]['id'];

const regimeLabel = (regime: string) => {
  if (regime === 'simples') return 'Simples Nacional';
  if (regime === 'presumido') return 'Lucro Presumido';
  if (regime === 'real') return 'Lucro Real';
  return regime;
};

const App = () => {
  const [activeControlTab, setActiveControlTab] = useState<ControlTab>('entrada');
  const [activeInsightTab, setActiveInsightTab] = useState<InsightTab>('dataset');

  const addItem = useAppStore((state) => state.addItem);
  const simulate = useAppStore((state) => state.simulate);
  const reset = useAppStore((state) => state.reset);
  const snapshot = useAppStore((state) => state.snapshot);
  const datasetCount = useAppStore((state) => state.baseDataset.length);
  const regime = useAppStore((state) => state.regime);

  const variationAbsolute = snapshot ? snapshot.totalNovo - snapshot.totalAtual : 0;
  const variationPercent = snapshot && snapshot.totalAtual > 0
    ? ((snapshot.totalNovo - snapshot.totalAtual) / snapshot.totalAtual) * 100
    : 0;

  return (
    <div className="app-shell">
      <section className="hero-card card">
        <div className="hero-header">
          <div className="hero-brand">
            <span className="hero-logo" aria-hidden="true">
              <AppLogoIcon width={48} height={48} />
            </span>
            <div>
              <p className="hero-eyebrow">Simulador CBS/IBS</p>
              <h1>Fiscal Flash</h1>
              <p className="hero-subtitle">
                Compare a carga tributária do modelo atual com cenários alternativos de CBS/IBS e acompanhe o impacto em tempo real.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="hero-config">
          <div className="card-heading">
            <ScenarioIcon className="card-heading-icon" width={24} height={24} aria-hidden="true" />
            <div>
              <h2>Configuração do cenário</h2>
              <p>Escolha a referência fiscal e o regime predominante.</p>
            </div>
          </div>
          <ScenarioSelect />
        </div>
      </section>

      <section className="quick-actions card">
        <div className="card-heading">
          <DatasetIcon className="card-heading-icon" width={22} height={22} aria-hidden="true" />
          <div>
            <h2>Fluxo de simulação</h2>
            <p>Ajuste os dados e atualize o cenário sempre que precisar.</p>
          </div>
        </div>
        <div className="quick-buttons">
          <button type="button" className="button has-icon" onClick={addItem}>
            <AddIcon aria-hidden="true" width={18} height={18} />
            <span>Adicionar item à base</span>
          </button>
          <button type="button" className="button secondary has-icon" onClick={simulate}>
            <RefreshIcon aria-hidden="true" width={18} height={18} />
            <span>Recalcular cenário</span>
          </button>
          <button type="button" className="button secondary has-icon" onClick={reset}>
            <ResetIcon aria-hidden="true" width={18} height={18} />
            <span>Limpar simulação</span>
          </button>
        </div>
      </section>

      <section className="stats-card card">
        <div className="card-heading">
          <ReportIcon className="card-heading-icon" width={22} height={22} aria-hidden="true" />
          <div>
            <h2>Painel de acompanhamento</h2>
            <p>Resumo rápido das métricas da sua simulação.</p>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Itens cadastrados</span>
            <span className="stat-value">{datasetCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{snapshot?.tituloAtual ?? 'Modelo atual'}</span>
            <span className="stat-value">{fmtMon(snapshot?.totalAtual ?? 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{snapshot?.tituloNovo ?? 'Cenário CBS/IBS'}</span>
            <span className="stat-value">{fmtMon(snapshot?.totalNovo ?? 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Variação agregada</span>
            <span className="stat-value">
              {fmtMon(variationAbsolute)} • {fmtPct(variationPercent)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Regime predominante</span>
            <span className="stat-value regime">{regimeLabel(regime)}</span>
          </div>
        </div>
        {!snapshot && (
          <p className="stat-hint">
            Cadastre uma operação, informe as alíquotas e utilize as ações acima para gerar o comparativo completo.
          </p>
        )}
      </section>

      <div className="app-content">
        <div className="column main">
          <section className="card tab-card">
            <header className="card-heading">
              <ClipboardIcon className="card-heading-icon" width={22} height={22} aria-hidden="true" />
              <div>
                <h2>Cadastro da operação</h2>
                <p>Organize os dados de entrada ou ajuste as alíquotas aplicáveis.</p>
              </div>
            </header>
            <div className="tab-controls" role="tablist" aria-label="Seções de cadastro">
              {controlTabs.map(({ id, label, helper, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeControlTab === id}
                  aria-controls={`control-panel-${id}`}
                  id={`control-tab-${id}`}
                  className={`tab-button${activeControlTab === id ? ' active' : ''}`}
                  onClick={() => setActiveControlTab(id)}
                >
                  <Icon aria-hidden="true" width={18} height={18} />
                  <span>
                    {label}
                    <small>{helper}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="tab-panels">
              <div
                id="control-panel-entrada"
                role="tabpanel"
                aria-labelledby="control-tab-entrada"
                hidden={activeControlTab !== 'entrada'}
                className="tab-panel"
              >
                <EntryForm variant="plain" showTitle={false} className="form-section" />
              </div>
              <div
                id="control-panel-aliquotas"
                role="tabpanel"
                aria-labelledby="control-tab-aliquotas"
                hidden={activeControlTab !== 'aliquotas'}
                className="tab-panel"
              >
                <AliquotasForm variant="plain" showTitle={false} className="form-section" />
              </div>
            </div>
          </section>
        </div>
        <div className="column aside">
          <section className="card report-card">
            <header className="card-heading">
              <ReportIcon className="card-heading-icon" width={22} height={22} aria-hidden="true" />
              <div>
                <h2>Resumo comparativo</h2>
                <p>Visualize o impacto consolidado do cenário escolhido.</p>
              </div>
            </header>
            <SimulationReport variant="plain" showTitle={false} className="report-section" />
          </section>

          <section className="card tab-card">
            <header className="card-heading">
              <DatasetIcon className="card-heading-icon" width={22} height={22} aria-hidden="true" />
              <div>
                <h2>Detalhes da base</h2>
                <p>Explore os itens cadastrados ou veja os principais gráficos.</p>
              </div>
            </header>
            <div className="tab-controls" role="tablist" aria-label="Dados cadastrados">
              {insightTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeInsightTab === id}
                  aria-controls={`insight-panel-${id}`}
                  id={`insight-tab-${id}`}
                  className={`tab-button${activeInsightTab === id ? ' active' : ''}`}
                  onClick={() => setActiveInsightTab(id)}
                >
                  <Icon aria-hidden="true" width={18} height={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="tab-panels">
              <div
                id="insight-panel-dataset"
                role="tabpanel"
                aria-labelledby="insight-tab-dataset"
                hidden={activeInsightTab !== 'dataset'}
                className="tab-panel"
              >
                <DatasetList
                  variant="plain"
                  showTitle={false}
                  className="list-section"
                  emptyHint="Nenhum item cadastrado por enquanto. Utilize os formulários à esquerda para adicionar uma operação."
                />
              </div>
              <div
                id="insight-panel-charts"
                role="tabpanel"
                aria-labelledby="insight-tab-charts"
                hidden={activeInsightTab !== 'charts'}
                className="tab-panel"
              >
                <MiniCharts variant="plain" showTitle={false} className="charts-section" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;
