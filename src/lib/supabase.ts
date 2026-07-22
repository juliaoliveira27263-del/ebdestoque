import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

export type Profile = {
  id: string
  name: string
  role: 'admin' | 'solicitante' | 'promotor' | 'supervisor' | 'vendedor'
  phone: string | null
  active: boolean
  avatar_url: string | null
  city: string | null
}

export type Industry = {
  id: string
  name: string
  cnpj: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  active: boolean
  logo_url: string | null
}

export type Product = {
  id: string
  name: string
  description: string | null
  sku: string
  category_id: string | null
  stock_quantity: number
  min_stock: number
  unit: string
  image_url: string | null
  active: boolean
  industry_id: string
}

export type Movement = {
  id: string
  type: string
  quantity: number
  reason: string | null
  created_at: string
  product_id: string
  user_id: string | null
  request_id: string | null
}
