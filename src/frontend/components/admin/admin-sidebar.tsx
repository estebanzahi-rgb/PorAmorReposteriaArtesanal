'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/catalogo', label: 'Catálogo', icon: '🛍️' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '📦' },
  { href: '/admin/configurador', label: 'Configurador', icon: '🎂' },
  { href: '/admin/descuentos', label: 'Descuentos', icon: '🏷️' },
  { href: '/admin/descuentos/cupones', label: 'Cupones', icon: '🎫' },
  { href: '/admin/admins', label: 'Administradores', icon: '👤' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Image src="/logo.png" alt="PorAmor" width={36} height={36} className="rounded-full object-cover flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold leading-tight">PorAmor</p>
          <p className="text-xs text-muted-foreground">Panel Admin</p>
        </div>
      </div>
      <nav className="p-2 space-y-0.5">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : !!pathname?.startsWith(item.href) && !(item.href === '/admin/descuentos' && pathname?.startsWith('/admin/descuentos/cupones'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-border bg-card min-h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-card border-b border-border px-4 h-11 flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Menú admin"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menú</span>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 top-[6.75rem]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-card border-r border-border overflow-y-auto">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
