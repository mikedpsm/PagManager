import type { Client } from '@pagmanager/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from '@/components/ui/dialog';

import { InvoiceDialog } from './invoice-dialog';

const client: Client = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  username: 'Cris',
  email: 'cris@example.com',
  cpf: '52998224725',
  phone: '11999999999',
  status: 'ok',
};

describe('InvoiceDialog', () => {
  it('blocks an over-limit amount before calling onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <InvoiceDialog
          clients={[client]}
          defaultClientId={client.id}
          onOpenChange={vi.fn()}
          onSave={onSave}
        />
      </Dialog>,
    );

    await user.type(screen.getByLabelText('Descrição'), 'Serviços');
    fireEvent.change(screen.getByLabelText('Valor (R$)'), {
      target: { value: '21.474.836,48' },
    });
    fireEvent.change(screen.getByLabelText('Vencimento'), {
      target: { value: '2030-06-15' },
    });
    await user.click(screen.getByRole('button', { name: 'Criar cobrança' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /valor máximo.*21\.474\.836,47/i,
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});
