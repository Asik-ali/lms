import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('referral SQL awards once, reserves credit, preserves history, and blocks client writes', async () => {
  const db = new PGlite();
  const inviter = '00000000-0000-4000-8000-000000000001';
  const friend = '00000000-0000-4000-8000-000000000002';
  const laterFriend = '00000000-0000-4000-8000-000000000003';
  const suspendedFriend = '00000000-0000-4000-8000-000000000004';
  const value = async sql => (await db.query(sql)).rows[0];
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE TABLE profiles (id UUID PRIMARY KEY, role TEXT, status TEXT DEFAULT 'Active', course TEXT, test_series_access TEXT);
      CREATE TABLE pending_signups (id BIGINT PRIMARY KEY);
      CREATE TABLE sales_plans (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT, description TEXT, price NUMERIC, status TEXT);
      CREATE TABLE sales_plan_items (plan_id BIGINT, item_type TEXT, item_id BIGINT);
      CREATE TABLE courses (id BIGINT PRIMARY KEY, title TEXT);
      CREATE TABLE test_series (id BIGINT PRIMARY KEY, name TEXT);
      CREATE TABLE purchase_orders (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, order_id TEXT UNIQUE, plan_id BIGINT NOT NULL,
        student_id UUID REFERENCES profiles(id) ON DELETE CASCADE, amount NUMERIC, status TEXT, created_at TIMESTAMPTZ DEFAULT now());
      CREATE TABLE purchases (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, order_id TEXT UNIQUE, plan_id BIGINT NOT NULL,
        student_id UUID REFERENCES profiles(id) ON DELETE CASCADE, amount NUMERIC, granted BOOLEAN, created_at TIMESTAMPTZ DEFAULT now());
      INSERT INTO profiles(id, role) VALUES ('${inviter}','student'), ('${friend}','student'), ('${laterFriend}','student'), ('${suspendedFriend}','student');
      INSERT INTO courses VALUES (10, 'Maths');
      INSERT INTO sales_plans(name, price, status) VALUES ('Maths',150,'active');
      INSERT INTO sales_plan_items VALUES (1,'course',10);
    `);
    await db.exec(await readFile(new URL('../src/supabase/migrations/add_cart_checkout.sql', import.meta.url), 'utf8'));
    const migration = await readFile(new URL('../src/supabase/migrations/add_referrals.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration); // safe to reapply without resetting the configured amount
    await db.exec(`INSERT INTO referrals(referrer_id,referred_id) VALUES ('${inviter}','${friend}'), ('${inviter}','${laterFriend}'), ('${inviter}','${suspendedFriend}')`);
    await db.exec(`SELECT create_purchase_cart('friend-first','${friend}',ARRAY[1]::BIGINT[])`);
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 0);
    await db.exec(`SELECT fulfill_paid_order('friend-first'); SELECT fulfill_paid_order('friend-first')`);
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 100);
    await db.exec(`SELECT create_purchase_cart('friend-second','${friend}',ARRAY[1]::BIGINT[]); SELECT fulfill_paid_order('friend-second')`);
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 100);
    assert.equal((await value(`SELECT course FROM profiles WHERE id='${friend}'`)).course, 'Maths');

    const first = (await value(`SELECT create_purchase_cart_with_credit('redeem','${inviter}',ARRAY[1]::BIGINT[],true) AS cart`)).cart;
    assert.equal(first.amount, 50); assert.equal(first.credit_applied, 100);
    const concurrent = (await value(`SELECT create_purchase_cart_with_credit('another','${inviter}',ARRAY[1]::BIGINT[],true) AS cart`)).cart;
    assert.equal(concurrent.amount, 150); assert.equal(concurrent.credit_applied, 0);
    await db.exec(`SELECT close_purchase_order('redeem','FAILED',false)`);
    assert.equal((await value(`SELECT status FROM purchase_orders WHERE order_id='redeem'`)).status, 'CANCELLING');
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 0);
    await db.exec(`SELECT close_purchase_order('redeem','FAILED',true); SELECT close_purchase_order('redeem','FAILED',true)`);
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 100);
    assert.equal((await value(`SELECT status FROM purchase_orders WHERE order_id='redeem'`)).status, 'FAILED');
    await assert.rejects(db.query(`SELECT fulfill_paid_order('redeem')`), /returned credit/);
    assert.equal((await value(`SELECT count(*)::INTEGER AS count FROM purchases WHERE order_id='redeem'`)).count, 0);

    await db.exec(`UPDATE referral_settings SET reward_amount=75 WHERE id=1;
      SELECT create_purchase_cart('later','${laterFriend}',ARRAY[1]::BIGINT[]); SELECT fulfill_paid_order('later')`);
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 175);
    await db.exec(`UPDATE sales_plans SET price=50 WHERE id=1`);
    const capped = (await value(`SELECT create_purchase_cart_with_credit('capped','${inviter}',ARRAY[1]::BIGINT[],true) AS cart`)).cart;
    assert.equal(capped.amount, 1); assert.equal(capped.credit_applied, 49);
    await db.exec(`SELECT fulfill_paid_order('capped'); SELECT fulfill_paid_order('capped')`);
    await db.exec(`SELECT close_purchase_order('capped','CANCELLED',true)`);
    assert.equal((await value(`SELECT status FROM purchase_orders WHERE order_id='capped'`)).status, 'PAID');
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 126);
    await db.exec(`DELETE FROM profiles WHERE id='${friend}'`);
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 126);
    await db.exec(`UPDATE profiles SET status='Suspended' WHERE id='${inviter}';
      SELECT create_purchase_cart('suspended','${suspendedFriend}',ARRAY[1]::BIGINT[]); SELECT fulfill_paid_order('suspended')`);
    assert.equal(Number((await value(`SELECT referral_credit_balance('${inviter}') AS balance`)).balance), 126);
    await assert.rejects(db.query(`INSERT INTO referrals(referrer_id,referred_id) VALUES ('${laterFriend}','${laterFriend}')`), /check constraint/);
    await db.exec(`SET ROLE authenticated`);
    await assert.rejects(db.query(`UPDATE referrals SET reward_amount=999999`), /permission denied/);
    await assert.rejects(db.query(`SELECT referral_credit_balance('${inviter}')`), /permission denied/);
    await assert.rejects(db.query(`SELECT create_purchase_cart_with_credit('fake','${inviter}',ARRAY[1]::BIGINT[],true)`), /permission denied/);
    await assert.rejects(db.query(`SELECT close_purchase_order('capped','CANCELLED',true)`), /permission denied/);
  } finally { await db.close(); }
});
