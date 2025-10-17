import { useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { SimulationSummaryItem } from '../lib/calc';
import { useAppStore } from '../state/store';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const chartTheme = (theme: 'light' | 'dark') => ({
  text: theme === 'dark' ? '#ECEFF4' : '#0f172a',
  grid: theme === 'dark' ? '#334155' : '#CBD5F5'
});

export const applyChartTheme = (theme: 'light' | 'dark') => {
  const palette = chartTheme(theme);
  ChartJS.defaults.color = palette.text;
  ChartJS.defaults.borderColor = palette.grid;
  ChartJS.defaults.font = {
    ...(ChartJS.defaults.font || {}),
    family: 'Inter, system-ui, sans-serif',
    size: 12
  };
};

const topN = (items: SimulationSummaryItem[], limit = 4) =>
  items
    .slice()
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, limit);

type MiniChartsProps = {
  className?: string;
  variant?: 'card' | 'plain';
  showTitle?: boolean;
};

export const MiniCharts = ({ className = '', variant = 'card', showTitle = true }: MiniChartsProps) => {
  const resultado = useAppStore((state) => state.resultado);
  const tema = useAppStore((state) => state.tema);

  useEffect(() => {
    applyChartTheme(tema);
  }, [tema]);

  const barData = useMemo(() => {
    const atual = resultado?.totalAtual ?? 0;
    const novo = resultado?.totalNovo ?? 0;
    return {
      labels: ['Modelo atual', 'Cenário CBS/IBS'],
      datasets: [
        {
          label: 'Total',
          data: [atual, novo],
          backgroundColor: ['#2563eb', '#16a34a']
        }
      ]
    };
  }, [resultado]);

  const atualTop = useMemo(() => topN(resultado?.arrAtual ?? []), [resultado]);
  const novoTop = useMemo(() => topN(resultado?.arrCenario ?? []), [resultado]);

  const pieFrom = (items: SimulationSummaryItem[]) => ({
    labels: items.map((item) => item.nome),
    datasets: [
      {
        data: items.map((item) => item.value),
        backgroundColor: ['#4338ca', '#7c3aed', '#f97316', '#14b8a6']
      }
    ]
  });

  const containerClass = [variant === 'card' ? 'card' : '', className].filter(Boolean).join(' ').trim();

  return (
    <div className={containerClass || undefined}>
      {showTitle && <h2>Distribuição visual</h2>}
      <div className="grid two" style={{ marginTop: '1rem' }}>
        <div className="chart-wrapper">
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  ticks: {
                    callback: (value) =>
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
                  }
                }
              }
            }}
          />
        </div>
        <div className="chart-wrapper">
          <Doughnut data={pieFrom(atualTop)} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
        </div>
        <div className="chart-wrapper">
          <Doughnut data={pieFrom(novoTop)} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>
    </div>
  );
};

export default MiniCharts;
