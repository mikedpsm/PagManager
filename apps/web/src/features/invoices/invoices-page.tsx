import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceStatus,
} from '@pagmanager/contracts';
import { Link } from '@tanstack/react-router';
import { FileText, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldLabel } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useClients,
  useCreateInvoice,
  useDeleteInvoice,
  useInvoices,
  usePayInvoice,
  useUpdateInvoice,
} from '@/features/data/queries';
import { InvoiceDialog } from './invoice-dialog';
import { InvoiceTable } from './invoice-table';

export function InvoicesPage() {
  const [status, setStatus] = useState('all');
  const [newOpen, setNewOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice>();
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice>();
  const invoices = useInvoices({
    status: status === 'all' ? undefined : (status as InvoiceStatus),
  });
  const clients = useClients();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const payInvoice = usePayInvoice();
  const clientsById = useMemo(
    () =>
      new Map(
        (clients.data ?? []).map((client) => [client.id, client.username]),
      ),
    [clients.data],
  );

  async function saveInvoice(values: CreateInvoiceInput) {
    try {
      if (editingInvoice) {
        await updateInvoice.mutateAsync({
          id: editingInvoice.id,
          input: values,
        });
        toast.success('Cobrança atualizada.');
      } else {
        await createInvoice.mutateAsync(values);
        toast.success('Cobrança criada.');
      }
      setNewOpen(false);
      setEditingInvoice(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a cobrança.',
      );
      throw error;
    }
  }

  async function markPaid(invoice: Invoice) {
    try {
      await payInvoice.mutateAsync(invoice.id);
      toast.success('Cobrança marcada como paga.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a cobrança.',
      );
    }
  }

  async function confirmDelete() {
    if (!deletingInvoice) return;
    try {
      await deleteInvoice.mutateAsync(deletingInvoice.id);
      toast.success('Cobrança excluída.');
      setDeletingInvoice(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir a cobrança.',
      );
    }
  }

  const openCreate = () => {
    setEditingInvoice(undefined);
    setNewOpen(true);
  };
  const openEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setNewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">
            Acompanhe valores, vencimentos e pagamentos.
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink">
            Todas as cobranças
          </h2>
        </div>
        <Dialog
          open={newOpen}
          onOpenChange={(open) => {
            setNewOpen(open);
            if (!open) setEditingInvoice(undefined);
          }}
        >
          <Button onClick={openCreate} disabled={!clients.data?.length}>
            <Plus className="size-4" />
            Nova cobrança
          </Button>
          <InvoiceDialog
            clients={clients.data ?? []}
            invoice={editingInvoice}
            onOpenChange={setNewOpen}
            onSave={saveInvoice}
          />
        </Dialog>
      </div>
      <div className="max-w-xs">
        <FieldLabel htmlFor="invoice-status">Filtrar por situação</FieldLabel>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="invoice-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cobranças</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="overdue">Em atraso</SelectItem>
            <SelectItem value="paid">Pagas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de cobranças</CardTitle>
        </CardHeader>
        {invoices.isPending ? (
          <CardContent className="space-y-3 pt-0">
            {[1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-12" />
            ))}
          </CardContent>
        ) : invoices.isError ? (
          <CardContent className="p-8 text-center">
            <p role="alert" className="text-sm text-danger">
              {invoices.error.message}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void invoices.refetch()}
            >
              Tentar novamente
            </Button>
          </CardContent>
        ) : invoices.data.length ? (
          <InvoiceTable
            invoices={invoices.data}
            clientsById={clientsById}
            onEdit={openEdit}
            onDelete={setDeletingInvoice}
            onPaid={(invoice) => void markPaid(invoice)}
          />
        ) : (
          <CardContent className="flex flex-col items-center py-14 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-success-soft text-brand-text">
              <FileText className="size-6" />
            </span>
            <h3 className="mt-4 font-semibold text-ink">
              Nenhuma cobrança por aqui
            </h3>
            <p className="mt-1 text-sm text-muted">
              {status === 'all'
                ? 'Crie uma cobrança para registrar um novo vencimento.'
                : 'Não há cobranças nesta situação.'}
            </p>
            {status === 'all' &&
              (clients.data?.length ? (
                <Button className="mt-5" onClick={openCreate}>
                  <Plus className="size-4" />
                  Criar cobrança
                </Button>
              ) : (
                <Button asChild className="mt-5" variant="outline">
                  <Link to="/clients">Cadastre um cliente primeiro</Link>
                </Button>
              ))}
          </CardContent>
        )}
      </Card>
      <Dialog
        open={Boolean(deletingInvoice)}
        onOpenChange={(open) => {
          if (!open) setDeletingInvoice(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cobrança?</DialogTitle>
            <DialogDescription>
              Esta ação remove “{deletingInvoice?.description}” permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeletingInvoice(undefined)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => void confirmDelete()}
              disabled={deleteInvoice.isPending}
            >
              {deleteInvoice.isPending ? 'Excluindo…' : 'Excluir cobrança'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
