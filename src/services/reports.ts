import { supabase } from '../lib/supabase';
import type { Product, Movement, Industry } from '../lib/types';

export interface ReportData {
  totalProducts: number;
  totalItems: number;
  lowStockCount: number;
  totalIndustries: number;
  stockByIndustry: { name: string; quantidade: number }[];
  movementsByType: { name: string; quantidade: number }[];
}

export async function fetchReportData(): Promise<ReportData> {
  const [{ data: prodData }, { data: indData }, { data: movData }] = await Promise.all([
    supabase.from('products').select('*, industries(name)').eq('active', true),
    supabase.from('industries').select('*').eq('active', true),
    supabase.from('movements').select('*'),
  ]);

  const products = (prodData as Product[]) || [];
  const industries = (indData as Industry[]) || [];
  const movements = (movData as Movement[]) || [];

  const stockByIndustry = industries.map((i: any) => ({
    name: i.name,
    quantidade: products.filter((p: any) => p.industry_id === i.id).reduce((s: number, p: any) => s + p.quantity, 0),
  }));

  const movementsByType = (['in', 'out', 'adjustment'] as const).map((t: any) => ({
    name: t,
    quantidade: movements.filter((m: any) => m.type === t).length,
  }));

  return {
    totalProducts: products.length,
    totalItems: products.reduce((s: number, p: any) => s + p.quantity, 0),
    lowStockCount: products.filter((p: any) => p.quantity <= p.min_quantity).length,
    totalIndustries: industries.length,
    stockByIndustry,
    movementsByType,
  };
}
