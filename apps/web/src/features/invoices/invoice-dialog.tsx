import { zodResolver } from '@hookform/resolvers/zod';
import {
  type Client,
  createInvoiceInputSchema,
  type Invoice,
} from '@pagmanager/contracts';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldError, FieldLabel, Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { maskBrlAmount, parseBRL } from '@/lib/format';

const invoiceFormSchema = z
  .object({
    clientId: createInvoiceInputSchema.shape.clientId,
    description: createInvoiceInputSchema.shape.description,
    amount: z
      .string()
      .refine(
        (value) => Number.isFinite(parseBRL(value)) && parseBRL(value) > 0,
        'Informe um valor válido.',
      )
      .transform(parseBRL),
    dueDate: createInvoiceInputSchema.shape.dueDate,
  })
  .transform(({ amount, ...rest }) => ({ ...rest, amountCents: amount }));

type InvoiceFormInput = z.input<typeof invoiceFormSchema>;
type InvoiceFormOutput = z.output<typeof invoiceFormSchema>;

interface InvoiceDialogProps {
  clients: Client[];
  invoice?: Invoice;
  defaultClientId?: string;
  onOpenChange(open: boolean): void;
  onSave(values: InvoiceFormOutput): Promise<void>;
}

export function InvoiceDialog({
  clients,
  invoice,
  defaultClientId,
  onOpenChange,
  onSave,
}: InvoiceDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormInput, unknown, InvoiceFormOutput>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: invoice?.clientId ?? defaultClientId ?? '',
      description: invoice?.description ?? '',
      amount: invoice
        ? (invoice.amountCents / 100).toFixed(2).replace('.', ',')
        : '',
      dueDate: invoice?.dueDate ?? '',
    },
  });
  const clientId = watch('clientId');

  useEffect(() => {
    reset({
      clientId: invoice?.clientId ?? defaultClientId ?? '',
      description: invoice?.description ?? '',
      amount: invoice
        ? (invoice.amountCents / 100).toFixed(2).replace('.', ',')
        : '',
      dueDate: invoice?.dueDate ?? '',
    });
  }, [defaultClientId, invoice, reset]);

  async function submit(values: InvoiceFormOutput) {
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a cobrança.',
      );
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {invoice ? 'Editar cobrança' : 'Nova cobrança'}
        </DialogTitle>
        <DialogDescription>
          Defina o cliente, valor e vencimento.
        </DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        <div>
          <FieldLabel htmlFor="invoice-client">Cliente</FieldLabel>
          <Select
            value={clientId}
            onValueChange={(value) =>
              setValue('clientId', value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="invoice-client" aria-label="Cliente">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.clientId?.message}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="invoice-description">Descrição</FieldLabel>
          <Input
            id="invoice-description"
            placeholder="Ex.: Consultoria mensal"
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="invoice-amount">Valor (R$)</FieldLabel>
            <Input
              id="invoice-amount"
              inputMode="decimal"
              placeholder="0,00"
              aria-invalid={Boolean(errors.amount)}
              {...register('amount', {
                onChange: (event) =>
                  setValue('amount', maskBrlAmount(event.target.value)),
              })}
            />
            <FieldError>{errors.amount?.message}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="invoice-due-date">Vencimento</FieldLabel>
            <Input
              id="invoice-due-date"
              type="date"
              aria-invalid={Boolean(errors.dueDate)}
              {...register('dueDate')}
            />
            <FieldError>{errors.dueDate?.message}</FieldError>
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
          <Button type="submit" disabled={isSubmitting || clients.length === 0}>
            {isSubmitting
              ? 'Salvando…'
              : invoice
                ? 'Salvar alterações'
                : 'Criar cobrança'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
