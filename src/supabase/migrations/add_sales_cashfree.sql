-- Migration: Sales / Sell Courses (combo or individual) + Cashfree purchases
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS sales_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active sales plans" ON sales_plans FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Admins can manage sales plans" ON sales_plans FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS sales_plan_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES sales_plans(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id BIGINT NOT NULL,
  UNIQUE(plan_id, item_type, item_id)
);

ALTER TABLE sales_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sales plan items" ON sales_plan_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM sales_plans WHERE sales_plans.id = sales_plan_items.plan_id AND (sales_plans.status = 'active' OR public.is_admin()))
);
CREATE POLICY "Admins can manage sales plan items" ON sales_plan_items FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  payment_session_id TEXT DEFAULT '',
  plan_id BIGINT NOT NULL REFERENCES sales_plans(id),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own orders" ON purchase_orders FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own orders" ON purchase_orders FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins can read all orders" ON purchase_orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update orders" ON purchase_orders FOR UPDATE USING (public.is_admin());

CREATE TABLE IF NOT EXISTS purchases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  plan_id BIGINT NOT NULL REFERENCES sales_plans(id),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own purchases" ON purchases FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can read all purchases" ON purchases FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert purchases" ON purchases FOR INSERT WITH CHECK (public.is_admin());
