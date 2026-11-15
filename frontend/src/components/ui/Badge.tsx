'use client';

import { Badge as ShadcnBadge } from '@/components/shadcn/badge';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

const variants = {
  default: { variant: 'secondary', className: '' },
  success: { variant: 'outline', className: 'border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  warning: { variant: 'outline', className: 'border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  danger: { variant: 'destructive', className: '' },
  info: { variant: 'outline', className: 'border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  purple: { variant: 'outline', className: 'border-transparent bg-violet-500/10 text-violet-700 dark:text-violet-400' },
} as const;

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const style = variants[variant];

  return (
    <ShadcnBadge variant={style.variant} className={style.className}>
      {label}
    </ShadcnBadge>
  );
}

// Status helpers
export function getInvoiceStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: 'Draft', variant: 'default' },
    sent: { label: 'Sent', variant: 'info' },
    paid: { label: 'Paid', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
  };
  return map[status] || { label: status, variant: 'default' };
}

export function getShippingStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'warning' },
    shipped: { label: 'Shipped', variant: 'info' },
    delivered: { label: 'Delivered', variant: 'success' },
    returned: { label: 'Returned', variant: 'danger' },
  };
  return map[status] || { label: status, variant: 'default' };
}

export function getPurchaseOrderStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    received: { label: 'Received', variant: 'purple' },
  };
  return map[status] || { label: status, variant: 'default' };
}
