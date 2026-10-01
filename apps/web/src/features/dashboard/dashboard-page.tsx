import { Link } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  CreditCard,
  UsersRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-provider';
import { useDashboard } from '@/features/data/queries';
import { formatBRL, formatDate } from '@/lib/format';

const summaryCards = [
  {
    key: 'paidCents',
    label: 'Recebido',
    icon: CreditCard,
    tone: 'text-brand-text bg-success-soft',
    note: 'pagamentos concluídos',
  },
  {
    key: 'pendingCents',
    label: 'A vencer',
    icon: Clock3,
    tone: 'text-warning bg-warning-soft',
    note: 'cobranças pendentes',
  },
  {
    key: 'overdueCents',
    label: 'Em atraso',
    icon: ArrowDownRight,
    tone: 'text-danger bg-danger-soft',
    note: 'precisam de atenção',
  },
] as const;

export function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboard();

  if (dashboard.isPending)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-2/3" />
        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <Skeleton key={card.key} className="h-36" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  if (dashboard.isError)
    return (
      <div
        role="alert"
        className="rounded-2xl border border-danger/30 bg-surface p-8 text-center"
      >
        <h2 className="font-semibold text-ink">
          Não foi possível carregar o resumo.
        </h2>
        <p className="mt-2 text-sm text-muted">{dashboard.error.message}</p>
        <Button className="mt-5" onClick={() => void dashboard.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );

  const { totals, overdueClients, upToDateClients } = dashboard.data;
  const firstName = user?.username.split(' ')[0] ?? 'Olá';
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-text">
            Seu resumo financeiro
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Olá, {firstName} 👋
          </h2>
          <p className="mt-2 text-sm text-muted">
            Aqui está o que está acontecendo com suas cobranças.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/clients">
              <UsersRound className="size-4" />
              Clientes
            </Link>
          </Button>
          <Button asChild>
            <Link to="/invoices">
              <ArrowUpRight className="size-4" />
              Ver cobranças
            </Link>
          </Button>
        </div>
      </div>
      <section
        aria-label="Resumo de cobranças"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {summaryCards.map(({ key, label, icon: Icon, tone, note }) => (
          <Card key={key}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-ink">
                  {formatBRL(totals[key])}
                </p>
                <p className="mt-1 text-xs text-muted">{note}</p>
              </div>
              <span
                className={`grid size-11 place-items-center rounded-xl ${tone}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <ClientSummary
          title="Clientes em atraso"
          description="Cobranças vencidas que merecem acompanhamento."
          entries={overdueClients}
          empty="Nenhuma cobrança em atraso. Tudo certo!"
          variant="overdue"
        />
        <ClientSummary
          title="Próximos vencimentos"
          description="Clientes com valores pendentes dentro do prazo."
          entries={upToDateClients}
          empty="Você não tem cobranças a vencer."
          variant="pending"
        />
      </section>
    </div>
  );
}

function ClientSummary({
  title,
  description,
  entries,
  empty,
  variant,
}: {
  title: string;
  description: string;
  entries: Array<{
    invoiceId: string;
    username: string;
    amountCents: number;
    dueDate: string;
  }>;
  empty: string;
  variant: 'overdue' | 'pending';
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        {entries.length ? (
          <ul className="divide-y divide-line/70">
            {entries.map((entry) => (
              <li
                key={entry.invoiceId}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {entry.username}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Venceu em {formatDate(entry.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">
                    {formatBRL(entry.amountCents)}
                  </p>
                  <Badge className="mt-1" variant={variant}>
                    {variant === 'overdue' ? 'Em atraso' : 'Pendente'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl bg-canvas px-4 py-8 text-center text-sm text-muted">
            {empty}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
