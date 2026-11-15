'use client';

import { ReactNode } from 'react';
import {
  Card as ShadcnCard,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export default function Card({ children, className = '', title, action }: CardProps) {
  return (
    <ShadcnCard className={`gap-0 rounded-xl py-0 ${className}`}>
      {(title || action) && (
        <CardHeader className="border-b border-border py-4">
          {title && <CardTitle className="text-sm">{title}</CardTitle>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className="p-6">{children}</CardContent>
    </ShadcnCard>
  );
}
