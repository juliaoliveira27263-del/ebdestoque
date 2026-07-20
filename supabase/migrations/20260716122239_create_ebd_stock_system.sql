/*
# EBD Petrolina Stock Management System - Core Schema

## Overview
Complete ERP schema for managing merchandising material stock for EBD Petrolina.
Supports 4 user roles: admin, promotor (promoter), supervisor, vendedor (salesperson).

## New Tables
1. profiles — extends auth.users with name, role, phone, active status.
2. categories — product categories.
3. products — merchandising items with stock tracking.
4. requests — stock requests created by promotor/supervisor/vendedor.
5. request_items — line items within a request.
6. movements — stock movement history (in/out/adjustment).
7. notifications — admin notifications for new requests and events.

## Helper Functions
- is_admin() — SECURITY DEFINER, returns true if current user has role 'admin'.
- handle_new_user() — trigger on auth.users, auto-creates profile. First user becomes admin.
- handle_updated_at() — trigger to auto-update updated_at on row change.

## RPC Functions
- approve_request(p_request_id) — atomically approves a request, decrements stock, creates movements + notification.
- reject_request(p_request_id, p_reason) — rejects a request, creates notification.
- adjust_stock(p_product_id, p_quantity, p_reason) — admin adjusts stock, creates movement.
- create_request_with_items(p_items, p_notes) — atomically creates request + items + admin notification.

## Security (RLS)
All tables have RLS enabled. Owner-scoped policies use auth.uid() and is_admin().

## Realtime
Tables requests, notifications, movements, products added to supabase_realtime publication.

## Important Notes
1. The first user to sign up automatically becomes admin via the handle_new_user trigger.
2. Stock decrement on approval is atomic via the approve_request RPC.
3. All owner columns default to auth.uid() so frontend inserts work without passing user_id.
*/

-- ============================================================================
-- PROFILES TABLE (created first so is_admin() can reference it)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'promotor', 'supervisor', 'vendedor')),
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- HELPER FUNCTIONS (created right after profiles so policies can use them)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Now enable RLS and create policies on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
CREATE POLICY "categories_insert_admin" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin" ON public.categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin" ON public.categories FOR DELETE
  TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  unit text NOT NULL DEFAULT 'un',
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_all" ON public.products;
CREATE POLICY "products_select_all" ON public.products FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin" ON public.products FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE
  TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  notes text,
  total_items integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select_own_or_admin" ON public.requests;
CREATE POLICY "requests_select_own_or_admin" ON public.requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "requests_insert_own" ON public.requests;
CREATE POLICY "requests_insert_own" ON public.requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "requests_update_admin" ON public.requests;
CREATE POLICY "requests_update_admin" ON public.requests FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "requests_update_own_pending" ON public.requests;
CREATE POLICY "requests_update_own_pending" ON public.requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "requests_delete_admin" ON public.requests;
CREATE POLICY "requests_delete_admin" ON public.requests FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "requests_delete_own_pending" ON public.requests;
CREATE POLICY "requests_delete_own_pending" ON public.requests FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND status = 'pending');

DROP TRIGGER IF EXISTS requests_updated_at ON public.requests;
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- REQUEST_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON public.request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_product_id ON public.request_items(product_id);

ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "request_items_select_scoped" ON public.request_items;
CREATE POLICY "request_items_select_scoped" ON public.request_items FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_items.request_id
      AND (r.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "request_items_insert_scoped" ON public.request_items;
CREATE POLICY "request_items_insert_scoped" ON public.request_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_items.request_id
      AND (r.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "request_items_update_admin" ON public.request_items;
CREATE POLICY "request_items_update_admin" ON public.request_items FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "request_items_delete_admin" ON public.request_items;
CREATE POLICY "request_items_delete_admin" ON public.request_items FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- MOVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  reason text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movements_product_id ON public.movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON public.movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_request_id ON public.movements(request_id);

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movements_select_all" ON public.movements;
CREATE POLICY "movements_select_all" ON public.movements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "movements_insert_admin" ON public.movements;
CREATE POLICY "movements_insert_admin" ON public.movements FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "movements_update_admin" ON public.movements;
CREATE POLICY "movements_update_admin" ON public.movements FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "movements_delete_admin" ON public.movements;
CREATE POLICY "movements_delete_admin" ON public.movements FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own_or_admin" ON public.notifications;
CREATE POLICY "notifications_select_own_or_admin" ON public.notifications FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND public.is_admin())
  );

DROP POLICY IF EXISTS "notifications_insert_own_or_admin" ON public.notifications;
CREATE POLICY "notifications_insert_own_or_admin" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_admin" ON public.notifications;
CREATE POLICY "notifications_update_admin" ON public.notifications FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "notifications_delete_admin" ON public.notifications;
CREATE POLICY "notifications_delete_admin" ON public.notifications FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- AUTH TRIGGER — auto-create profile on signup, first user becomes admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN 'admin' ELSE 'vendedor' END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- RPC: approve_request — atomically approve and decrement stock
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_request(p_request_id uuid)
RETURNS public.requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.requests;
  v_item record;
  v_new_stock integer;
  v_user_name text;
BEGIN
  SELECT * INTO v_request FROM public.requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current: %)', v_request.status;
  END IF;

  FOR v_item IN
    SELECT ri.product_id, ri.quantity, p.stock_quantity, p.name
    FROM public.request_items ri
    JOIN public.products p ON p.id = ri.product_id
    WHERE ri.request_id = p_request_id
  LOOP
    IF v_item.stock_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (available: %, requested: %)',
        v_item.name, v_item.stock_quantity, v_item.quantity;
    END IF;
    v_new_stock := v_item.stock_quantity - v_item.quantity;
    UPDATE public.products SET stock_quantity = v_new_stock WHERE id = v_item.product_id;
    INSERT INTO public.movements (product_id, type, quantity, reason, user_id, request_id)
    VALUES (v_item.product_id, 'out', v_item.quantity, 'Request approved', v_request.user_id, p_request_id);
  END LOOP;

  UPDATE public.requests
  SET status = 'approved'
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  SELECT name INTO v_user_name FROM public.profiles WHERE id = v_request.user_id;
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    v_request.user_id,
    'request_approved',
    'Solicitação aprovada',
    'Sua solicitação foi aprovada pelo administrador.',
    p_request_id
  );

  RETURN v_request;
END;
$$;

-- ============================================================================
-- RPC: reject_request — reject a pending request
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_request(p_request_id uuid, p_reason text DEFAULT NULL)
RETURNS public.requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.requests;
BEGIN
  SELECT * INTO v_request FROM public.requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current: %)', v_request.status;
  END IF;

  UPDATE public.requests
  SET status = 'rejected', notes = COALESCE(p_reason, notes)
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    v_request.user_id,
    'request_rejected',
    'Solicitação rejeitada',
    COALESCE(p_reason, 'Sua solicitação foi rejeitada pelo administrador.'),
    p_request_id
  );

  RETURN v_request;
END;
$$;

-- ============================================================================
-- RPC: adjust_stock — admin manually adjusts product stock
-- ============================================================================

CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_product_id uuid,
  p_quantity integer,
  p_reason text DEFAULT 'Manual adjustment'
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products;
  v_new_stock integer;
  v_type text;
BEGIN
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  v_new_stock := v_product.stock_quantity + p_quantity;
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Resulting stock cannot be negative (current: %, delta: %)',
      v_product.stock_quantity, p_quantity;
  END IF;

  v_type := CASE WHEN p_quantity > 0 THEN 'in' WHEN p_quantity < 0 THEN 'out' ELSE 'adjustment' END;

  UPDATE public.products SET stock_quantity = v_new_stock WHERE id = p_product_id
  RETURNING * INTO v_product;

  INSERT INTO public.movements (product_id, type, quantity, reason, user_id)
  VALUES (p_product_id, v_type, ABS(p_quantity), p_reason, auth.uid());

  RETURN v_product;
END;
$$;

-- ============================================================================
-- RPC: create_request_with_items — atomically create request + items + notify
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
    INSERT INTO public.request_items (request_id, product_id, quantity)
    VALUES (
      v_request.id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer
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

-- ============================================================================
-- REALTIME — add tables to supabase_realtime publication
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'movements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.movements;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

-- Grant execute on RPCs
GRANT EXECUTE ON FUNCTION public.approve_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_request_with_items(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;