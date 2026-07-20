import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variants: Record<string, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg',
  outline:
    'border border-border bg-card text-foreground shadow-sm hover:bg-muted',
  ghost: 'hover:bg-muted text-foreground',
  destructive:
    'bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90',
};

const sizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const button = e.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const existing = button.getElementsByClassName('ripple')[0];
  if (existing) existing.remove();

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, variant = 'primary', size = 'md', onClick, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
          variants[variant],
          sizes[size],
          className
        )}
        onClick={(e) => {
          createRipple(e);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
RippleButton.displayName = 'RippleButton';
