import type {
  CreateClientInput,
  CreateInvoiceInput,
  Invoice,
} from '@pagmanager/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  queryKeys,
  useClient,
  useCreateInvoice,
  useDeleteClient,
  useDeleteInvoice,
  useInvoices,
  usePayInvoice,
  useUpdateClient,
  useUpdateInvoice,
} from '@/features/data/queries';
import { InvoiceDialog } from '@/features/invoices/invoice-dialog';
import { InvoiceTable } from '@/features/invoices/invoice-table';
import { formatCpf, maskPhone } from '@/lib/format';
import { ClientDialog } from './client-dialog';

export function ClientDetailPage() {
  const { clientId } = useParams({ from: '/_app/clients/$clientId' });
  const clientQuery = useClient(clientId);
  const invoiceQuery = useInvoices({ clientId });
  const [editOpen, setEditOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice>();
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice>();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const payInvoice = usePayInvoice();
  const deleteInvoice = useDeleteInvoice();
  const client = clientQuery.data;
  const navigate = useNavigate({ from: '/clients/$clientId' });
  const queryClient = useQueryClient();
  const clientsById = new Map(client ? [[client.id, client.username]] : []);

  async function saveClient(values: CreateClientInput) {
    if (!client) return;
    try {
      await updateClient.mutateAsync({ id: client.id, input: values });
      toast.success('Dados do cliente atualizados.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o cliente.',
      );
      throw error;
    }
  }

  async function saveInvoice(values: CreateInvoiceInput) {
    if (editingInvoice) {
      await updateInvoice.mutateAsync({ id: editingInvoice.id, input: values });
      toast.success('Cobrança atualizada.');
    } else {
      await createInvoice.mutateAsync(values);
      toast.success('Cobrança criada.');
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

  async function confirmDeleteClient() {
    if (!client) return;
    try {
      await deleteClient.mutateAsync(client.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o cliente.',
      );
      return;
    }

    setDeleteOpen(false);
    toast.success('Cliente e cobranças excluídos.');
    await navigate({ to: '/clients' });
    queryClient.removeQueries({
      queryKey: queryKeys.client(client.id),
      exact: true,
    });
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clients }),
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
    ]);
  }

  async function confirmDeleteInvoice() {
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

  if (clientQuery.isPending)
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-44" />
        <Skeleton className="h-72" />
      </div>
    );
  if (clientQuery.isError)
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p role="alert" className="text-sm text-red-600">
            {clientQuery.error.message}
          </p>
          <Link
            to="/clients"
            className="mt-4 inline-block text-sm font-semibold text-brand"
          >
            Voltar para clientes
          </Link>
        </CardContent>
      </Card>
    );
  if (!client) return null;

  return (
    <div className="space-y-6">
      <Link
        to="/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Voltar para clientes
      </Link>
      <Card>
        <CardContent className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
          <div className="flex gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-lg font-bold text-brand-dark">
              {client.username
                .split(/\s+/)
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-ink">
                  {client.username}
                </h2>
                <Badge
                  variant={client.status === 'overdue' ? 'overdue' : 'paid'}
                >
                  {client.status === 'overdue' ? 'Em atraso' : 'Em dia'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{client.email}</p>
              <p className="mt-1 text-sm text-muted">
                {formatCpf(client.cpf)} · {maskPhone(client.phone)}
              </p>
              {(client.street || client.city) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-4" />
                  {[client.street, client.region, client.city, client.uf]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar cliente
              </Button>
              <ClientDialog
                client={client}
                onOpenChange={setEditOpen}
                onSave={saveClient}
              />
            </Dialog>
            <Dialog
              open={invoiceOpen}
              onOpenChange={(open) => {
                setInvoiceOpen(open);
                if (!open) setEditingInvoice(undefined);
              }}
            >
              <Button onClick={() => setInvoiceOpen(true)}>
                <Plus className="size-4" />
                Nova cobrança
              </Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir cliente
              </Button>
              <InvoiceDialog
                clients={[client]}
                defaultClientId={client.id}
                invoice={editingInvoice}
                onOpenChange={setInvoiceOpen}
                onSave={saveInvoice}
              />
            </Dialog>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Cobranças deste cliente</CardTitle>
              <p className="mt-1 text-sm text-muted">
                Consulte vencimentos e atualize o status.
              </p>
            </div>
            <Button
              size="sm"
              className="sm:hidden"
              onClick={() => setInvoiceOpen(true)}
            >
              <Plus className="size-4" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        {invoiceQuery.isPending ? (
          <CardContent className="space-y-3 pt-0">
            {[1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-12" />
            ))}
          </CardContent>
        ) : invoiceQuery.isError ? (
          <CardContent>
            <p role="alert" className="text-sm text-red-600">
              {invoiceQuery.error.message}
            </p>
          </CardContent>
        ) : invoiceQuery.data.length ? (
          <InvoiceTable
            invoices={invoiceQuery.data}
            clientsById={clientsById}
            onEdit={(invoice) => {
              setEditingInvoice(invoice);
              setInvoiceOpen(true);
            }}
            onDelete={setDeletingInvoice}
            onPaid={(invoice) => void markPaid(invoice)}
          />
        ) : (
          <CardContent className="py-12 text-center">
            <p className="font-medium text-ink">Ainda não há cobranças</p>
            <p className="mt-1 text-sm text-muted">
              Crie a primeira para acompanhar os recebimentos deste cliente.
            </p>
            <Button className="mt-4" onClick={() => setInvoiceOpen(true)}>
              <Plus className="size-4" />
              Nova cobrança
            </Button>
          </CardContent>
        )}
      </Card>
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleteClient.isPending) setDeleteOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente?</DialogTitle>
            <DialogDescription>
              O cliente “{client.username}” e todas as cobranças vinculadas
              serão excluídos permanentemente. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteClient.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => void confirmDeleteClient()}
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? 'Excluindo…' : 'Excluir cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
              onClick={() => void confirmDeleteInvoice()}
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
