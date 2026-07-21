import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [productsRes, lowStockRes, pendingRes, industriesRes, usersRes, movementsRes] =
    await Promise.all([
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
    ]);

  const totalProducts = productsRes.count ?? 0;
  const lowStockCount = lowStockRes.count ?? 0;
  const pendingRequests = pendingRes.count ?? 0;
  const totalIndustries = industriesRes.count ?? 0;
  const totalUsers = usersRes.count ?? 0;
  const totalMovements = movementsRes.count ?? 0;

  const { data: stockData, error: stockError } = await supabase
    .from('products')
    .select('stock_quantity, industry:industries(name)');

  const stockByIndustry: { industry: string; stock: number }[] = [];
  if (!stockError && stockData) {
    const industryMap = new Map<string, number>();
    for (const row of stockData) {
      const name = (row.industry as unknown as { name: string } | null)?.name ?? 'Sem indústria';
      industryMap.set(name, (industryMap.get(name) ?? 0) + (row.stock_quantity ?? 0));
    }
    for (const [industry, stock] of industryMap) {
      stockByIndustry.push({ industry, stock });
    }
  }

  const { data: reqData, error: reqError } = await supabase
    .from('requests')
    .select('status');

  const requestsByStatus: { status: string; count: number }[] = [];
  if (!reqError && reqData) {
    const statusMap = new Map<string, number>();
    for (const row of reqData) {
      const status = (row as { status: string }).status;
      statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
    }
    for (const [status, count] of statusMap) {
      requestsByStatus.push({ status, count });
    }
  }

  return {
    totalProducts,
    lowStockCount,
    pendingRequests,
    totalIndustries,
    totalUsers,
    totalMovements,
    stockByIndustry,
    requestsByStatus,
  };
}
