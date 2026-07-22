export type UserRole = 'admin' | 'non_admin';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';
export type MovementType = 'in' | 'out' | 'adjustment';

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  non_admin: 'Usuário',
};

export const statusLabels: Record<RequestStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  fulfilled: 'Atendido',
};

export const movementTypeLabels: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Saída',
  adjustment: 'Ajuste',
};

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Industry {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  industry_id: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  active: boolean;
  created_at: string;
  industries?: { name: string }[] | null;
}

export interface Movement {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  reason: string;
  user_id: string;
  created_at: string;
  products?: { name: string; sku: string } | null;
}

export interface Request {
  id: string;
  product_id: string;
  quantity: number;
  status: RequestStatus;
  user_id: string;
  notes: string;
  created_at: string;
  products?: { name: string; sku: string } | null;
  profiles?: { name: string } | null;
}
