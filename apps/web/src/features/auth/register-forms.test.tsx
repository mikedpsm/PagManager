import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RegisterStepTwoForm } from './register-forms';

describe('RegisterStepTwoForm', () => {
  it('requires matching passwords before account creation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegisterStepTwoForm onBack={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Senha'), 'strong-password');
    await user.type(
      screen.getByLabelText('Confirme sua senha'),
      'other-password',
    );
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'As senhas não coincidem',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
