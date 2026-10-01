import { zodResolver } from '@hookform/resolvers/zod';
import {
  type Client,
  type CreateClientInput,
  createClientInputSchema,
  MAX_USERNAME_LENGTH,
} from '@pagmanager/contracts';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldError, FieldLabel, Input } from '@/components/ui/input';
import { maskCep, maskCpf, maskPhone } from '@/lib/format';

interface ClientDialogProps {
  client?: Client;
  onOpenChange(open: boolean): void;
  onSave(values: CreateClientInput): Promise<void>;
}

const emptyClient: CreateClientInput = {
  username: '',
  email: '',
  cpf: '',
  phone: '',
  street: '',
  complement: '',
  cep: '',
  region: '',
  city: '',
  uf: '',
};

export function ClientDialog({
  client,
  onOpenChange,
  onSave,
}: ClientDialogProps) {
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientInputSchema),
    defaultValues: client
      ? {
          username: client.username,
          email: client.email,
          cpf: maskCpf(client.cpf),
          phone: maskPhone(client.phone),
          street: client.street ?? '',
          complement: client.complement ?? '',
          cep: maskCep(client.cep ?? ''),
          region: client.region ?? '',
          city: client.city ?? '',
          uf: client.uf ?? '',
        }
      : emptyClient,
  });

  useEffect(() => {
    reset(
      client
        ? {
            username: client.username,
            email: client.email,
            cpf: maskCpf(client.cpf),
            phone: maskPhone(client.phone),
            street: client.street ?? '',
            complement: client.complement ?? '',
            cep: maskCep(client.cep ?? ''),
            region: client.region ?? '',
            city: client.city ?? '',
            uf: client.uf ?? '',
          }
        : emptyClient,
    );
  }, [client, reset]);

  async function lookupCep() {
    const cep = (
      document.getElementById('client-cep') as HTMLInputElement | null
    )?.value.replace(/\D/g, '');
    if (cep?.length !== 8) {
      toast.error('Informe um CEP com 8 dígitos.');
      return;
    }
    setLookingUpCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) throw new Error('Consulta de CEP indisponível.');
      const address = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (address.erro) throw new Error('CEP não encontrado.');
      setValue('street', address.logradouro ?? '', { shouldDirty: true });
      setValue('region', address.bairro ?? '', { shouldDirty: true });
      setValue('city', address.localidade ?? '', { shouldDirty: true });
      setValue('uf', address.uf ?? '', { shouldDirty: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível consultar o CEP.',
      );
    } finally {
      setLookingUpCep(false);
    }
  }

  async function submit(values: CreateClientInput) {
    try {
      await onSave({
        ...values,
        cpf: values.cpf.replace(/\D/g, ''),
        phone: values.phone.replace(/\D/g, ''),
        cep: values.cep?.replace(/\D/g, ''),
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o cliente.',
      );
    }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {client ? 'Editar cliente' : 'Adicionar cliente'}
        </DialogTitle>
        <DialogDescription>
          Preencha os dados de contato e, se quiser, o endereço.
        </DialogDescription>
      </DialogHeader>
      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="client-name">Nome completo</FieldLabel>
            <Input
              id="client-name"
              autoComplete="name"
              maxLength={MAX_USERNAME_LENGTH}
              aria-invalid={Boolean(errors.username)}
              {...register('username')}
            />
            <FieldError>{errors.username?.message}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="client-email">E-mail</FieldLabel>
            <Input
              id="client-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="client-cpf">CPF</FieldLabel>
            <Input
              id="client-cpf"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              aria-invalid={Boolean(errors.cpf)}
              {...register('cpf', {
                onChange: (event) =>
                  setValue('cpf', maskCpf(event.target.value)),
              })}
            />
            <FieldError>{errors.cpf?.message}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="client-phone">Telefone</FieldLabel>
            <Input
              id="client-phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
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
          <div className="mb-3 flex items-end gap-3">
            <div className="max-w-44 flex-1">
              <FieldLabel htmlFor="client-cep">CEP</FieldLabel>
              <Input
                id="client-cep"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                aria-invalid={Boolean(errors.cep)}
                {...register('cep', {
                  onChange: (event) =>
                    setValue('cep', maskCep(event.target.value)),
                })}
              />
              <FieldError>{errors.cep?.message}</FieldError>
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => void lookupCep()}
              disabled={lookingUpCep}
            >
              {lookingUpCep ? 'Buscando…' : 'Buscar endereço'}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
            <div>
              <FieldLabel htmlFor="client-street">Rua</FieldLabel>
              <Input
                id="client-street"
                autoComplete="street-address"
                {...register('street')}
              />
            </div>
            <div>
              <FieldLabel htmlFor="client-complement">Complemento</FieldLabel>
              <Input id="client-complement" {...register('complement')} />
            </div>
            <div>
              <FieldLabel htmlFor="client-region">Bairro</FieldLabel>
              <Input id="client-region" {...register('region')} />
            </div>
            <div className="grid grid-cols-[1fr_5rem] gap-3">
              <div>
                <FieldLabel htmlFor="client-city">Cidade</FieldLabel>
                <Input
                  id="client-city"
                  autoComplete="address-level2"
                  {...register('city')}
                />
              </div>
              <div>
                <FieldLabel htmlFor="client-uf">UF</FieldLabel>
                <Input
                  id="client-uf"
                  maxLength={2}
                  autoComplete="address-level1"
                  {...register('uf')}
                />
              </div>
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
            {isSubmitting
              ? 'Salvando…'
              : client
                ? 'Salvar alterações'
                : 'Criar cliente'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
