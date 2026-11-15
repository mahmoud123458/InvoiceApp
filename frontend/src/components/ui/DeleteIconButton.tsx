'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

interface DeleteIconButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function DeleteIconButton({ label, onClick, disabled = false }: DeleteIconButtonProps) {
  return (
    <Button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      variant="ghost"
      size="icon-sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 aria-hidden="true" />
    </Button>
  );
}
