import type { UserRole, RequestStatus, MovementType } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  promotor: 'Promotor',
  supervisor: 'Supervisor',
  vendedor: 'Vendedor',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  promotor: 'bg-accent text-accent-foreground',
  supervisor: 'bg-secondary text-secondary-foreground',
  vendedor: 'bg-muted text-foreground',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  fulfilled: 'Entregue',
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: 'bg-warning text-warning-foreground',
  approved: 'bg-success text-success-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  fulfilled: 'bg-secondary text-secondary-foreground',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Saída',
  adjustment: 'Ajuste',
};

export const MOVEMENT_TYPE_COLORS: Record<MovementType, string> = {
  in: 'text-success',
  out: 'text-destructive',
  adjustment: 'text-warning',
};

export const APP_NAME = 'EBD Petrolina';
export const APP_SUBTITLE = 'Gestão de Estoque';
