import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), industry:industries(*)')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function createProduct(
  input: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'industry'>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(input)
    .select('*, category:categories(*), industry:industries(*)')
    .maybeSingle();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'industry'>>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .select('*, category:categories(*), industry:industries(*)')
    .maybeSingle();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function adjustStock(
  productId: string,
  quantity: number,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_reason: reason,
  });
  if (error) throw error;
}
