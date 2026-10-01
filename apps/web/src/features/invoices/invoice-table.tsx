import type { Invoice } from '@pagmanager/contracts';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBRL, formatDate } from '@/lib/format';

const statusLabel: Record<Invoice['status'], string> = {
  paid: 'Paga',
  pending: 'Pendente',
  overdue: 'Em atraso',
};

export function InvoiceTable({
  invoices,
  clientsById,
  onEdit,
  onDelete,
  onPaid,
}: {
  invoices: Invoice[];
  clientsById: Map<string, string>;
  onEdit(invoice: Invoice): void;
  onDelete(invoice: Invoice): void;
  onPaid(invoice: Invoice): void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="min-w-40 font-medium text-ink">
              {invoice.description}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted">
              {clientsById.get(invoice.clientId) ?? 'Cliente'}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted">
              {formatDate(invoice.dueDate)}
            </TableCell>
            <TableCell className="whitespace-nowrap font-semibold text-ink">
              {formatBRL(invoice.amountCents)}
            </TableCell>
            <TableCell>
              <Badge variant={invoice.status}>
                {statusLabel[invoice.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                {invoice.status !== 'paid' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Marcar ${invoice.description} como paga`}
                    title="Marcar como paga"
                    onClick={() => onPaid(invoice)}
                  >
                    <Check className="size-4 text-brand-text" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${invoice.description}`}
                  title="Editar"
                  onClick={() => onEdit(invoice)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${invoice.description}`}
                  title="Excluir"
                  onClick={() => onDelete(invoice)}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
