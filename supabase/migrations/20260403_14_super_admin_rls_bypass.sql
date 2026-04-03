-- Helper function (SECURITY DEFINER bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Super admin can SELECT all profiles
CREATE POLICY "profiles_super_admin_select" ON profiles
FOR SELECT TO public
USING (is_super_admin());

-- Super admin can UPDATE any profile (suspend/unsuspend)
CREATE POLICY "profiles_super_admin_update" ON profiles
FOR UPDATE TO public
USING (is_super_admin());
