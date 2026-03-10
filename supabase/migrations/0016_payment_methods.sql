-- Payment methods configurable table
CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS set_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Seed default payment methods
INSERT INTO payment_methods (name, code) VALUES
  ('Efectivo', 'cash'),
  ('Tarjeta de débito', 'debit_card'),
  ('Tarjeta de crédito', 'credit_card'),
  ('Transferencia bancaria', 'bank_transfer');

-- RLS: authenticated users can read, admins can write
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY "Admins can update payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY "Admins can delete payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (has_role('admin'));
