'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Card } from './card';

export interface ClickableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const ClickableCard = React.forwardRef<HTMLDivElement, ClickableCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'cursor-pointer',
          'hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
          'hover:border-primary/30',
          'active:scale-[0.99]',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

ClickableCard.displayName = 'ClickableCard'; 