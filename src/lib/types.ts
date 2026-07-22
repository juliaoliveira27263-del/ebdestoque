export type UserRole = 'admin' | 'promotor' | 'supervisor' | 'vendedor';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  city: string | null;
}

export interface Industry {
  id: string;
  name: string;
  cnpj: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category_id: string | null;
  industry_id: string | null;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Request {
  id: string;
  user_id: string;
  status: RequestStatus;
  notes: string | null;
  total_items: number;
  created_at: string;
  updated_at: string;
}

export interface RequestItem {
  id: string;
  request_id: string;
  product_id: string;
  quantity: number;
  industry_id: string | null;
  created_at: string;
}

export type MovementType = 'in' | 'out' | 'adjustment';

export interface Movement {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  user_id: string | null;
  request_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  related_id: string | null;
  created_at: string;
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  promotor: 'Promotor',
  supervisor: 'Supervisor',
  vendedor: 'Vendedor',
};

export const statusLabels: Record<RequestStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export const movementTypeLabels: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Saída',
  adjustment: 'Ajuste',
};
