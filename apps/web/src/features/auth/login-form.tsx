import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginInputSchema } from '@pagmanager/contracts';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FieldError, FieldLabel, Input } from '@/components/ui/input';

interface LoginFormProps {
  onSubmit(values: LoginInput): Promise<void>;
  onRegister(): void;
}

export function LoginForm({ onSubmit, onRegister }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', passwd: '' },
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="login-password">Senha</FieldLabel>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          aria-invalid={Boolean(errors.passwd)}
          {...register('passwd')}
        />
        <FieldError>{errors.passwd?.message}</FieldError>
      </div>
      <Button
        className="w-full"
        size="lg"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{' '}
        <button
          type="button"
          className="font-semibold text-brand hover:underline"
          onClick={onRegister}
        >
          Criar conta
        </button>
      </p>
    </form>
  );
}
