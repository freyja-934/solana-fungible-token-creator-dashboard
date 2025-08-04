'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

export interface ShimmerBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  borderWidth?: string;
}

export const ShimmerBorder = React.forwardRef<HTMLDivElement, ShimmerBorderProps>(
  ({ className, children, borderRadius = '1rem', borderWidth = '2px', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        style={{
          '--border-radius': borderRadius,
          '--border-width': borderWidth,
        } as React.CSSProperties}
        {...props}
      >
        {/* Animated border */}
        <div className="absolute inset-0 rounded-[var(--border-radius)] p-[var(--border-width)]">
          <div className="absolute inset-0 rounded-[var(--border-radius)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary animate-shimmer" />
            </div>
          </div>
        </div>
        
        {/* Background */}
        <div className="absolute inset-[var(--border-width)] rounded-[var(--border-radius)] bg-card" />
        
        {/* Content */}
        <div className="relative rounded-[var(--border-radius)] bg-card border border-white/10 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }
);

ShimmerBorder.displayName = 'ShimmerBorder'; 