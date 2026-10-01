import { zodResolver } from '@hookform/resolvers/zod';
import {
  type RegisterStep1,
  type RegisterStep2,
  registerStep1Schema,
  registerStep2Schema,
} from '@pagmanager/contracts';
import {
  Check,
  ChevronLeft,
  CircleCheck,
  LockKeyhole,
  UserRound,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FieldError, FieldLabel, Input } from '@/components/ui/input';

function Progress({ step }: { step: number }) {
  const steps = [
    { Icon: UserRound, label: 'Seus dados' },
    { Icon: LockKeyhole, label: 'Segurança' },
    { Icon: CircleCheck, label: 'Pronto' },
  ];
  return (
    <ol aria-label="Etapas do cadastro" className="mb-8 flex items-start">
      {steps.map(({ Icon, label }, index) => {
        const current = index + 1;
        return (
          <li
            key={label}
            className="relative flex flex-1 flex-col items-center gap-2 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-5 h-0.5 w-full ${step >= current ? 'bg-brand' : 'bg-line'}`}
              />
            )}
            <span
              className={`relative z-10 grid size-10 place-items-center rounded-full border ${step >= current ? 'border-brand bg-brand text-white' : 'border-line bg-white text-muted'}`}
            >
              {step > current ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Icon className="size-5" aria-hidden="true" />
              )}
            </span>
            <span
              className={`text-xs font-medium ${step >= current ? 'text-brand-dark' : 'text-muted'}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function RegisterStepOneForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: RegisterStep1;
  onSubmit(values: RegisterStep1): Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStep1>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: initialValues ?? { username: '', email: '' },
  });
  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Progress step={1} />
      <div>
        <FieldLabel htmlFor="register-name">Nome</FieldLabel>
        <Input
          id="register-name"
          autoComplete="name"
          placeholder="Como podemos te chamar?"
          aria-invalid={Boolean(errors.username)}
          {...register('username')}
        />
        <FieldError>{errors.username?.message}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="register-email">E-mail</FieldLabel>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <Button
        className="w-full"
        size="lg"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Verificando…' : 'Continuar'}
      </Button>
    </form>
  );
}

export function RegisterStepTwoForm({
  onBack,
  onSubmit,
}: {
  onBack(): void;
  onSubmit(values: RegisterStep2): Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStep2>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { passwd: '', confirmPasswd: '' },
  });
  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Progress step={2} />
      <div>
        <FieldLabel htmlFor="register-password">Senha</FieldLabel>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Pelo menos 8 caracteres"
          aria-invalid={Boolean(errors.passwd)}
          {...register('passwd')}
        />
        <FieldError>{errors.passwd?.message}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="register-confirm-password">
          Confirme sua senha
        </FieldLabel>
        <Input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          aria-invalid={Boolean(errors.confirmPasswd)}
          {...register('confirmPasswd')}
        />
        <FieldError>{errors.confirmPasswd?.message}</FieldError>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          type="button"
          onClick={onBack}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <Button className="flex-1" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando…' : 'Criar conta'}
        </Button>
      </div>
    </form>
  );
}

export function RegisterComplete({ onContinue }: { onContinue(): void }) {
  return (
    <div className="text-center">
      <Progress step={3} />
      <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-50 text-brand">
        <Check className="size-8" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold text-ink">Conta criada!</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Seu espaço está pronto. Cadastre seus clientes e acompanhe as cobranças
        em um só lugar.
      </p>
      <Button className="mt-7 w-full" size="lg" onClick={onContinue}>
        Acessar minha conta
      </Button>
    </div>
  );
}
