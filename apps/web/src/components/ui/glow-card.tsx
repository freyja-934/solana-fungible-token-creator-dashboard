'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/10 bg-card/50 backdrop-blur-md',
          'transition-all duration-300 hover:scale-[1.02]',
          'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
          'hover:border-primary/50',
          className
        )}
        {...props}
      >
        {/* Glow effect overlay */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlowCard.displayName = 'GlowCard'; 