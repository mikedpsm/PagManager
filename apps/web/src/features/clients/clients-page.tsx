import {
  type Client,
  type CreateClientInput,
  MAX_CLIENT_SEARCH_LENGTH,
} from '@pagmanager/contracts';
import { Link } from '@tanstack/react-router';
import { ArrowDownAZ, ArrowUpAZ, Plus, Search, UsersRound } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { FieldLabel, Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClients, useCreateClient } from '@/features/data/queries';
import { formatCpf, maskPhone } from '@/lib/format';
import { ClientDialog } from './client-dialog';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<'username' | '-username'>('username');
  const [dialogOpen, setDialogOpen] = useState(false);
  const clients = useClients({
    search: deferredSearch || undefined,
    status: status === 'all' ? undefined : (status as 'ok' | 'overdue'),
    sort,
  });
  const createClient = useCreateClient();

  async function saveClient(values: CreateClientInput) {
    try {
      await createClient.mutateAsync(values);
      toast.success('Cliente cadastrado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o cliente.',
      );
      throw error;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">
            Gerencie seus contatos e acompanhe sua situação.
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Seus clientes</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Adicionar cliente
          </Button>
          <ClientDialog onOpenChange={setDialogOpen} onSave={saveClient} />
        </Dialog>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <FieldLabel htmlFor="clients-search">Buscar clientes</FieldLabel>
          <Search
            className="absolute left-3 top-[2.65rem] size-4 text-muted"
            aria-hidden="true"
          />
          <Input
            id="clients-search"
            className="pl-9"
            value={search}
            maxLength={MAX_CLIENT_SEARCH_LENGTH}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, e-mail ou CPF"
          />
        </div>
        <div className="w-full md:w-52">
          <FieldLabel htmlFor="clients-status">Situação</FieldLabel>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="clients-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as situações</SelectItem>
              <SelectItem value="ok">Em dia</SelectItem>
              <SelectItem value="overdue">Em atraso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="w-full md:w-auto"
          onClick={() =>
            setSort((value) =>
              value === 'username' ? '-username' : 'username',
            )
          }
        >
          <span className="sr-only">Ordenar por nome</span>
          {sort === 'username' ? (
            <ArrowDownAZ className="size-4" />
          ) : (
            <ArrowUpAZ className="size-4" />
          )}{' '}
          A–Z
        </Button>
      </div>
      <Card>
        {clients.isPending ? (
          <CardContent className="space-y-3 p-5">
            {[1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-12" />
            ))}
          </CardContent>
        ) : clients.isError ? (
          <CardContent className="p-8 text-center">
            <p role="alert" className="text-sm text-danger">
              {clients.error.message}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void clients.refetch()}
            >
              Tentar novamente
            </Button>
          </CardContent>
        ) : !clients.data.length ? (
          <CardContent className="flex flex-col items-center px-5 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-success-soft text-brand-text">
              <UsersRound className="size-6" />
            </span>
            <h3 className="mt-4 font-semibold text-ink">
              Nenhum cliente encontrado
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {search
                ? 'Tente alterar sua busca ou os filtros.'
                : 'Adicione o primeiro cliente para começar a organizar suas cobranças.'}
            </p>
            {!search && (
              <Button className="mt-5" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Adicionar cliente
              </Button>
            )}
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>
                  <span className="sr-only">Abrir</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.data.map((client) => (
                <ClientRow key={client.id} client={client} />
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function ClientRow({ client }: { client: Client }) {
  return (
    <TableRow>
      <TableCell>
        <Link
          to="/clients/$clientId"
          params={{ clientId: client.id }}
          className="font-semibold text-ink hover:text-brand-text"
        >
          {client.username}
          <span className="mt-1 block text-xs font-normal text-muted">
            {client.email}
          </span>
        </Link>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted">
        {formatCpf(client.cpf)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted">
        {maskPhone(client.phone)}
      </TableCell>
      <TableCell>
        <Badge variant={client.status === 'overdue' ? 'overdue' : 'paid'}>
          {client.status === 'overdue' ? 'Em atraso' : 'Em dia'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Link
          to="/clients/$clientId"
          params={{ clientId: client.id }}
          className="text-sm font-semibold text-brand-text hover:underline"
        >
          Ver perfil
        </Link>
      </TableCell>
    </TableRow>
  );
}
