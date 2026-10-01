import { zodResolver } from '@hookform/resolvers/zod';
import {
  cpfSchema,
  MAX_USERNAME_LENGTH,
  phoneSchema,
  type UpdateMeInput,
} from '@pagmanager/contracts';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldError, FieldLabel, Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-provider';
import { api } from '@/lib/api';
import { maskCpf, maskPhone } from '@/lib/format';

const profileFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, 'Informe seu nome.')
      .max(
        MAX_USERNAME_LENGTH,
        `O nome pode ter até ${MAX_USERNAME_LENGTH} caracteres.`,
      ),
    email: z.email('Informe um e-mail válido.'),
    cpf: z
      .string()
      .optional()
      .refine(
        (value) => !value || cpfSchema.safeParse(value).success,
        'CPF inválido.',
      ),
    phone: z
      .string()
      .optional()
      .refine(
        (value) => !value || phoneSchema.safeParse(value).success,
        'Informe um telefone com DDD e 10 ou 11 dígitos.',
      ),
    passwd: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.length >= 8,
        'A senha precisa ter pelo menos 8 caracteres.',
      ),
    confirmPasswd: z.string().optional(),
    currentPasswd: z.string().optional(),
  })
  .refine(
    (values) => !values.passwd || values.passwd === values.confirmPasswd,
    {
      path: ['confirmPasswd'],
      message: 'As senhas não coincidem.',
    },
  )
  .refine((values) => !values.passwd || Boolean(values.currentPasswd), {
    path: ['currentPasswd'],
    message: 'Informe sua senha atual para trocar a senha.',
  })
  .refine((values) => !values.currentPasswd || Boolean(values.passwd), {
    path: ['passwd'],
    message: 'Informe a nova senha para confirmar sua senha atual.',
  });

type ProfileInput = z.input<typeof profileFormSchema>;

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const { user, updateUser } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username ?? '',
      email: user?.email ?? '',
      cpf: maskCpf(user?.cpf ?? ''),
      phone: maskPhone(user?.phone ?? ''),
      passwd: '',
      confirmPasswd: '',
      currentPasswd: '',
    },
  });

  useEffect(() => {
    reset({
      username: user?.username ?? '',
      email: user?.email ?? '',
      cpf: maskCpf(user?.cpf ?? ''),
      phone: maskPhone(user?.phone ?? ''),
      passwd: '',
      confirmPasswd: '',
      currentPasswd: '',
    });
  }, [reset, user]);

  async function submit(values: ProfileInput) {
    try {
      const payload: UpdateMeInput = {
        username: values.username,
        email: values.email,
        ...(values.cpf ? { cpf: values.cpf.replace(/\D/g, '') } : {}),
        ...(values.phone ? { phone: values.phone.replace(/\D/g, '') } : {}),
        ...(values.passwd
          ? {
              passwd: values.passwd,
              confirmPasswd: values.confirmPasswd,
              currentPasswd: values.currentPasswd,
            }
          : {}),
      };
      const updated = await api.updateMe(payload);
      updateUser(updated);
      toast.success('Perfil atualizado.');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o perfil.',
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Perfil e configurações</DialogTitle>
          <DialogDescription>
            Atualize seus dados de acesso e contato.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <div>
            <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
            <Input
              id="profile-name"
              autoComplete="name"
              aria-invalid={Boolean(errors.username)}
              {...register('username')}
            />
            <FieldError>{errors.username?.message}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
            <Input
              id="profile-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="profile-cpf">CPF</FieldLabel>
              <Input
                id="profile-cpf"
                inputMode="numeric"
                aria-invalid={Boolean(errors.cpf)}
                {...register('cpf', {
                  onChange: (event) =>
                    setValue('cpf', maskCpf(event.target.value)),
                })}
              />
              <FieldError>{errors.cpf?.message}</FieldError>
            </div>
            <div>
              <FieldLabel htmlFor="profile-phone">Telefone</FieldLabel>
              <Input
                id="profile-phone"
                inputMode="tel"
                aria-invalid={Boolean(errors.phone)}
                {...register('phone', {
                  onChange: (event) =>
                    setValue('phone', maskPhone(event.target.value)),
                })}
              />
              <FieldError>{errors.phone?.message}</FieldError>
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <p className="mb-3 text-sm font-medium text-ink">
              Trocar senha{' '}
              <span className="font-normal text-muted">(opcional)</span>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="profile-current-password">
                  Senha atual
                </FieldLabel>
                <Input
                  id="profile-current-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.currentPasswd)}
                  {...register('currentPasswd')}
                />
                <FieldError>{errors.currentPasswd?.message}</FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="profile-password">Nova senha</FieldLabel>
                <Input
                  id="profile-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.passwd)}
                  {...register('passwd')}
                />
                <FieldError>{errors.passwd?.message}</FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="profile-confirm-password">
                  Confirmar senha
                </FieldLabel>
                <Input
                  id="profile-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPasswd)}
                  {...register('confirmPasswd')}
                />
                <FieldError>{errors.confirmPasswd?.message}</FieldError>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Salvar perfil'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
