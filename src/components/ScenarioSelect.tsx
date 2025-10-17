import { SCENARIO_CONFIG } from '../lib/scenario';
import { useAppStore } from '../state/store';

export const ScenarioSelect = () => {
  const cenario = useAppStore((state) => state.cenario);
  const setCenario = useAppStore((state) => state.setCenario);
  const regime = useAppStore((state) => state.regime);
  const setRegime = useAppStore((state) => state.setRegime);

  return (
    <div className="grid two">
      <div className="field">
        <label htmlFor="cenario">Cenário</label>
        <select id="cenario" value={cenario} onChange={(event) => setCenario(event.target.value)}>
          {Object.entries(SCENARIO_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.title}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="regime">Regime tributário</label>
        <select id="regime" value={regime} onChange={(event) => setRegime(event.target.value as typeof regime)}>
          <option value="simples">Simples Nacional</option>
          <option value="presumido">Lucro Presumido</option>
          <option value="real">Lucro Real</option>
        </select>
      </div>
    </div>
  );
};

export default ScenarioSelect;
