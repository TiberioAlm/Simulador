import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import App from '../../App';

const fillNumber = async (user: ReturnType<typeof userEvent.setup>, label: string, value: string) => {
  const input = screen.getByLabelText(label) as HTMLInputElement;
  await user.clear(input);
  await user.type(input, value);
  return input;
};

describe('App integration', () => {
  it('adds an item and updates the comparative report', async () => {
    const user = userEvent.setup();
    render(<App />);

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Cenário'), 'regime2033');

      await fillNumber(user, 'Receita (período)', '100000');
      await fillNumber(user, 'Compras – CBS/IBS', '20000');
      await fillNumber(user, 'Compras – PIS/COFINS', '15000');
      await fillNumber(user, 'Compras – ICMS', '10000');
      await fillNumber(user, 'Base Imposto Seletivo', '5000');
      await fillNumber(user, 'Despesas (Lucro Real)', '40000');
      await fillNumber(user, 'Imposto Seletivo (%)', '2');
      await fillNumber(user, 'Outros tributos (%)', '1');

      const addButton = screen.getByRole('button', { name: /adicionar item/i });
      await user.click(addButton);
    });

    const receitaChip = await screen.findByText(/Receita: R\$\s*100\.000,00/);
    expect(receitaChip).toBeInTheDocument();

    const summary = await screen.findByText('Resumo comparativo');
    const container = summary.closest('.card') ?? summary.parentElement;
    expect(container).not.toBeNull();
    const summaryText = within(container as HTMLElement).getByText(/Diferença absoluta/i).parentElement;
    expect(summaryText).toHaveTextContent(/R\$\s*7\.237,50/);
  });
});
