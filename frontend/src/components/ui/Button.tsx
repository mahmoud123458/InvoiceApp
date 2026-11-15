'use client';

import { ReactNode } from 'react';
import { Button as ShadcnButton } from '@/components/shadcn/button';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const variants = {
  primary: 'default',
  secondary: 'outline',
  danger: 'destructive',
  ghost: 'ghost',
  success: 'default',
} as const;

const sizes = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
} as const;

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  const toneClass = variant === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : '';

  return (
    <ShadcnButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={variants[variant]}
      size={sizes[size]}
      className={`${fullWidth ? 'w-full' : ''} ${toneClass} ${className}`}
    >
      {children}
    </ShadcnButton>
  );
}
