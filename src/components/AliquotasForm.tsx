import { ChangeEvent } from 'react';
import { useAppStore, AliquotaState } from '../state/store';

const fields: Array<{ key: keyof AliquotaState; label: string }> = [
  { key: 'pis', label: 'PIS (%)' },
  { key: 'cofins', label: 'COFINS (%)' },
  { key: 'iss', label: 'ISS (%)' },
  { key: 'icms', label: 'ICMS (%)' },
  { key: 'ipi', label: 'IPI (%)' },
  { key: 'cbs', label: 'CBS (%)' },
  { key: 'ibs', label: 'IBS (%)' },
  { key: 'seletivo', label: 'Imposto Seletivo (%)' },
  { key: 'irpj', label: 'IRPJ (%)' },
  { key: 'csll', label: 'CSLL (%)' },
  { key: 'cpp', label: 'CPP (%)' },
  { key: 'aliqOutros', label: 'Outros tributos (%)' }
];

export const AliquotasForm = () => {
  const aliquotas = useAppStore((state) => state.aliquotas);
  const updateAliquota = useAppStore((state) => state.updateAliquota);

  const handleChange = (key: keyof AliquotaState) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === '') {
      updateAliquota(key, 0 as never);
      return;
    }
    const parsed = Number(raw);
    updateAliquota(key, (Number.isFinite(parsed) ? parsed : 0) as never);
  };

  return (
    <div className="card">
      <h2>Alíquotas declaradas</h2>
      <div className="grid two" style={{ marginTop: '1rem' }}>
        {fields.map((field) => (
          <div className="field" key={field.key}>
            <label htmlFor={`aliq-${field.key}`}>{field.label}</label>
            <input
              id={`aliq-${field.key}`}
              type="number"
              step="0.01"
              value={aliquotas[field.key]}
              onChange={handleChange(field.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AliquotasForm;
