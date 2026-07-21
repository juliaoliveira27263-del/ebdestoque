import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    { count: totalProducts },
    { count: totalIndustries },
    { count: totalUsers },
    { count: totalMovements },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('industries').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('movements').select('*', { count: 'exact', head: true }),
  ]);

  const { count: lowStockCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .filter('stock_quantity', 'lt', 'min_stock');

  const { count: pendingRequests } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { data: stockData } = await supabase
    .from('products')
    .select('stock_quantity, industry:industries(name)');

  const industryMap = new Map<string, number>();
  (stockData || []).forEach((item: { stock_quantity: number; industry: { name: string }[] | null }) => {
    const name = item.industry?.[0]?.name || 'Sem indústria';
    industryMap.set(name, (industryMap.get(name) || 0) + (item.stock_quantity || 0));
  });
  const stockByIndustry = Array.from(industryMap.entries()).map(([industry, stock]) => ({
    industry,
    stock,
  }));

  const { data: requestsData } = await supabase
    .from('requests')
    .select('status');

  const statusMap = new Map<string, number>();
  (requestsData || []).forEach((item: { status: string }) => {
    statusMap.set(item.status, (statusMap.get(item.status) || 0) + 1);
  });
  const requestsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  return {
    totalProducts: totalProducts || 0,
    lowStockCount: lowStockCount || 0,
    pendingRequests: pendingRequests || 0,
    totalIndustries: totalIndustries || 0,
    totalUsers: totalUsers || 0,
    totalMovements: totalMovements || 0,
    stockByIndustry,
    requestsByStatus,
  };
}
