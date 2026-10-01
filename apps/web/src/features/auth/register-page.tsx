import type { RegisterStep1, RegisterStep2 } from '@pagmanager/contracts';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand/brand-logo';

import { Card } from '@/components/ui/card';
import { ThemeSelector } from '@/features/theme/theme-selector';
import { api } from '@/lib/api';
import { useAuth } from './auth-provider';
import {
  RegisterComplete,
  RegisterStepOneForm,
  RegisterStepTwoForm,
} from './register-forms';

const REGISTER_DRAFT_KEY = 'pagmanager.register-draft';

export function RegisterPage() {
  const { step } = useSearch({ from: '/register' });
  const navigate = useNavigate();
  const { register: createAccount } = useAuth();
  const [draft, setDraft] = useState<RegisterStep1>(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem(REGISTER_DRAFT_KEY) ?? '{}',
      ) as RegisterStep1;
    } catch {
      return { username: '', email: '' };
    }
  });

  async function advance(values: RegisterStep1) {
    try {
      const result = await api.checkEmail(values.email);
      if (!result.available) {
        toast.error('Esse e-mail já possui uma conta.');
        return;
      }
      sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(values));
      setDraft(values);
      await navigate({ to: '/register', search: { step: 2 } });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível verificar o e-mail.',
      );
      throw error;
    }
  }

  async function finish(values: RegisterStep2) {
    if (!draft.username || !draft.email) {
      await navigate({ to: '/register', search: { step: 1 } });
      return;
    }
    try {
      await createAccount({ ...draft, passwd: values.passwd });
      sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      await navigate({ to: '/register', search: { step: 3 } });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a conta.',
      );
      throw error;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <Card className="w-full max-w-lg p-6 shadow-lg shadow-slate-900/5 sm:p-10">
        <div className="mb-6 flex justify-end">
          <ThemeSelector />
        </div>
        <Link to="/login" className="mb-8 inline-flex">
          <BrandLogo />
        </Link>
        {step === 1 && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-ink">Crie sua conta</h1>
            <p className="mb-7 text-sm text-muted">
              Comece com seus dados básicos.
            </p>
            <RegisterStepOneForm
              initialValues={draft.username ? draft : undefined}
              onSubmit={advance}
            />
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-ink">
              Proteja sua conta
            </h1>
            <p className="mb-7 text-sm text-muted">
              Escolha uma senha segura para continuar.
            </p>
            <RegisterStepTwoForm
              onBack={() =>
                void navigate({ to: '/register', search: { step: 1 } })
              }
              onSubmit={finish}
            />
          </>
        )}
        {step === 3 && (
          <RegisterComplete onContinue={() => void navigate({ to: '/home' })} />
        )}
        <p className="mt-8 text-center text-sm text-muted">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-text hover:underline"
          >
            Entrar
          </Link>
        </p>
      </Card>
    </main>
  );
}
