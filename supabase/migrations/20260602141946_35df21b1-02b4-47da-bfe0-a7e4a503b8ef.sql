
-- 1. booking_commissions: only admins can update/delete
CREATE POLICY "bc_update_admin" ON public.booking_commissions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "bc_delete_admin" ON public.booking_commissions
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. pending_flight_bookings: owners can update/delete their own
CREATE POLICY "pfb_update_own" ON public.pending_flight_bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pfb_delete_own" ON public.pending_flight_bookings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. user_roles: only admins can manage roles (server-side via service_role still works)
CREATE POLICY "user_roles_admin_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_admin_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_admin_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. commission_settings: only admins can read pricing config
DROP POLICY IF EXISTS "commission_settings_read_authed" ON public.commission_settings;
CREATE POLICY "commission_settings_read_admin" ON public.commission_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Revoke EXECUTE on has_active_subscription from authenticated; keep for service_role
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
