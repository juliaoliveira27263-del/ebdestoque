export type UserRole = 'admin' | 'supervisor' | 'vendedor' | 'promotor';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Industry {
  id: string;
  name: string;
  logo_url: string | null;
  cnpj: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
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
  industry?: Industry | null;
  category?: Category | null;
}

export interface Request {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes: string | null;
  total_items: number;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
  request_items?: RequestItem[];
}

export interface RequestItem {
  id: string;
  request_id: string;
  product_id: string;
  quantity: number;
  industry_id: string | null;
  created_at: string;
  product?: Product | null;
  industry?: Industry | null;
}

export interface Movement {
  id: string;
  product_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string | null;
  user_id: string | null;
  request_id: string | null;
  created_at: string;
  product?: Product | null;
  profile?: Profile | null;
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
