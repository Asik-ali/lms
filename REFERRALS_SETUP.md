# Referral system

Apply `src/supabase/migrations/add_referrals.sql` in the Supabase SQL editor after the existing cart/payment migrations, then deploy the app and API together. The migration is also included at the end of `src/supabase/schema.sql` for fresh databases.

If referrals are already installed, apply `src/supabase/migrations/restore_failed_order_credit.sql` before deploying the failed/cancelled payment update. New installs of `add_referrals.sql` already include this update.

Students can open **Refer & Earn** to copy their code or signup link. Signup records the referrer only after email verification. Admins can open **Referrals** to view signups and first-purchase rewards. Attribution is fixed at signup; existing accounts cannot add or replace a referrer.

The referrer receives **₹100 store credit** when their friend completes their first positive-value purchase. Only verified payment fulfillment awards credit. Repeated webhook delivery or subsequent purchases do not award another reward. Suspended referrers do not earn new rewards. Credit survives deletion of the friend's account.

To change the amount manually:

```sql
UPDATE public.referral_settings SET reward_amount = 150 WHERE id = 1;
```

Changes apply to future qualifying purchases; earned rewards keep their recorded amount. Set the amount to zero to stop new rewards.

Students can select **Use store credit** in their cart. Prices and balances are calculated on the server. At least ₹1 remains payable through Cashfree. Concurrent checkouts cannot reserve the same credit twice. The invoice shows applied store credit separately from the amount paid.

Credit orders expire at Cashfree after 30 minutes. A failed payment, a user-dropped payment, closing the checkout modal, or clicking **Cancel order** requests provider termination. Once Cashfree confirms termination/expiry, the app marks the order **Failed** or **Cancelled** and returns exactly its applied store credit, once. This does not award a new referral reward. While Cashfree reports a pending termination, the app shows **Cancelling** and holds the reservation until closure is confirmed. Successful payments always take precedence. [Cashfree's termination API](https://www.postman.com/cashfreedevelopers/cashfree-apis-v2025-01-01/request/ufk95ul/terminate-order) documents this asynchronous behavior.

**Check payment** refreshes the order status from Cashfree without charging again. History refresh checks up to ten unfinished orders; the credit balance checks up to five. Old failed/cancelled orders with unreleased credit are reconciled through the same flow. Orders with returned credit show the returned amount in history.

If order creation times out or its provider state cannot be fetched, credit stays reserved. An administrator must confirm the order was never created, or has permanently expired/terminated, before manually setting `credit_released = true` on that unpaid order. Never release credit solely because an attempt failed.

There is no automatic refund/clawback integration in this app. If a qualifying payment is refunded outside the app, reconcile its referral credit manually before refunding. This feature tracks and redeems store credit; it does not pay cash.
