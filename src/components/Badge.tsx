import { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-dark-200',
  success: 'bg-success-100 text-success-700 dark:bg-success-700/30 dark:text-success-500',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-500',
  error: 'bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-500',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
