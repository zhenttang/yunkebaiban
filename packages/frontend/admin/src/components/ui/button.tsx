import { cn } from '@yunke/admin/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-primary to-primary-hover text-primary-foreground shadow-sm hover:shadow',
        destructive:
          'bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-sm hover:shadow',
        outline:
          'border border-input bg-background hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30',
        secondary:
          'bg-gradient-to-b from-secondary to-secondary-hover text-secondary-foreground shadow-sm',
        ghost: 'hover:bg-accent/30 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        subtle: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground backdrop-blur-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
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
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && 'opacity-70 pointer-events-none relative'
        )}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
