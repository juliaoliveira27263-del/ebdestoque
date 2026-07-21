import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    { count: totalProducts },
    { count: lowStockCount },
    { count: pendingRequests },
    { count: totalIndustries },
    { count: totalUsers },
    { count: totalMovements },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 'min_stock'),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('industries').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('movements').select('id', { count: 'exact', head: true }),
  ]);

  const { data: stockData } = await supabase
    .from('products')
    .select('stock_quantity, industry:industries(name)');

  const industryMap = new Map<string, number>();
  for (const row of (stockData ?? []) as Array<Record<string, unknown>>) {
    const industry = row.industry as { name: string } | { name: string }[] | null;
    const name = Array.isArray(industry) ? (industry[0]?.name ?? 'Sem indústria') : (industry?.name ?? 'Sem indústria');
    const qty = (row.stock_quantity as number) ?? 0;
    industryMap.set(name, (industryMap.get(name) ?? 0) + qty);
  }
  const stockByIndustry = Array.from(industryMap.entries()).map(([industry, stock]) => ({ industry, stock }));

  const { data: reqData } = await supabase.from('requests').select('status');
  const statusMap = new Map<string, number>();
  for (const row of reqData ?? []) {
    const status = row.status as string;
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }
  const requestsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  return {
    totalProducts: totalProducts ?? 0,
    lowStockCount: lowStockCount ?? 0,
    pendingRequests: pendingRequests ?? 0,
    totalIndustries: totalIndustries ?? 0,
    totalUsers: totalUsers ?? 0,
    totalMovements: totalMovements ?? 0,
    stockByIndustry,
    requestsByStatus,
  };
}
