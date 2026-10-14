# Referral system

Apply `src/supabase/migrations/add_referrals.sql` in the Supabase SQL editor after the existing cart/payment migrations, then deploy the app and API together. The migration is also included at the end of `src/supabase/schema.sql` for fresh databases.

Students can open **Refer & Earn** to copy their code or signup link. Signup records the referrer only after email verification. Admins can open **Referrals** to view signups and first-purchase rewards. Attribution is fixed at signup; existing accounts cannot add or replace a referrer.

The referrer receives **₹100 store credit** when their friend completes their first positive-value purchase. Only verified payment fulfillment awards credit. Repeated webhook delivery or subsequent purchases do not award another reward. Suspended referrers do not earn new rewards. Credit survives deletion of the friend's account.

To change the amount manually:

```sql
UPDATE public.referral_settings SET reward_amount = 150 WHERE id = 1;
```

Changes apply to future qualifying purchases; earned rewards keep their recorded amount. Set the amount to zero to stop new rewards.

Students can select **Use store credit** in their cart. Prices and balances are calculated on the server. At least ₹1 remains payable through Cashfree. Concurrent checkouts cannot reserve the same credit twice. The invoice shows applied store credit separately from the amount paid.

Credit orders expire at Cashfree after 30 minutes. Refreshing Refer & Earn or the shop checks up to five unfinished credit orders and releases credit only for provider-confirmed expired/terminated orders. A failed payment attempt keeps its reservation because the order can still be retried. [Cashfree's order documentation](https://github.com/cashfree/cashfree-pg-sdk-nodejs/blob/main/docs/Orders.md) describes expiry behavior.

If order creation times out or its provider state cannot be fetched, credit stays reserved. An administrator must confirm the order was never created, or has permanently expired/terminated, before manually setting `credit_released = true` on that unpaid order. Never release credit solely because an attempt failed.

There is no automatic refund/clawback integration in this app. If a qualifying payment is refunded outside the app, reconcile its referral credit manually before refunding. This feature tracks and redeems store credit; it does not pay cash.
