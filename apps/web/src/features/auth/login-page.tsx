import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import loginSide from '@/assets/images/login_side.png';
import { BrandLogo } from '@/components/brand/brand-logo';
import { useAuth } from './auth-provider';
import { LoginForm } from './login-form';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(values: { email: string; passwd: string }) {
    try {
      await login(values);
      toast.success('Bem-vindo de volta!');
      await navigate({ to: '/home' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível entrar.',
      );
      throw error;
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(25rem,0.9fr)_1.1fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <Link to="/login" className="mb-10 inline-flex">
            <BrandLogo />
          </Link>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
              Gestão simples
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              Que bom ter você por aqui
            </h1>
            <p className="mt-2 text-muted">
              Entre para acompanhar seus clientes e cobranças.
            </p>
          </div>
          <LoginForm
            onSubmit={handleLogin}
            onRegister={() =>
              void navigate({ to: '/register', search: { step: 1 } })
            }
          />
          <p className="mt-10 text-center text-xs text-muted">
            PagManager · Organização que cabe no seu dia
          </p>
        </div>
      </section>
      <aside className="relative hidden min-h-screen overflow-hidden bg-brand-dark lg:block">
        <img
          src={loginSide}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/85 via-brand-dark/35 to-brand/25" />
        <div className="relative flex h-full min-h-screen flex-col justify-end p-14 text-white xl:p-20">
          <span className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Tudo em dia
          </span>
          <h2 className="max-w-lg text-4xl font-bold leading-tight xl:text-5xl">
            Mais clareza para cuidar do seu negócio.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-white/80">
            Clientes, vencimentos e recebimentos organizados em uma experiência
            simples.
          </p>
        </div>
      </aside>
    </main>
  );
}
