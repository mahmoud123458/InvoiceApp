'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartNoAxesColumn,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/finance', label: 'Finance', icon: ChartNoAxesColumn },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/shipping', label: 'Shipping', icon: Truck },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/users', label: 'Users', icon: Users },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const visibleItems = user?.role === 'admin'
    ? navItems
    : user?.role === 'user'
      ? navItems.filter((item) => !['/users', '/inventory', '/shipping'].includes(item.href))
      : [];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        id="app-navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 md:w-64 ${
          mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full md:visible md:translate-x-0'
        }`}
      >
        <div className="border-b border-sidebar-border px-5 py-5">
          <Link href="/" aria-label="InvoiceApp home" className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 bg-blue-600 items-center justify-center rounded-lg text-sidebar-primary-foreground">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <span className="whitespace-nowrap text-base font-semibold tracking-tight">InvoiceApp</span>
          </Link>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {visibleItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={label}
                    aria-current={isActive ? 'page' : undefined}
                    title={label}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="whitespace-nowrap">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-sidebar-border px-3 py-4">
          <ThemeToggle />
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role || 'Member'}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Logout"
            title="Logout"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { onClose(); logout(); }}
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
