import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { Menu as MenuIcon, Settings, X } from 'lucide-react';
import { useState } from 'react';
import ChargesIcon from '@/assets/icons/charge.svg?react';
import ChargesSelectedIcon from '@/assets/icons/charge-selected.svg?react';
import ClientsIcon from '@/assets/icons/clients.svg?react';
import ClientsSelectedIcon from '@/assets/icons/clients-selected.svg?react';
import HomeIcon from '@/assets/icons/home.svg?react';
import HomeSelectedIcon from '@/assets/icons/home-selected.svg?react';
import LogoutIcon from '@/assets/icons/logout.svg?react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-provider';
import { ProfileDialog } from '@/features/profile/profile-dialog';
import { cn } from '@/lib/cn';

const navLinks = [
  {
    to: '/home',
    label: 'Início',
    Icon: HomeIcon,
    ActiveIcon: HomeSelectedIcon,
  },
  {
    to: '/clients',
    label: 'Clientes',
    Icon: ClientsIcon,
    ActiveIcon: ClientsSelectedIcon,
  },
  {
    to: '/invoices',
    label: 'Cobranças',
    Icon: ChargesIcon,
    ActiveIcon: ChargesSelectedIcon,
  },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6">
      <Link
        to="/home"
        className="mb-10 flex items-center gap-3 px-2 text-lg font-bold tracking-tight text-brand-dark"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-sm text-white">
          P
        </span>
        PagManager
      </Link>
      <nav aria-label="Navegação principal" className="space-y-1">
        {navLinks.map(({ to, label, Icon, ActiveIcon }) => {
          const active = location.pathname.startsWith(to);
          const NavIcon = active ? ActiveIcon : Icon;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                active
                  ? 'bg-emerald-50 text-brand-dark'
                  : 'text-muted hover:bg-canvas hover:text-ink',
              )}
            >
              <NavIcon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-brand-dark p-4 text-white">
        <p className="text-sm font-semibold">Seu negócio, em dia</p>
        <p className="mt-1 text-xs leading-5 text-white/70">
          Acompanhe recebimentos e organize sua rotina.
        </p>
      </div>
    </aside>
  );
}

const pageTitles: Record<string, string> = {
  '/home': 'Visão geral',
  '/clients': 'Clientes',
  '/invoices': 'Cobranças',
};

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const title = location.pathname.startsWith('/clients/')
    ? 'Detalhes do cliente'
    : (pageTitles[location.pathname] ?? 'PagManager');
  const initials =
    user?.username
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? 'PM';

  return (
    <>
      <div className="min-h-screen bg-canvas lg:flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[4.25rem] items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur sm:px-7">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                {mobileNavOpen ? (
                  <X className="size-5" />
                ) : (
                  <MenuIcon className="size-5" />
                )}
              </Button>
              <h1 className="text-base font-semibold text-ink sm:text-lg">
                {title}
              </h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto gap-3 rounded-full p-1.5 pr-3"
                  aria-label="Abrir menu do perfil"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-brand-dark">
                    {initials}
                  </span>
                  <span className="hidden max-w-40 truncate text-sm font-medium sm:block">
                    {user?.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold">
                    {user?.username}
                  </p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                  <Settings className="size-4" aria-hidden="true" />
                  Perfil e configurações
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={logout} className="text-red-600">
                  <LogoutIcon className="size-4" aria-hidden="true" />
                  Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DialogContent className="left-0 top-0 h-full max-h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none rounded-r-2xl p-4 lg:hidden">
              <DialogTitle className="sr-only">Navegação principal</DialogTitle>
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </DialogContent>
          </Dialog>
          <main
            id="main-content"
            className="mx-auto w-full max-w-[1440px] p-4 sm:p-7 lg:p-9"
          >
            <Outlet />
          </main>
        </div>
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
