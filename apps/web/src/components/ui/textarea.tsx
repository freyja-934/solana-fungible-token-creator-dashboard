import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3',
          'text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'backdrop-blur-sm transition-all duration-200',
          'hover:bg-white/[0.04] hover:border-white/20',
          'focus:bg-white/[0.05] focus:border-primary/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
