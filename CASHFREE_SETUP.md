# Cashfree course and test payments

1. Run `src/supabase/migrations/secure_cashfree_fulfillment.sql` in Supabase SQL Editor before deploying this update. Install the existing `add_sales_cashfree.sql` migration first if the sales tables are missing. Existing course lesson/PDF access migrations must also be applied.
2. Configure server-only `SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_CLIENT_ID`, and `CASHFREE_CLIENT_SECRET`; set `VITE_SITE_URL` to the deployed HTTPS site. For sandbox use the sandbox credentials and set both `CASHFREE_MODE` and `VITE_CASHFREE_MODE` to `sandbox`.
3. Configure Cashfree payment webhooks at `https://YOUR-SITE/api/cashfree-webhook`, and whitelist the checkout site in Cashfree. The webhook verifies signatures using the matching Cashfree client secret (or the optional webhook secret override).
4. In the admin sales page create an active plan with its price and selected courses/test series. Students buy it under Buy Courses & Tests.
5. Verify with a sandbox student: unpaid/failed payments must not unlock content; a successful payment unlocks the selected content, refreshes the profile, and creates one purchase. Repeated webhook deliveries must not duplicate grants. Use Check payment if the webhook is delayed.

Existing free test series and administrator-assigned access remain supported. Checkout return URLs and browser checkout results alone never grant access. The backend confirms Cashfree order identity, customer, INR amount and PAID status, or accepts an authenticated matching success webhook. Access, purchase recording, and paid status are committed in one database transaction.

Local automated tests mock the provider; a real payment and database migration have not been executed by these tests.

The migration also prevents signup metadata from self-assigning administrator privileges or course access. Admin provisioning continues through the authenticated server API.
