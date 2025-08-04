'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { Button, ButtonProps } from './button';

export interface ActionButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, children, loading, loadingText, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          'hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]',
          'transition-all duration-300',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        
        {/* Content */}
        <span className="relative flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? loadingText || children : children}
        </span>
      </Button>
    );
  }
);

ActionButton.displayName = 'ActionButton'; 