import type { UserRole, RequestStatus, MovementType } from '@/types';

export const APP_NAME = 'EBD Petrolina';
export const APP_SUBTITLE = 'Gestão de Estoque';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  promotor: 'Promotor',
  supervisor: 'Supervisor',
  vendedor: 'Vendedor',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  promotor: 'bg-secondary text-secondary-foreground',
  supervisor: 'bg-accent text-accent-foreground',
  vendedor: 'bg-muted text-muted-foreground',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  fulfilled: 'Atendido',
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  fulfilled: 'bg-secondary text-secondary-foreground',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Saída',
  adjustment: 'Ajuste',
};

export const MOVEMENT_TYPE_COLORS: Record<MovementType, string> = {
  in: 'bg-success/15 text-success',
  out: 'bg-destructive/15 text-destructive',
  adjustment: 'bg-muted text-muted-foreground',
};
