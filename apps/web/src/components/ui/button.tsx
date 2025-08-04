import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 press-effect',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-violet-600 to-purple-600 text-primary-foreground shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] glow-hover',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02]',
        outline:
          'border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] glass-hover',
        secondary:
          'bg-white/[0.05] text-secondary-foreground hover:bg-white/[0.08] backdrop-blur-sm hover:scale-[1.02] glass',
        ghost: 'hover:bg-white/[0.05] hover:text-accent-foreground hover:scale-[1.02]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-9 rounded-xl px-4',
        lg: 'h-12 rounded-2xl px-10',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
