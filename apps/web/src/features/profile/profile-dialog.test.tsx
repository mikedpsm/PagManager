import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  updateMe: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  user: {
    id: '6f61ad58-06fc-47fd-8c9a-4533e9206d16',
    username: 'Example User',
    email: 'example@example.com',
  },
}));

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({
    user: mocks.user,
    updateUser: mocks.updateUser,
  }),
}));

vi.mock('@/lib/api', () => ({ api: { updateMe: mocks.updateMe } }));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { ProfileDialog } from './profile-dialog';

const updatedUser = {
  id: '6f61ad58-06fc-47fd-8c9a-4533e9206d16',
  username: 'Example User',
  email: 'example@example.com',
};

describe('ProfileDialog password changes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.updateMe.mockResolvedValue(updatedUser);
  });

  it('requires the current password before sending a password change', async () => {
    const user = userEvent.setup();
    render(<ProfileDialog open onOpenChange={vi.fn()} />);

    await user.type(
      screen.getByLabelText('Nova senha'),
      'replacement-password',
    );
    await user.type(
      screen.getByLabelText('Confirmar senha'),
      'replacement-password',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    expect(
      await screen.findByText('Informe sua senha atual para trocar a senha.'),
    ).toBeInTheDocument();
    expect(mocks.updateMe).not.toHaveBeenCalled();
  });

  it('sends current and new passwords together when the user confirms the change', async () => {
    const user = userEvent.setup();
    render(<ProfileDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText('Senha atual'), 'old-password');
    await user.type(
      screen.getByLabelText('Nova senha'),
      'replacement-password',
    );
    await user.type(
      screen.getByLabelText('Confirmar senha'),
      'replacement-password',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    await waitFor(() => {
      expect(mocks.updateMe).toHaveBeenCalledWith({
        username: 'Example User',
        email: 'example@example.com',
        passwd: 'replacement-password',
        confirmPasswd: 'replacement-password',
        currentPasswd: 'old-password',
      });
    });
  });
});
