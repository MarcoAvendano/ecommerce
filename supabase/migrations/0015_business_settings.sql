-- Business settings singleton table
CREATE TABLE business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Mi Negocio',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS set_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER set_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Insert the single default record
INSERT INTO business_settings (name) VALUES ('Mi Negocio');

-- RLS: only admins can update, authenticated users can read
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view business settings"
  ON business_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update business settings"
  ON business_settings FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));
