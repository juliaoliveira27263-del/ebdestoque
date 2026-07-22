import { supabase } from '@/lib/supabase';
import type { Industry } from '@/types';

export interface StockReportRow {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  industry: string;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  status: 'ok' | 'low' | 'out';
  status_label: string;
}

export async function fetchStockReport(): Promise<StockReportRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(name), industry:industries(name)')
    .order('name', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((p) => {
    const row: StockReportRow = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: (p as { category?: { name?: string } | null }).category?.name ?? 'Sem categoria',
      industry: (p as { industry?: { name?: string } | null }).industry?.name ?? 'Sem indústria',
      stock_quantity: p.stock_quantity,
      min_stock: p.min_stock,
      unit: p.unit,
      status: 'ok',
      status_label: 'Normal',
    };
    if (p.stock_quantity <= 0) {
      row.status = 'out';
      row.status_label = 'Sem estoque';
    } else if (p.min_stock > 0 && p.stock_quantity <= p.min_stock) {
      row.status = 'low';
      row.status_label = 'Estoque baixo';
    }
    return row;
  });
}

export interface OutflowReportRow {
  movement_id: string;
  date: string;
  product_name: string;
  product_sku: string | null;
  category: string;
  quantity: number;
  type: string;
  reason: string | null;
  user_name: string;
  industry_name: string | null;
  destination_industry: string | null;
}

export async function fetchOutflowReport(): Promise<OutflowReportRow[]> {
  const { data: movements, error } = await supabase
    .from('movements')
    .select('*, product:products(*, category:categories(name)), profile:profiles(name), request:requests(request_items(*, industry:industries(name)))')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;

  return (movements ?? []).map((m) => {
    const product = (m as { product?: { name?: string; sku?: string | null; category?: { name?: string } | null } }).product;
    const profile = (m as { profile?: { name?: string } | null }).profile;
    const request = (m as { request?: { request_items?: { industry?: { name?: string } | null }[] } | null }).request;
    const destIndustry = request?.request_items?.[0]?.industry?.name ?? null;

    return {
      movement_id: m.id,
      date: m.created_at,
      product_name: product?.name ?? 'Produto removido',
      product_sku: product?.sku ?? null,
      category: product?.category?.name ?? 'Sem categoria',
      quantity: m.quantity,
      type: m.type,
      reason: m.reason,
      user_name: profile?.name ?? '-',
      industry_name: (m as { product?: { industry?: { name?: string } | null } }).product?.industry?.name ?? null,
      destination_industry: destIndustry,
    };
  });
}

export interface DestinationReportRow {
  industry_id: string;
  industry_name: string;
  total_items: number;
  total_requests: number;
  products: { name: string; quantity: number }[];
}

export async function fetchDestinationReport(): Promise<DestinationReportRow[]> {
  const { data, error } = await supabase
    .from('request_items')
    .select('*, product:products(name), industry:industries(*), request:requests(status)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const map = new Map<string, DestinationReportRow>();
  const requestSet = new Map<string, Set<string>>();

  for (const item of data ?? []) {
    const ind = (item as { industry?: Industry | null }).industry;
    if (!ind) continue;
    const req = (item as { request?: { status?: string } }).request;
    if (!req || req.status !== 'approved') continue;

    if (!map.has(ind.id)) {
      map.set(ind.id, {
        industry_id: ind.id,
        industry_name: ind.name,
        total_items: 0,
        total_requests: 0,
        products: [],
      });
      requestSet.set(ind.id, new Set());
    }
    const row = map.get(ind.id)!;
    row.total_items += item.quantity;
    requestSet.get(ind.id)!.add(item.request_id);

    const prodName = (item as { product?: { name?: string } }).product?.name ?? 'Produto removido';
    const existing = row.products.find((p) => p.name === prodName);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      row.products.push({ name: prodName, quantity: item.quantity });
    }
  }

  for (const [indId, row] of map) {
    row.total_requests = requestSet.get(indId)?.size ?? 0;
    row.products.sort((a, b) => b.quantity - a.quantity);
  }

  return Array.from(map.values()).sort((a, b) => b.total_items - a.total_items);
}

export interface StockComparisonRow {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  category: string;
  industry: string;
  current_stock: number;
  total_out: number;
  total_in: number;
  net_change: number;
  status: 'ok' | 'low' | 'out';
}

export async function fetchStockComparison(): Promise<StockComparisonRow[]> {
  const [productsRes, movementsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, unit, stock_quantity, min_stock, category:categories(name), industry:industries(name)')
      .order('name', { ascending: true }),
    supabase
      .from('movements')
      .select('product_id, type, quantity'),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (movementsRes.error) throw movementsRes.error;

  const movMap = new Map<string, { total_out: number; total_in: number }>();
  for (const m of movementsRes.data ?? []) {
    if (!movMap.has(m.product_id)) movMap.set(m.product_id, { total_out: 0, total_in: 0 });
    const entry = movMap.get(m.product_id)!;
    if (m.type === 'out') entry.total_out += m.quantity;
    else if (m.type === 'in') entry.total_in += m.quantity;
  }

  return (productsRes.data ?? []).map((p) => {
    const mov = movMap.get(p.id) ?? { total_out: 0, total_in: 0 };
    const net = mov.total_in - mov.total_out;
    let status: 'ok' | 'low' | 'out' = 'ok';
    if (p.stock_quantity <= 0) status = 'out';
    else if (p.min_stock > 0 && p.stock_quantity <= p.min_stock) status = 'low';
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      category: (p as { category?: { name?: string } | null }).category?.name ?? 'Sem categoria',
      industry: (p as { industry?: { name?: string } | null }).industry?.name ?? 'Sem indústria',
      current_stock: p.stock_quantity,
      total_out: mov.total_out,
      total_in: mov.total_in,
      net_change: net,
      status,
    };
  });
}

export type RankingPeriod = 'today' | 'week' | 'month' | 'all';

export interface RequestRankingRow {
  user_id: string;
  user_name: string;
  user_role: string;
  total_requests: number;
  approved: number;
  rejected: number;
  pending: number;
  total_items: number;
}

function periodFilter(period: RankingPeriod): string | null {
  const now = new Date();
  if (period === 'today') {
    const d = now.toISOString().slice(0, 10);
    return `${d}T00:00:00Z`;
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  }
  return null;
}

export async function fetchRequestRanking(period: RankingPeriod): Promise<RequestRankingRow[]> {
  let query = supabase
    .from('requests')
    .select('id, user_id, status, total_items, profile:profiles(name, role)');

  const since = periodFilter(period);
  if (since) query = query.gte('created_at', since);

  const { data, error } = await query;
  if (error) throw error;

  const map = new Map<string, RequestRankingRow>();
  for (const r of data ?? []) {
    const prof = (r as { profile?: { name?: string; role?: string } | null }).profile;
    if (!r.user_id) continue;
    if (!map.has(r.user_id)) {
      map.set(r.user_id, {
        user_id: r.user_id,
        user_name: prof?.name ?? 'Usuário',
        user_role: prof?.role ?? '',
        total_requests: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        total_items: 0,
      });
    }
    const row = map.get(r.user_id)!;
    row.total_requests++;
    row.total_items += r.total_items ?? 0;
    if (r.status === 'approved') row.approved++;
    else if (r.status === 'rejected') row.rejected++;
    else if (r.status === 'pending') row.pending++;
  }

  return Array.from(map.values()).sort((a, b) => b.total_requests - a.total_requests);
}

export interface ReportSummary {
  totalProducts: number;
  totalStockUnits: number;
  lowStock: number;
  outOfStock: number;
  totalOutflows: number;
  totalDestinations: number;
}

export async function fetchReportSummary(): Promise<ReportSummary> {
  const [products, movements, destReport] = await Promise.all([
    supabase.from('products').select('stock_quantity, min_stock'),
    supabase.from('movements').select('id', { count: 'exact', head: true }),
    fetchDestinationReport(),
  ]);

  if (products.error) throw products.error;

  const prods = products.data ?? [];
  return {
    totalProducts: prods.length,
    totalStockUnits: prods.reduce((s, p) => s + (p.stock_quantity ?? 0), 0),
    lowStock: prods.filter((p) => p.min_stock > 0 && p.stock_quantity > 0 && p.stock_quantity <= p.min_stock).length,
    outOfStock: prods.filter((p) => p.stock_quantity <= 0).length,
    totalOutflows: movements.count ?? 0,
    totalDestinations: destReport.length,
  };
}
