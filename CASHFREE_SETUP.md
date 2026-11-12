# Cashfree course and test payments

1. Run `src/supabase/migrations/secure_cashfree_fulfillment.sql` in Supabase SQL Editor before deploying this update. Install the existing `add_sales_cashfree.sql` migration first if the sales tables are missing. Existing course lesson/PDF access migrations must also be applied. Run `src/supabase/migrations/prevent_duplicate_content_purchases.sql` after `add_cart_checkout.sql` and `add_referrals.sql` to block repeat and overlapping-content purchases on the server.
2. Configure server-only `SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_CLIENT_ID`, and `CASHFREE_CLIENT_SECRET`; set `VITE_SITE_URL` to the deployed HTTPS site. For sandbox use the sandbox credentials and set both `CASHFREE_MODE` and `VITE_CASHFREE_MODE` to `sandbox`.
3. Configure Cashfree payment webhooks at `https://YOUR-SITE/api/cashfree-webhook`, and whitelist the checkout site in Cashfree. The webhook verifies signatures using the matching Cashfree client secret (or the optional webhook secret override).
4. Set a long random `CRON_SECRET` in Vercel. Cashfree orders expire after 20 minutes, leaving a buffer above the provider's 15-minute minimum. Vercel Hobby does not allow a five-minute cron, so enable pg_cron, pg_net, and Vault in Supabase, add Vault secrets `vercel_expire_orders_url` (your production URL ending in `/api/expire-orders`) and `vercel_cron_secret` (the same value as Vercel `CRON_SECRET`), then run `src/supabase/migrations/schedule_expire_orders_supabase_cron.sql`. This schedules the order reconciliation every five minutes from Supabase and releases reserved referral credit after Cashfree confirms closure. Deploy only the once-daily `/api/backup` job through Vercel.
5. In the admin sales page create an active plan with its price and selected courses/test series. Students buy it under Buy Courses & Tests.
6. Verify with a sandbox student: unpaid/failed payments must not unlock content; a successful payment unlocks the selected content, refreshes the profile, and creates one purchase. Repeated webhook deliveries must not duplicate grants. Use Check payment if the webhook is delayed.

Existing free test series and administrator-assigned access remain supported. Checkout return URLs and browser checkout results alone never grant access. The backend confirms Cashfree order identity, customer, INR amount and PAID status, or accepts an authenticated matching success webhook. Access, purchase recording, and paid status are committed in one database transaction.

Local automated tests mock the provider; a real payment and database migration have not been executed by these tests.

## Google Sheets backup mirror

Copy `scripts/google-sheets-backup.gs` into a Google Apps Script project. Create a spreadsheet and set the script properties `BACKUP_SPREADSHEET_ID` and `BACKUP_SECRET`. Deploy the script as a Web app, execute as the owner, and allow access to anyone; requests are authorized by the secret. Set the resulting `/exec` URL as Vercel `GOOGLE_SHEETS_BACKUP_URL` and set the same secret as `GOOGLE_SHEETS_BACKUP_SECRET`. Re-deploy to apply environment variables. Manual and daily backups then store the full JSON snapshot in chunked rows on the spreadsheet's **Backup Archive** tab; each backup has a unique ID and timestamp. A missing or failed Sheets mirror marks the backup run as failed in Settings > Backup History.

The migration also prevents signup metadata from self-assigning administrator privileges or course access. Admin provisioning continues through the authenticated server API.

## Course shop and cart

Apply `src/supabase/migrations/add_cart_checkout.sql` after `secure_cashfree_fulfillment.sql`, then `src/supabase/migrations/add_sales_plan_preview_pdf.sql`, before deploying the cart and schedule-preview update. The new RPCs are service-role-only; cart prices and order content come from the database.

Admins open **Prices & Bundles**. Choose an individual course/test series, enter its price, and save an active plan to display its card. For a bundle, use **All-in-one bundle**, **All courses**, **All test series**, or **Choose custom bundle**, then set one total price. All-in-one includes the current catalog at save time. Edit it to include future additions. Saving price and included items is atomic.

New students land on **Shop Courses & Tests** after signup verification. The cart persists on the device per student, supports removal, and charges all selected plans in one Cashfree checkout. Fully unlocked plans show **Open content** and are excluded from checkout. Plans containing any course or test series the student already owns are blocked from purchase, including overlapping bundles; the database also blocks duplicate content in an active payment order. The payment provider displays the authoritative checkout amount if an admin changes a price before checkout.

Admins can add an optional test-schedule PDF link to a purchase plan. The storefront shows a **Preview test schedule PDF** button before checkout. Google Drive previews must be shared as **Anyone with the link: Viewer**. Apply `harden_api_access.sql` first, then `src/supabase/migrations/add_test_availability.sql`, to let admins set the exact availability date and time for each test; a blank date means the test is available immediately.

Each new order snapshots selected plans and included content. Editing a bundle after an order is created does not change that order's access grant. Existing single-plan orders remain supported. Apply database migrations in the documented order; do not re-run older fulfillment migrations after the cart migration.

## Permanent plan deletion

Apply `src/supabase/migrations/allow_permanent_plan_delete.sql` after the cart migration. Delete now permanently removes active or inactive plans. The database transaction saves snapshots for legacy orders, clears their plan references, retains payment records, and deletes the plan and its included-item rows. Existing access is preserved. New checkouts cannot use the deleted plan; already created orders can still finish payment.
