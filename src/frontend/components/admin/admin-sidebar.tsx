'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/catalogo', label: 'Catálogo', icon: '🛍️' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '📦' },
  { href: '/admin/configurador', label: 'Configurador', icon: '🎂' },
  { href: '/admin/descuentos', label: 'Descuentos', icon: '🏷️' },
  { href: '/admin/descuentos/cupones', label: 'Cupones', icon: '🎫' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card min-h-screen">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="PorAmor"
          width={36}
          height={36}
          className="rounded-full object-cover flex-shrink-0"
        />
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
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
