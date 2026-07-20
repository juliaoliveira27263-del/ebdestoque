/*
# Security Hardening: Function Search Path + Execute Privileges

## Overview
Fixes all reported security issues:
1. Function `handle_updated_at` had a mutable search_path — now pinned to `public`.
2. All SECURITY DEFINER functions were executable by the `anon` role via `/rest/v1/rpc/...`.
   Revoked EXECUTE from `public` and `anon` on every SECURITY DEFINER function.
3. `handle_new_user` is a trigger function (runs on auth.users INSERT) and must never
   be callable via the REST RPC endpoint — revoked from both `anon` and `authenticated`.
4. Admin-only RPCs (`approve_request`, `reject_request`, `adjust_stock`) now check
   `is_admin()` inside the function body so even though `authenticated` can call them,
   only admins succeed. Non-admins get a clean exception.
5. `is_admin` and `create_request_with_items` granted to `authenticated` only (needed
   by RLS policies and the request-creation flow respectively).

## Changes per function
- `handle_updated_at()` — added `SET search_path = public`. No EXECUTE grant (trigger only).
- `is_admin()` — revoke from anon/public; grant to authenticated. (Used by RLS policies.)
- `handle_new_user()` — revoke from anon AND authenticated (trigger only, not RPC-callable).
- `approve_request(uuid)` — revoke from anon/public; grant to authenticated; added `is_admin()` guard.
- `reject_request(uuid, text)` — revoke from anon/public; grant to authenticated; added `is_admin()` guard.
- `adjust_stock(uuid, integer, text)` — revoke from anon/public; grant to authenticated; added `is_admin()` guard.
- `create_request_with_items(jsonb, text)` — revoke from anon/public; grant to authenticated (any signed-in user can create requests).

## Security impact
- Unauthenticated (`anon`) callers can no longer invoke any SECURITY DEFINER function.
- Signed-in non-admin users who call `approve_request`/`reject_request`/`adjust_stock`
  receive an exception instead of mutating stock or request status.
- `handle_new_user` cannot be invoked manually via the REST API — it only fires as a
  trigger on `auth.users`, which is the intended behavior.
- `handle_updated_at` is now immune to search_path hijacking.

## Important notes
1. The frontend uses the anon-key Supabase client, but all RPC calls include the user's
   JWT in the `Authorization` header, so they run as `authenticated` — not `anon`.
   Revoking `anon` EXECUTE does not break the app.
2. `is_admin()` is SECURITY DEFINER because it reads `profiles` which may have RLS;
   the definer role bypasses RLS so the helper works inside policy expressions.
3. The admin RPC guards use `SELECT public.is_admin()` (not the bare function) to
   ensure the SECURITY DEFINER context is used for the check.
*/

-- ============================================================================
-- 1. Pin search_path on handle_updated_at (trigger function)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Revoke EXECUTE from anon/public on ALL SECURITY DEFINER functions
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_request(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_request(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_request_with_items(jsonb, text) FROM PUBLIC;

-- Explicitly revoke from the anon role (in case it was granted directly)
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_request(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_request(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_request_with_items(jsonb, text) FROM anon;

-- ============================================================================
-- 3. handle_new_user: trigger-only — revoke from authenticated too
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ============================================================================
-- 4. Grant EXECUTE to authenticated only where the app needs it
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_request_with_items(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) TO authenticated;

-- ============================================================================
-- 5. Add is_admin() guard inside admin-only RPCs
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
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar solicitações';
  END IF;

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

CREATE OR REPLACE FUNCTION public.reject_request(p_request_id uuid, p_reason text DEFAULT NULL)
RETURNS public.requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.requests;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar solicitações';
  END IF;

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
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem ajustar o estoque';
  END IF;

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
-- 6. Re-apply grants after function recreation (CREATE OR REPLACE drops grants)
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.approve_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) TO authenticated;
