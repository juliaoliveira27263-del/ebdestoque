/*
# Fix FK relationships + Add Industries

## Overview
1. Fixes the PGRST200 error when querying movements/requests with `profile:profiles(*)` join.
   The movements.user_id and requests.user_id columns previously had FKs to auth.users,
   but PostgREST cannot resolve a nested join to `profiles` through auth.users. We add
   FK constraints directly to `profiles.id` (which itself references auth.users) so the
   join `profile:profiles(*)` works.
2. Adds a new `industries` table to track partner companies (indústrias) that EBD Petrolina works with.
3. Adds `industry_id` to `products` so each product can be linked to a supplier/industry.
4. Adds `industry_id` to `request_items` to track which industry a requested item is destined for
   (where the material is going / where it's being used).

## New Tables
- **industries** — partner companies.
  - id (uuid, PK)
  - name (text, not null)
  - cnpj (text, nullable) — Brazilian company ID
  - contact_name (text, nullable)
  - contact_email (text, nullable)
  - contact_phone (text, nullable)
  - address (text, nullable)
  - active (boolean, default true)
  - created_at, updated_at

## Modified Tables
- **movements**: add FK `movements_user_id_fkey_profiles` referencing `profiles(id)`.
  The existing FK to auth.users is kept (profiles.id is itself an FK to auth.users, so this is a valid composite relationship).
- **requests**: add FK `requests_user_id_fkey_profiles` referencing `profiles(id)`.
- **products**: add column `industry_id uuid` referencing `industries(id) ON DELETE SET NULL`.
- **request_items**: add column `industry_id uuid` referencing `industries(id) ON DELETE SET NULL` —
  records the destination industry for the requested material (where it's going).

## Security
- RLS enabled on `industries`: all authenticated can SELECT; admin full CRUD.
- Existing policies on products/requests/movements unchanged.

## Important Notes
1. The new FKs to profiles are ADDED alongside the existing FKs to auth.users — both can coexist
   because profiles.id has its own FK to auth.users.id. PostgREST will use the profiles FK
   to resolve the `profile:profiles(*)` join.
2. `industry_id` on request_items lets us build a "where did the material go" report.
3. All new columns are nullable so existing rows/products are not affected.
*/

-- ============================================================================
-- Add FK from movements.user_id -> profiles.id (for PostgREST join support)
-- ============================================================================
-- We add a FK to profiles.id. Since profiles.id -> auth.users.id, this is safe.
-- We must drop the existing FK to auth.users first? No — both can coexist.
-- But we can only have one FK per column to a given target. We add a new FK to profiles.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movements_user_id_fkey_profiles' AND conrelid = 'public.movements'::regclass
  ) THEN
    ALTER TABLE public.movements
      ADD CONSTRAINT movements_user_id_fkey_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- Add FK from requests.user_id -> profiles.id (for PostgREST join support)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'requests_user_id_fkey_profiles' AND conrelid = 'public.requests'::regclass
  ) THEN
    ALTER TABLE public.requests
      ADD CONSTRAINT requests_user_id_fkey_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- INDUSTRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  contact_name text,
  contact_email text,
  contact_phone text,
  address text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "industries_select_all" ON public.industries;
CREATE POLICY "industries_select_all" ON public.industries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "industries_insert_admin" ON public.industries;
CREATE POLICY "industries_insert_admin" ON public.industries FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "industries_update_admin" ON public.industries;
CREATE POLICY "industries_update_admin" ON public.industries FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "industries_delete_admin" ON public.industries;
CREATE POLICY "industries_delete_admin" ON public.industries FOR DELETE
  TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS industries_updated_at ON public.industries;
CREATE TRIGGER industries_updated_at BEFORE UPDATE ON public.industries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Add industry_id to products (supplier/origin)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'industry_id'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN industry_id uuid REFERENCES public.industries(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_industry_id ON public.products(industry_id);

-- ============================================================================
-- Add industry_id to request_items (destination — where the material is going)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'request_items' AND column_name = 'industry_id'
  ) THEN
    ALTER TABLE public.request_items
      ADD COLUMN industry_id uuid REFERENCES public.industries(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_request_items_industry_id ON public.request_items(industry_id);

-- ============================================================================
-- REALTIME — add industries to publication
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'industries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.industries;
  END IF;
END $$;

-- ============================================================================
-- Update create_request_with_items to accept industry_id per item
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_request_with_items(
  p_items jsonb,
  p_notes text DEFAULT NULL
)
RETURNS public.requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.requests;
  v_item jsonb;
  v_total integer := 0;
  v_count integer := 0;
  v_user_name text;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cannot create a request with no items';
  END IF;

  INSERT INTO public.requests (user_id, notes)
  VALUES (auth.uid(), p_notes)
  RETURNING * INTO v_request;

  FOR v_item IN SELECT jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.request_items (request_id, product_id, quantity, industry_id)
    VALUES (
      v_request.id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      CASE WHEN v_item ? 'industry_id' AND (v_item->>'industry_id') IS NOT NULL
           THEN (v_item->>'industry_id')::uuid ELSE NULL END
    );
    v_total := v_total + (v_item->>'quantity')::integer;
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.requests SET total_items = v_count WHERE id = v_request.id
  RETURNING * INTO v_request;

  SELECT name INTO v_user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    NULL,
    'new_request',
    'Nova solicitação',
    COALESCE(v_user_name, 'Um usuário') || ' criou uma nova solicitação de ' || v_count || ' item(ns).',
    v_request.id
  );

  RETURN v_request;
END;
$$;
