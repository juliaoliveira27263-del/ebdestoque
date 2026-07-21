import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    productsRes,
    lowStockRes,
    pendingRes,
    industriesRes,
    usersRes,
    movementsRes,
    stockByIndustryRes,
    requestsByStatusRes,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .filter('stock_quantity', 'lt', 'min_stock'),
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('industries').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('movements').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('stock_quantity, industry:industries(name)'),
    supabase.from('requests').select('status'),
  ]);

  const industryMap = new Map<string, number>();
  for (const row of stockByIndustryRes.data ?? []) {
    const name = (row.industry as { name?: string } | null)?.name ?? 'Sem indústria';
    industryMap.set(name, (industryMap.get(name) ?? 0) + (row.stock_quantity ?? 0));
  }

  const statusMap = new Map<string, number>();
  for (const row of requestsByStatusRes.data ?? []) {
    const status = (row as { status: string }).status;
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  return {
    totalProducts: productsRes.count ?? 0,
    lowStockCount: lowStockRes.count ?? 0,
    pendingRequests: pendingRes.count ?? 0,
    totalIndustries: industriesRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    totalMovements: movementsRes.count ?? 0,
    stockByIndustry: Array.from(industryMap.entries()).map(([industry, stock]) => ({
      industry,
      stock,
    })),
    requestsByStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    })),
  };
}
