import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [productsRes, requestsRes, profilesRes, movementsRes] = await Promise.all([
    supabase.from('products').select('stock_quantity, min_stock, active'),
    supabase.from('requests').select('status'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('movements').select('id', { count: 'exact', head: true }),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (requestsRes.error) throw requestsRes.error;

  const products = productsRes.data ?? [];
  const requests = requestsRes.data ?? [];

  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0);
  const lowStockCount = products.filter(
    (p) => p.min_stock > 0 && p.stock_quantity <= p.min_stock
  ).length;

  return {
    totalProducts: products.length,
    totalStock,
    lowStockCount,
    pendingRequests: requests.filter((r) => r.status === 'pending').length,
    approvedRequests: requests.filter((r) => r.status === 'approved').length,
    totalUsers: profilesRes.count ?? 0,
    totalMovements: movementsRes.count ?? 0,
  };
}

export interface StockByCategory {
  category: string;
  quantity: number;
}

export async function fetchStockByCategory(): Promise<StockByCategory[]> {
  const { data, error } = await supabase
    .from('products')
    .select('stock_quantity, category:categories(name)');
  if (error) throw error;

  const map = new Map<string, number>();
  for (const p of data ?? []) {
    const catName = ((p as { category?: { name?: string } | null }).category)?.name ?? 'Sem categoria';
    map.set(catName, (map.get(catName) ?? 0) + (p.stock_quantity ?? 0));
  }
  return Array.from(map.entries()).map(([category, quantity]) => ({ category, quantity }));
}

export interface RequestsByStatus {
  status: string;
  count: number;
}

export async function fetchRequestsByStatus(): Promise<RequestsByStatus[]> {
  const { data, error } = await supabase.from('requests').select('status');
  if (error) throw error;

  const map = new Map<string, number>([
    ['pending', 0],
    ['approved', 0],
    ['rejected', 0],
    ['fulfilled', 0],
  ]);
  for (const r of data ?? []) {
    map.set(r.status, (map.get(r.status) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}

export interface MovementsByDay {
  date: string;
  in: number;
  out: number;
}

export async function fetchMovementsByDay(days = 14): Promise<MovementsByDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('movements')
    .select('type, quantity, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;

  const map = new Map<string, MovementsByDay>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: key, in: 0, out: 0 });
  }

  for (const m of data ?? []) {
    const key = (m.created_at as string).slice(0, 10);
    const entry = map.get(key);
    if (!entry) continue;
    if (m.type === 'in') entry.in += m.quantity;
    if (m.type === 'out') entry.out += m.quantity;
  }

  return Array.from(map.values());
}
